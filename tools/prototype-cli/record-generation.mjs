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

const feature = normaliseFeatureSlug(process.argv[2]);
const adapterIndex = process.argv.indexOf('--adapter');
const adapter =
  adapterIndex >= 0 ? process.argv[adapterIndex + 1] : 'not-recorded';
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
  schemaVersion: 2,
  feature,
  inputHash: await hashFeatureInputs(feature),
  generatorInstructionsVersion: 'phase0.5-v1',
  adapter,
  model: process.env.PROTOTYPE_MODEL || 'not-recorded',
  generatedAt: new Date().toISOString(),
  files,
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
