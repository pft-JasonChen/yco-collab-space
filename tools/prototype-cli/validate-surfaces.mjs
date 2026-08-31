import Ajv from 'ajv';
import {
  formatSchemaErrors,
  pathExists,
  readJson,
  readYaml,
} from './project.mjs';
import {
  resolveSurfaceContextFromIntent,
  surfacePackRelativeRoot,
} from './surface-policy.mjs';

const ajv = new Ajv({ allErrors: true, strict: false });
const surfacePackSchema = await readJson(
  'tools/prototype-cli/schemas/surface-pack.schema.json',
);
const validateSurfacePack = ajv.compile(surfacePackSchema);
const catalog = await readYaml('platform/surfaces/catalog.yaml');
const errors = [];
const ids = new Set();

if (catalog.schemaVersion !== 1 || !Array.isArray(catalog.entries)) {
  errors.push('Surface catalog must use schemaVersion 1 and contain entries.');
}

for (const entry of catalog.entries || []) {
  if (ids.has(entry.id)) {
    errors.push('Duplicate Surface Pack catalog ID: ' + entry.id);
  }
  ids.add(entry.id);

  if (!['surface', 'module'].includes(entry.kind)) {
    errors.push('Invalid Surface Pack kind: ' + entry.id);
  }

  if (!['planned', 'provisional', 'approved', 'deprecated'].includes(entry.status)) {
    errors.push('Invalid Surface Pack status: ' + entry.id);
  }

  if (entry.status === 'planned') {
    continue;
  }

  if (!entry.defaultVersion) {
    errors.push('Implemented Surface Pack needs defaultVersion: ' + entry.id);
    continue;
  }

  const reference = {
    id: entry.id,
    version: entry.defaultVersion,
  };
  const packRoot = surfacePackRelativeRoot(reference);
  const manifestPath = packRoot + '/surface.yaml';

  if (!(await pathExists(new URL('../../' + manifestPath, import.meta.url)))) {
    errors.push('Missing Surface Pack manifest: ' + manifestPath);
    continue;
  }

  const manifest = await readYaml(manifestPath);

  if (!validateSurfacePack(manifest)) {
    errors.push(
      manifestPath + ': ' + formatSchemaErrors(validateSurfacePack.errors),
    );
  }

  if (
    manifest.id !== entry.id ||
    manifest.version !== entry.defaultVersion ||
    manifest.kind !== entry.kind ||
    manifest.status !== entry.status
  ) {
    errors.push('Catalog and manifest metadata do not match: ' + entry.id);
  }

  const slots = await readYaml(packRoot + '/component-slots.yaml');
  const evaluation = await readYaml(packRoot + '/evaluation.yaml');
  const slotIds = new Set();

  if (
    slots.schemaVersion !== 1 ||
    slots.pack !== entry.id ||
    slots.version !== entry.defaultVersion ||
    !Array.isArray(slots.slots)
  ) {
    errors.push('Invalid component-slots.yaml metadata: ' + entry.id);
  } else {
    for (const slot of slots.slots) {
      if (slotIds.has(slot.id)) {
        errors.push('Duplicate component slot ' + slot.id + ': ' + entry.id);
      }
      slotIds.add(slot.id);
    }
  }

  if (
    evaluation.schemaVersion !== 1 ||
    evaluation.pack !== entry.id ||
    evaluation.version !== entry.defaultVersion ||
    !evaluation.visualReview?.status ||
    !Array.isArray(evaluation.structuralAnchors)
  ) {
    errors.push('Invalid evaluation.yaml metadata: ' + entry.id);
  }

  if (entry.kind === 'surface') {
    const resolved = await resolveSurfaceContextFromIntent({
      strategy: 'reuse',
      temporary: true,
      primaryPack: reference,
      borrowedPacks: [],
      layoutIntent: {
        zones: [],
        componentRoles: [],
        responsivePriority: [],
      },
    });
    errors.push(...resolved.errors.map((error) => entry.id + ': ' + error));
  }
}

if (errors.length > 0) {
  process.stderr.write('[surfaces] FAIL\n');
  for (const error of errors) {
    process.stderr.write('  - ' + error + '\n');
  }
  process.exitCode = 1;
} else {
  const implemented = catalog.entries.filter(
    (entry) => entry.status !== 'planned',
  ).length;
  process.stdout.write(
    '[surfaces] PASS ' +
      implemented +
      ' implemented, ' +
      (catalog.entries.length - implemented) +
      ' planned\n',
  );
}

