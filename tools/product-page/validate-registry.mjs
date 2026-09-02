import path from 'node:path';
import Ajv from 'ajv';
import { formatSchemaErrors, readJson, readYaml, walkFiles } from '../prototype-cli/project.mjs';
import { fromRoot, pathExists, toPosix } from './project.mjs';
import { componentSemanticErrors, loadRegistry } from './registry-policy.mjs';
import { loadPatterns, loadTokenDefinitions, patternSemanticErrors } from './pattern-policy.mjs';

const ajv = new Ajv({ allErrors: true, strict: false });
const validateRegistry = ajv.compile(await readJson('tools/product-page/schemas/strapi-registry.schema.json'));
const validateComponent = ajv.compile(await readJson('tools/product-page/schemas/strapi-component.schema.json'));
const validateContentType = ajv.compile(await readJson('tools/product-page/schemas/strapi-content-type.schema.json'));
const validatePattern = ajv.compile(await readJson('tools/product-page/schemas/design-pattern.schema.json'));
const validateProduct = ajv.compile(await readJson('tools/product-page/schemas/product.schema.json'));
const validateCompetitor = ajv.compile(await readJson('tools/product-page/schemas/competitor.schema.json'));

const errors = [];
const registryFile = await readYaml('strapi/registry.yaml');
if (!validateRegistry(registryFile)) errors.push('strapi/registry.yaml: ' + formatSchemaErrors(validateRegistry.errors));

const loaded = await loadRegistry();
errors.push(...loaded.errors);
for (const [uid, definition] of loaded.components) {
  if (!validateComponent(definition)) errors.push(uid + ': ' + formatSchemaErrors(validateComponent.errors));
  else errors.push(...componentSemanticErrors(definition, loaded.components));
}
if (loaded.contentType) {
  if (!validateContentType(loaded.contentType)) errors.push('content-type: ' + formatSchemaErrors(validateContentType.errors));
  else errors.push(...componentSemanticErrors({ uid: loaded.contentType.uid, attributes: loaded.contentType.attributes, layoutFields: [] }, loaded.components));
}

const { patterns, errors: patternErrors } = await loadPatterns();
errors.push(...patternErrors);
const tokens = await loadTokenDefinitions();
const boundComponents = new Set();
for (const pattern of patterns.values()) {
  const { file, ...document } = pattern;
  if (!validatePattern(document)) errors.push(file + ': ' + formatSchemaErrors(validatePattern.errors));
  else errors.push(...patternSemanticErrors(pattern, loaded, tokens));
  boundComponents.add(pattern.strapiComponent);
}
for (const [uid, definition] of loaded.components) {
  if (definition.dynamicZone && !boundComponents.has(uid)) errors.push('Dynamic-zone component has no Designer pattern bound to it: ' + uid);
}

async function validateLibraryEntries(kind, validator, fileName) {
  const root = fromRoot('product-library', kind);
  if (!(await pathExists(root))) return 0;
  const files = (await walkFiles(root, (file) => path.basename(file) === fileName)).filter((file) => !file.includes(path.sep + '_template' + path.sep));
  for (const file of files) {
    const relative = toPosix(path.relative(fromRoot(), file));
    const document = await readYaml(relative);
    if (!validator(document)) errors.push(relative + ': ' + formatSchemaErrors(validator.errors));
    else {
      const folder = path.basename(path.dirname(file));
      if (document.slug !== folder) errors.push(relative + ': slug does not match folder ' + folder);
      for (const page of document.pages ?? []) {
        if (!(await pathExists(path.join(path.dirname(file), page.file)))) errors.push(relative + ': page snapshot is missing: ' + page.file);
      }
    }
  }
  return files.length;
}
const productCount = await validateLibraryEntries('products', validateProduct, 'product.yaml');
const competitorCount = await validateLibraryEntries('competitors', validateCompetitor, 'competitor.yaml');

if (errors.length > 0) {
  process.stderr.write('[strapi] FAIL\n');
  for (const error of errors) process.stderr.write('  - ' + error + '\n');
  process.exitCode = 1;
} else {
  process.stdout.write('[strapi] PASS ' + loaded.components.size + ' components, ' + patterns.size + ' patterns bound, ' + tokens.size + ' tokens available\n');
  process.stdout.write('[product-library] PASS ' + productCount + ' products, ' + competitorCount + ' competitors\n');
}
