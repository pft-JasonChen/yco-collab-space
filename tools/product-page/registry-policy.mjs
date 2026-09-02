import path from 'node:path';
import { createHash } from 'node:crypto';
import { fromRoot, pathExists, readJson, readYaml, sha256File, strapiRoot, toPosix } from './project.mjs';

export async function loadRegistry() {
  const registry = await readYaml(path.join(strapiRoot, 'registry.yaml'));
  const components = new Map();
  const errors = [];
  for (const entry of registry.components ?? []) {
    const relative = path.join(strapiRoot, entry.file);
    if (!(await pathExists(fromRoot(relative)))) {
      errors.push('Component file is missing: ' + entry.file);
      continue;
    }
    const definition = await readJson(relative);
    if (definition.uid !== entry.uid) errors.push('Component uid mismatch in ' + entry.file + ': ' + definition.uid);
    components.set(entry.uid, definition);
  }
  let contentType = null;
  const contentTypePath = path.join(strapiRoot, registry.contentType.file);
  if (await pathExists(fromRoot(contentTypePath))) {
    contentType = await readJson(contentTypePath);
    if (contentType.uid !== registry.contentType.uid) errors.push('Content-type uid mismatch: ' + contentType.uid);
  } else errors.push('Content-type file is missing: ' + registry.contentType.file);
  let sharedAssets = { assets: [] };
  const sharedAssetsPath = path.join(strapiRoot, registry.sharedAssets);
  if (await pathExists(fromRoot(sharedAssetsPath))) sharedAssets = await readJson(sharedAssetsPath);
  else errors.push('Shared assets file is missing: ' + registry.sharedAssets);
  return { registry, components, contentType, sharedAssets, errors };
}

export async function registryHash() {
  const { walkFiles } = await import('../prototype-cli/project.mjs');
  const files = await walkFiles(fromRoot(strapiRoot), (file) => !path.basename(file).startsWith('.'));
  const hash = createHash('sha256');
  for (const file of files) hash.update(toPosix(path.relative(fromRoot(), file)) + '\0' + (await sha256File(file)) + '\0');
  return hash.digest('hex');
}

const scalarTypes = new Set(['string', 'text', 'richtext', 'enumeration', 'boolean', 'integer', 'decimal', 'json', 'datetime', 'media']);

export function componentSemanticErrors(definition, components) {
  const errors = [];
  const prefix = definition.uid + ': ';
  function walk(fields, location) {
    for (const [name, field] of Object.entries(fields ?? {})) {
      const where = prefix + location + name;
      if (field.type === 'component') {
        if (field.component === 'inline') {
          if (!field.fields || typeof field.fields !== 'object') errors.push(where + ' inline component needs fields');
          else walk(field.fields, location + name + '.');
        } else if (!components.has(field.component)) errors.push(where + ' references unknown component ' + field.component);
      } else if (field.type === 'dynamiczone') {
        for (const uid of field.components ?? []) {
          if (!components.has(uid)) errors.push(where + ' dynamic zone references unknown component ' + uid);
          else if (!components.get(uid).dynamicZone) errors.push(where + ' component is not allowed in a dynamic zone: ' + uid);
        }
      } else if (!scalarTypes.has(field.type)) errors.push(where + ' has unsupported type ' + field.type);
      if (field.type === 'enumeration' && !Array.isArray(field.values)) errors.push(where + ' enumeration needs values');
    }
  }
  walk(definition.fields ?? definition.attributes, '');
  for (const layoutField of definition.layoutFields ?? []) {
    if (!(layoutField in (definition.fields ?? {}))) errors.push(prefix + 'layoutFields references unknown field ' + layoutField);
  }
  return errors;
}

/** Resolve a dotted field path such as `sectionBeAfMedia.imageBeforeDesktop` or `cta[].ctaText`. */
export function resolveFieldPath(definition, components, fieldPath) {
  let fields = definition.fields ?? definition.attributes ?? {};
  let field = null;
  for (const rawSegment of fieldPath.split('.')) {
    const segment = rawSegment.replace(/\[\]$/, '');
    field = fields[segment];
    if (!field) return null;
    if (field.type === 'component') {
      if (field.component === 'inline') fields = field.fields ?? {};
      else {
        const nested = components.get(field.component);
        if (!nested) return null;
        fields = nested.fields ?? {};
      }
    } else fields = {};
  }
  return field;
}

function isAssetRef(value) {
  return value && typeof value === 'object' && !Array.isArray(value) && typeof value.$assetRef === 'string';
}

export function payloadErrors(payload, loaded) {
  const { registry, components, contentType } = loaded;
  const errors = [];
  const assetRefs = [];
  const systemFields = new Set(registry.systemFields ?? []);
  const forbiddenFields = new Set(registry.forbiddenFields ?? []);

  function checkValue(field, value, where) {
    if (value === null || value === undefined) {
      if (field.required) errors.push(where + ' is required');
      return;
    }
    switch (field.type) {
      case 'string':
      case 'text':
      case 'richtext':
        if (typeof value !== 'string') errors.push(where + ' must be a string');
        else {
          if (field.type !== 'richtext' && /<[a-z][^>]*>/i.test(value)) errors.push(where + ' must not contain HTML');
          if (field.pattern && !new RegExp(field.pattern).test(value)) errors.push(where + ' does not match ' + field.pattern);
          if (field.maxLength && value.replace(/<[^>]+>/g, '').length > field.maxLength) errors.push(where + ' exceeds ' + field.maxLength + ' characters');
          if (field.values && !field.values.includes(value)) errors.push(where + ' must be one of ' + field.values.join(', '));
        }
        break;
      case 'enumeration':
        if (!field.values.includes(value)) errors.push(where + ' must be one of ' + field.values.join(', ') + '; received ' + JSON.stringify(value));
        break;
      case 'boolean':
        if (typeof value !== 'boolean') errors.push(where + ' must be a boolean');
        break;
      case 'integer':
        if (!Number.isInteger(value)) errors.push(where + ' must be an integer');
        else if (field.values && !field.values.includes(value)) errors.push(where + ' must be one of ' + field.values.join(', '));
        break;
      case 'decimal':
        if (typeof value !== 'number') errors.push(where + ' must be a number');
        break;
      case 'json':
        break;
      case 'datetime':
        if (typeof value !== 'string') errors.push(where + ' must be an ISO string');
        break;
      case 'media':
        if (Number.isInteger(value)) break;
        if (isAssetRef(value)) assetRefs.push({ where, ref: value.$assetRef });
        else errors.push(where + ' must be null, a Strapi media id or {"$assetRef": …}');
        break;
      case 'component': {
        const nestedFields = field.component === 'inline' ? field.fields ?? {} : components.get(field.component)?.fields;
        if (!nestedFields) {
          errors.push(where + ' references unknown component ' + field.component);
          break;
        }
        if (field.repeatable) {
          if (!Array.isArray(value)) {
            errors.push(where + ' must be an array');
            break;
          }
          if (field.min && value.length < field.min) errors.push(where + ' needs at least ' + field.min + ' items');
          if (field.max && value.length > field.max) errors.push(where + ' allows at most ' + field.max + ' items');
          value.forEach((item, index) => checkObject(nestedFields, item, where + '[' + index + ']'));
        } else if (Array.isArray(value)) errors.push(where + ' must be an object, not an array');
        else checkObject(nestedFields, value, where);
        break;
      }
      case 'dynamiczone': {
        if (!Array.isArray(value)) {
          errors.push(where + ' must be an array');
          break;
        }
        value.forEach((item, index) => {
          const location = where + '[' + index + ']';
          if (!item || typeof item !== 'object' || typeof item.__component !== 'string') {
            errors.push(location + ' needs __component');
            return;
          }
          if (!field.components.includes(item.__component)) {
            errors.push(location + ' uses component not allowed in this zone: ' + item.__component);
            return;
          }
          const definition = components.get(item.__component);
          const { __component, ...rest } = item;
          checkObject(definition.fields, rest, location + '(' + __component + ')');
        });
        break;
      }
      default:
        errors.push(where + ' has unsupported registry type ' + field.type);
    }
  }

  function checkObject(fields, value, where) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      errors.push(where + ' must be an object');
      return;
    }
    for (const key of Object.keys(value)) {
      if (forbiddenFields.has(key)) errors.push(where + '.' + key + ' is forbidden in generated payloads');
      else if (systemFields.has(key)) errors.push(where + '.' + key + ' is a system field and must be stripped');
      else if (!(key in fields)) errors.push(where + '.' + key + ' is not a registered field');
    }
    for (const [name, field] of Object.entries(fields)) checkValue(field, value[name], where + '.' + name);
  }

  checkObject(contentType.attributes, payload, 'payload');
  return { errors, assetRefs };
}

export function sharedAssetId(loaded, ref) {
  return loaded.sharedAssets.assets.find((asset) => asset.ref === ref)?.strapiMediaId ?? null;
}
