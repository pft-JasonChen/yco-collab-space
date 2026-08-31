import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  fromRoot,
  normaliseFeatureSlug,
  pathExists,
} from '../prototype-cli/project.mjs';

const featureFlag = process.argv.indexOf('--feature');
const feature = normaliseFeatureSlug(
  featureFlag >= 0 ? process.argv[featureFlag + 1] : process.argv[2],
);
const evidenceRoot = fromRoot('features', feature, 'evidence');
const renderedPath = path.join(evidenceRoot, 'rendered-validation.json');
const generationPath = fromRoot(
  'features',
  feature,
  'generated',
  'generation.json',
);

if (!(await pathExists(renderedPath))) {
  throw new Error('Run rendered validation before creating a visual review packet.');
}

const rendered = JSON.parse(await fs.readFile(renderedPath, 'utf8'));
const generation = JSON.parse(await fs.readFile(generationPath, 'utf8'));
const screenshots = [
  ...new Set(rendered.results.map((result) => result.screenshot)),
].map((relativePath) => ({
  relativePath,
  absolutePath: path.join(evidenceRoot, relativePath),
}));
const packet = {
  schemaVersion: 1,
  feature,
  createdAt: new Date().toISOString(),
  status: 'human-required',
  rubric: 'evals/graders/visual-surface-rubric.md',
  surface: rendered.surface,
  generation: {
    inputHash: generation.inputHash,
    adapter: generation.adapter,
    model: generation.model,
  },
  screenshots,
  decisionBasis: [
    'No visual score is promoted until a human-calibrated judge reviews the rendered evidence.',
  ],
};
const packetPath = path.join(evidenceRoot, 'visual-review-packet.json');

await fs.writeFile(packetPath, JSON.stringify(packet, null, 2) + '\n');
process.stdout.write(
  '[visual-review] PACKET human-required — ' +
    path.relative(fromRoot(), packetPath) +
    '\n',
);

