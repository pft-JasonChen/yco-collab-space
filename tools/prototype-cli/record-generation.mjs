import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  fromRoot,
  hashFeatureInputs,
  normaliseFeatureSlug,
  pathExists,
  walkFiles,
} from './project.mjs';
import { resolveSurfaceContext } from './surface-policy.mjs';
import { buildResourceProvenance, buildTokenProvenance } from './resource-provenance.mjs';
import { buildSharedComponentProvenance } from '../design-library/component-provenance.mjs';

const feature = normaliseFeatureSlug(process.argv[2]);
const adapterIndex = process.argv.indexOf('--adapter');
const adapter =
  adapterIndex >= 0 ? process.argv[adapterIndex + 1] : 'not-recorded';
const modelIndex = process.argv.indexOf('--model');
// The generating model is part of the provenance: two runs of the same inputs on
// different models are not the same generation.
const model =
  modelIndex >= 0
    ? process.argv[modelIndex + 1]
    : process.env.PROTOTYPE_MODEL || 'not-recorded';
const generatedRoot = fromRoot('features', feature, 'generated');
const featureModule = path.join(generatedRoot, 'feature.jsx');

if (!(await pathExists(featureModule))) {
  throw new Error('Generated feature.jsx does not exist for ' + feature);
}

const surfaceResult = await resolveSurfaceContext(feature);

if (surfaceResult.errors.length > 0 || !surfaceResult.context) {
  throw new Error(
    'Surface context cannot be recorded:\n' + surfaceResult.errors.join('\n'),
  );
}

const files = (await walkFiles(generatedRoot))
  .filter((file) => path.basename(file) !== 'generation.json')
  .map((file) => path.relative(generatedRoot, file).split(path.sep).join('/'));
const metadata = {
  schemaVersion: 3,
  feature,
  inputHash: await hashFeatureInputs(feature),
  generatorInstructionsVersion: 'collab-contract-v1',
  adapter,
  model,
  generatedAt: new Date().toISOString(),
  files,
  collabContract: {
    schemaVersion: 1,
    workflow: 'prototype-update',
  },
  resources: await buildResourceProvenance(feature),
  components: await buildSharedComponentProvenance(feature),
  tokens: await buildTokenProvenance(),
  surface: surfaceResult.context,
};

await fs.writeFile(
  path.join(generatedRoot, 'generation.json'),
  JSON.stringify(metadata, null, 2) + '\n',
);

process.stdout.write(
  '[generation] RECORDED ' +
    feature +
    ' ' +
    metadata.inputHash.slice(0, 12) +
    '\n',
);
