import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pathExists, walkFiles } from './project.mjs';

const KEY_PATTERN = /^[a-z0-9]+(?:\.[a-z0-9]+)+$/;
const PLACEHOLDER = /\{\{(\w+)\}\}/g;

/**
 * PM-owned copy, keyed the way RD keys it. A key marked `rd-existing` already
 * lives in RD's dictionary; only `new` keys travel with the handoff.
 */
export function i18nDictionaryErrors(dictionary, usedKeys) {
  const errors = [];
  if (!dictionary || dictionary.schemaVersion !== 1) {
    return ['product/i18n.json is missing or has an unsupported schemaVersion.'];
  }
  if (dictionary.locale !== 'en') errors.push('product/i18n.json must declare locale "en"; the prototype ships English only.');

  const entries = Object.entries(dictionary.keys ?? {});
  if (entries.length === 0) errors.push('product/i18n.json declares no keys.');

  for (const [key, entry] of entries) {
    if (!KEY_PATTERN.test(key)) {
      errors.push(`i18n key is not RD flat dot-notation: ${key}`);
    }
    if (typeof entry?.value !== 'string' || entry.value.length === 0) {
      errors.push(`i18n key has no value: ${key}`);
    }
    if (!['rd-existing', 'new'].includes(entry?.origin)) {
      errors.push(`i18n key needs origin "rd-existing" or "new": ${key}`);
    }
  }

  const declared = new Set(entries.map(([key]) => key));
  for (const key of usedKeys) {
    if (!declared.has(key)) errors.push(`Generated code uses an undeclared i18n key: ${key}`);
  }
  for (const key of declared) {
    if (!usedKeys.has(key)) errors.push(`i18n key is declared but never used: ${key}`);
  }
  return errors;
}

/** Every `t('key')` in generated code, plus every `labelKey` in PM mock data. */
export async function collectUsedI18nKeys(featureRoot) {
  const used = new Set();
  const generated = path.join(featureRoot, 'generated');
  if (await pathExists(generated)) {
    for (const file of (await walkFiles(generated)).filter((f) => /\.(?:js|jsx)$/.test(f))) {
      const source = await fs.readFile(file, 'utf8');
      for (const match of source.matchAll(/\bt\(\s*'([^']+)'/g)) used.add(match[1]);
    }
  }
  const mocks = path.join(featureRoot, 'product', 'mocks');
  if (await pathExists(mocks)) {
    for (const file of (await walkFiles(mocks)).filter((f) => f.endsWith('.json'))) {
      const source = await fs.readFile(file, 'utf8');
      for (const match of source.matchAll(/"labelKey"\s*:\s*"([^"]+)"/g)) used.add(match[1]);
    }
  }
  return used;
}

/** Interpolation placeholders must resolve, or a viewer sees a raw {{token}}. */
export function i18nPlaceholderErrors(dictionary) {
  const errors = [];
  for (const [key, entry] of Object.entries(dictionary?.keys ?? {})) {
    const names = [...String(entry?.value ?? '').matchAll(PLACEHOLDER)].map((match) => match[1]);
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
    if (duplicates.length > 0) errors.push(`i18n key repeats a placeholder: ${key} ({{${duplicates[0]}}})`);
  }
  return errors;
}

/**
 * Optional PM-supplied engine payload samples. They are the one place a real
 * production request shape may be recorded, so they are also the one place that
 * has to be scanned: a sample is a de-identified shape, never a captured call.
 */
const FORBIDDEN = [
  { id: 'bearer token', pattern: /\bBearer\s+[A-Za-z0-9._-]{8,}/i },
  { id: 'authorization header', pattern: /"authorization"\s*:/i },
  { id: 'cookie', pattern: /"cookie"\s*:/i },
  { id: 'credential-like key', pattern: /"(?:password|secret|api[_-]?key|access[_-]?token|refresh[_-]?token|id[_-]?token|session[_-]?id)"\s*:/i },
  { id: 'jwt', pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\./ },
  { id: 'remote url', pattern: /https?:\/\/(?!example\.(?:com|org)\b)[^\s"']+/i },
  { id: 'email address', pattern: /[A-Za-z0-9._%+-]+@(?!example\.(?:com|org)\b)[A-Za-z0-9.-]+\.[A-Za-z]{2,}/ },
  { id: 'aws access key', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
];

export async function payloadSampleErrors(featureRoot) {
  const root = path.join(featureRoot, 'product', 'payload-samples');
  if (!(await pathExists(root))) return { errors: [], files: [] };

  const errors = [];
  const files = await walkFiles(root);

  for (const file of files) {
    const relative = path.relative(featureRoot, file).split(path.sep).join('/');
    if (path.basename(file) === 'README.md') continue;
    if (!file.endsWith('.json')) {
      errors.push(`Payload samples must be .json: ${relative}`);
      continue;
    }
    const source = await fs.readFile(file, 'utf8');
    try {
      JSON.parse(source);
    } catch (error) {
      errors.push(`Payload sample is not valid JSON: ${relative} (${error.message})`);
      continue;
    }
    for (const rule of FORBIDDEN) {
      if (rule.pattern.test(source)) {
        errors.push(`Payload sample must be de-identified — found ${rule.id}: ${relative}`);
      }
    }
  }
  return { errors, files };
}

/**
 * Every declared component role must carry reuse evidence, and a role resolved to a
 * catalogued component must name one that exists. This is the gate that stops a
 * feature from rebuilding UI a shared component already owns.
 */
export function componentReuseErrors(surfaceIntent, catalogueIds) {
  const errors = [];
  const entries = surfaceIntent?.componentReuse ?? [];
  const roles = surfaceIntent?.layoutIntent?.componentRoles ?? [];
  const byRole = new Map();

  for (const entry of entries) {
    if (byRole.has(entry.role)) errors.push('componentReuse declares the same role twice: ' + entry.role);
    byRole.set(entry.role, entry);

    if (entry.resolution === 'feature-only') {
      if (entry.component) errors.push('componentReuse feature-only role must not name a component: ' + entry.role);
    } else if (!entry.component) {
      errors.push('componentReuse role needs a component id for resolution ' + entry.resolution + ': ' + entry.role);
    } else if (!catalogueIds.has(entry.component)) {
      errors.push('componentReuse names an uncatalogued component: ' + entry.component + ' (role ' + entry.role + ')');
    }
  }

  for (const role of roles) {
    if (!byRole.has(role)) errors.push('componentRole has no reuse evidence: ' + role);
  }
  for (const role of byRole.keys()) {
    if (!roles.includes(role)) errors.push('componentReuse resolves a role that layoutIntent does not declare: ' + role);
  }
  return errors;
}

/**
 * The task contract has to stay anchored to the behaviour the PM signed off: every
 * port names a contract state or action, so a parameter can always be traced back
 * to the interaction that produces it and to the rendered check that covers it.
 */
export function taskContractErrors(taskContract, prototypeContract, feature, payloadFiles) {
  const errors = [];
  if (taskContract.feature !== feature) {
    errors.push('task-contract.yaml feature does not match folder: ' + feature);
  }

  const known = new Set([
    ...(prototypeContract?.states ?? []).map((state) => state.id),
    ...(prototypeContract?.actions ?? []).map((action) => action.id),
  ]);
  for (const port of [...(taskContract.inputs ?? []), ...(taskContract.outputs ?? [])]) {
    if (port.contract && !known.has(port.contract)) {
      errors.push('task-contract port references an unknown contract state or action: ' + port.contract + ' (' + port.id + ')');
    }
  }

  const available = new Set(payloadFiles.map((file) => 'payload-samples/' + path.basename(file)));
  for (const sample of taskContract.payloadSamples ?? []) {
    if (!available.has(sample)) {
      errors.push('task-contract references a payload sample that does not exist: ' + sample);
    }
  }
  return errors;
}

/** The integration surface must name the snapshot it was derived from. */
export function integrationErrors(integration, feature, snapshot) {
  const errors = [];
  if (integration.feature !== feature) {
    errors.push('integration.yaml feature does not match folder: ' + feature);
  }
  if (snapshot && integration.derivedFrom.snapshot !== snapshot) {
    errors.push(
      'integration.yaml was derived from snapshot ' + integration.derivedFrom.snapshot +
        ' but the component catalogue uses ' + snapshot + '.',
    );
  }
  const layers = new Set((integration.portedLayers ?? []).map((entry) => entry.layer));
  for (const required of ['L1-composition', 'L2-data', 'L3-orchestration']) {
    if (!layers.has(required)) errors.push('integration.yaml does not describe how RD handles ' + required + '.');
  }
  return errors;
}
