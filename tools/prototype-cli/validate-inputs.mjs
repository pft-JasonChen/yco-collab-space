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
import {
  acceptanceCoverageErrors,
  missingMarkdownSections,
  requiredDecisionSections,
  requiredIntakeSections,
} from './intake-policy.mjs';
import {
  resolveSurfaceContext,
  surfacePackRelativeRoot,
} from './surface-policy.mjs';
import {
  mediaIntentSemanticErrors,
  resourceProvenanceErrors,
  tokenProvenanceErrors,
} from './resource-provenance.mjs';
import { sharedComponentProvenanceErrors } from '../design-library/component-provenance.mjs';

const ajv = new Ajv({ allErrors: true, strict: false });
const contractSchema = await readJson(
  'tools/prototype-cli/schemas/prototype-contract.schema.json',
);
const validationSchema = await readJson(
  'tools/prototype-cli/schemas/validation.schema.json',
);
const surfaceIntentSchema = await readJson(
  'tools/prototype-cli/schemas/surface-intent.schema.json',
);
const surfacePackSchema = await readJson(
  'tools/prototype-cli/schemas/surface-pack.schema.json',
);
const mediaIntentSchema = await readJson(
  'tools/prototype-cli/schemas/media-intent.schema.json',
);
const validateContract = ajv.compile(contractSchema);
const validateValidation = ajv.compile(validationSchema);
const validateSurfaceIntent = ajv.compile(surfaceIntentSchema);
const validateSurfacePack = ajv.compile(surfacePackSchema);
const validateMediaIntent = ajv.compile(mediaIntentSchema);
const config = await readJson('prototype.config.json');
const intakeOnly = process.argv.includes('--intake-only');

async function validateFeature(feature) {
  const errors = [];
  const productRoot = fromRoot('features', feature, 'product');
  const contract = await readYaml(
    path.join('features', feature, 'product', 'prototype.contract.yaml'),
  );
  const validation = await readYaml(
    path.join('features', feature, 'product', 'validation.yaml'),
  );
  const surfaceIntent = await readYaml(
    path.join('features', feature, 'product', 'surface-intent.yaml'),
  );
  const mediaIntent = await readYaml(
    path.join('features', feature, 'product', 'media-intent.yaml'),
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

  if (!validateSurfaceIntent(surfaceIntent)) {
    errors.push(
      'surface-intent.yaml: ' +
        formatSchemaErrors(validateSurfaceIntent.errors),
    );
  }

  if (!validateMediaIntent(mediaIntent)) {
    errors.push(
      'media-intent.yaml: ' + formatSchemaErrors(validateMediaIntent.errors),
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

  if (contract.feature.intakeStatus !== 'confirmed') {
    errors.push('Intake is not confirmed by PM. Run prototype-intake first.');
  }

  if (surfaceIntent.feature !== feature) {
    errors.push('surface-intent.yaml feature does not match folder: ' + feature);
  }

  errors.push(...mediaIntentSemanticErrors(mediaIntent, feature));

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

  errors.push(...acceptanceCoverageErrors(contract, validation));

  const intakePath = path.join(productRoot, 'intake.md');
  const decisionsPath = path.join(productRoot, 'decisions.md');

  for (const [filePath, requiredSections] of [
    [intakePath, requiredIntakeSections],
    [decisionsPath, requiredDecisionSections],
  ]) {
    if (!(await pathExists(filePath))) {
      errors.push('Missing Intake source file: ' + path.basename(filePath));
      continue;
    }

    const source = await fs.readFile(filePath, 'utf8');
    const missingSections = missingMarkdownSections(source, requiredSections);

    if (missingSections.length > 0) {
      errors.push(
        path.basename(filePath) +
          ' is missing sections: ' +
          missingSections.join(', '),
      );
    }
  }

  const packReferences = [
    surfaceIntent.primaryPack,
    ...surfaceIntent.borrowedPacks,
  ].filter(Boolean);

  for (const reference of packReferences) {
    const manifestPath = path.join(
      surfacePackRelativeRoot(reference),
      'surface.yaml',
    );

    if (!(await pathExists(fromRoot(manifestPath)))) {
      continue;
    }

    const manifest = await readYaml(manifestPath);

    if (!validateSurfacePack(manifest)) {
      errors.push(
        manifestPath + ': ' + formatSchemaErrors(validateSurfacePack.errors),
      );
    }
  }

  const surfaceResult = await resolveSurfaceContext(feature);
  errors.push(...surfaceResult.errors);

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

  // A feature that is still at the `intake` stage may exist as PM spec only (for
  // example as the upstream spec of a product page). Generated-code checks apply once
  // the feature leaves intake or once generated code exists.
  const releasePath = fromRoot('features', feature, 'releases.json');
  const release = (await pathExists(releasePath)) ? await readJson('features/' + feature + '/releases.json') : null;
  const specOnlyFeature =
    release?.currentStage === 'intake' &&
    !(await pathExists(fromRoot('features', feature, 'generated', 'feature.jsx')));

  if (!intakeOnly && !specOnlyFeature) {
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
      errors.push(
        'generation.json is missing. Run prototype:record after generation.',
      );
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

      if (generation.schemaVersion !== 3) {
        errors.push(
          'generation.json must be regenerated with Collab Contract resource metadata.',
        );
      } else if (
        surfaceResult.context &&
        generation.surface?.contextHash !== surfaceResult.context.contextHash
      ) {
        errors.push(
          'Generated code is stale because Surface context changed.',
        );
      }

      if (generation.schemaVersion === 3) {
        errors.push(...(await resourceProvenanceErrors(generation.resources)));
        errors.push(...(await tokenProvenanceErrors(generation.tokens)));
        if (generation.components !== undefined) {
          errors.push(...(await sharedComponentProvenanceErrors(feature, generation.components)));
        }
      }
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
      (intakeOnly ? '[intake] PASS ' : '[inputs] PASS ') +
        feature +
        ' ' +
        inputHash.slice(0, 12) +
        '\n',
    );
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    process.stderr.write(
      (intakeOnly ? '[intake] FAIL ' : '[inputs] FAIL ') +
        failure.feature +
        '\n',
    );
    for (const error of failure.errors) {
      process.stderr.write('  - ' + error + '\n');
    }
  }
  process.exitCode = 1;
}
