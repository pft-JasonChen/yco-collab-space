import { promises as fs } from 'node:fs';
import path from 'node:path';
import Ajv from 'ajv';
import {
  formatSchemaErrors,
  fromRoot,
  hashFeatureInputs,
  listFeatureSlugs,
  pathExists,
  readJson,
  readYaml,
  requestedFeature,
} from './project.mjs';

const ajv = new Ajv({ allErrors: true, strict: false });
const contractSchema = await readJson(
  'tools/prototype-cli/schemas/prototype-contract.schema.json',
);
const validationSchema = await readJson(
  'tools/prototype-cli/schemas/validation.schema.json',
);
const validateContract = ajv.compile(contractSchema);
const validateValidation = ajv.compile(validationSchema);
const config = await readJson('prototype.config.json');

async function validateFeature(feature) {
  const errors = [];
  const productRoot = fromRoot('features', feature, 'product');
  const contract = await readYaml(
    path.join('features', feature, 'product', 'prototype.contract.yaml'),
  );
  const validation = await readYaml(
    path.join('features', feature, 'product', 'validation.yaml'),
  );
  const gaps = await readYaml(
    path.join('features', feature, 'design', 'design-gaps.yaml'),
  );

  if (!validateContract(contract)) {
    errors.push(
      'prototype.contract.yaml: ' + formatSchemaErrors(validateContract.errors),
    );
  }

  if (!validateValidation(validation)) {
    errors.push(
      'validation.yaml: ' + formatSchemaErrors(validateValidation.errors),
    );
  }

  if (errors.length > 0) {
    return errors;
  }

  const expectedRoute =
    config.routes.featurePrefix + '/' + feature + '/';

  if (contract.feature.slug !== feature) {
    errors.push('Contract slug does not match folder: ' + feature);
  }

  if (contract.feature.entryRoute !== expectedRoute) {
    errors.push('Contract entryRoute must be ' + expectedRoute);
  }

  if (validation.feature !== feature) {
    errors.push('Validation feature does not match folder: ' + feature);
  }

  if (validation.route !== contract.feature.entryRoute) {
    errors.push('Validation route does not match contract entryRoute.');
  }

  const stateIds = new Set(contract.states.map((state) => state.id));
  const duplicateStateIds =
    stateIds.size !== contract.states.map((state) => state.id).length;

  if (duplicateStateIds) {
    errors.push('Contract state IDs must be unique.');
  }

  for (const action of contract.actions) {
    if (!stateIds.has(action.from) || !stateIds.has(action.to)) {
      errors.push('Action references an unknown state: ' + action.id);
    }
  }

  const acceptanceIds = new Set(
    contract.acceptance.map((criterion) => criterion.id),
  );

  for (const check of validation.checks) {
    if (!acceptanceIds.has(check.criterion)) {
      errors.push(
        'Validation check references unknown criterion: ' + check.criterion,
      );
    }
  }

  for (const mock of contract.mocks) {
    const mockPath = path.join(productRoot, mock);

    if (!(await pathExists(mockPath))) {
      errors.push('Missing mock file: ' + mock);
      continue;
    }

    try {
      JSON.parse(await fs.readFile(mockPath, 'utf8'));
    } catch {
      errors.push('Mock file is not valid JSON: ' + mock);
    }
  }

  if (gaps.feature !== feature || !Array.isArray(gaps.gaps)) {
    errors.push('design-gaps.yaml must identify the feature and contain gaps.');
  }

  const generatedFeature = fromRoot(
    'features',
    feature,
    'generated',
    'feature.jsx',
  );
  const generationMetadataPath = fromRoot(
    'features',
    feature,
    'generated',
    'generation.json',
  );

  if (!(await pathExists(generatedFeature))) {
    errors.push('Generated feature.jsx is missing. Run prototype-update.');
  }

  if (!(await pathExists(generationMetadataPath))) {
    errors.push('generation.json is missing. Run prototype:record after generation.');
  } else {
    const generation = JSON.parse(
      await fs.readFile(generationMetadataPath, 'utf8'),
    );
    const currentInputHash = await hashFeatureInputs(feature);

    if (generation.inputHash !== currentInputHash) {
      errors.push(
        'Generated code is stale because product or design inputs changed.',
      );
    }
  }

  return errors;
}

const selectedFeature = requestedFeature();
const features = await listFeatureSlugs(selectedFeature);
const failures = [];

for (const feature of features) {
  const errors = await validateFeature(feature);

  if (errors.length > 0) {
    failures.push({ feature, errors });
  } else {
    const inputHash = await hashFeatureInputs(feature);
    process.stdout.write(
      '[inputs] PASS ' + feature + ' ' + inputHash.slice(0, 12) + '\n',
    );
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    process.stderr.write('[inputs] FAIL ' + failure.feature + '\n');
    for (const error of failure.errors) {
      process.stderr.write('  - ' + error + '\n');
    }
  }
  process.exitCode = 1;
}
