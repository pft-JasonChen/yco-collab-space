import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  fromRoot,
  normaliseFeatureSlug,
  pathExists,
} from './project.mjs';
import {
  diffSourceSnapshots,
  snapshotFeatureSources,
} from '../evaluation/source-boundary.mjs';

const mode = process.argv[2];
const feature = normaliseFeatureSlug(process.argv[3]);
const stateRoot = fromRoot('.prototype-state');
const statePath = path.join(stateRoot, feature + '-source.json');

if (!['snapshot', 'check'].includes(mode)) {
  throw new Error('Source guard mode must be snapshot or check.');
}

if (mode === 'snapshot') {
  await fs.mkdir(stateRoot, { recursive: true });
  const snapshot = await snapshotFeatureSources(fromRoot(), feature);

  await fs.writeFile(
    statePath,
    JSON.stringify(
      {
        schemaVersion: 1,
        feature,
        createdAt: new Date().toISOString(),
        snapshot,
      },
      null,
      2,
    ) + '\n',
  );
  process.stdout.write('[source-guard] SNAPSHOT ' + feature + '\n');
} else {
  if (!(await pathExists(statePath))) {
    throw new Error(
      'Source snapshot is missing. Run prototype:update:begin before generation.',
    );
  }

  const before = JSON.parse(await fs.readFile(statePath, 'utf8'));
  const after = await snapshotFeatureSources(fromRoot(), feature);
  const changes = diffSourceSnapshots(before.snapshot, after);

  if (changes.length > 0) {
    process.stderr.write('[source-guard] FAIL ' + feature + '\n');
    for (const change of changes) {
      process.stderr.write('  - source changed: ' + change.path + '\n');
    }
    process.exitCode = 1;
  } else {
    await fs.unlink(statePath);
    process.stdout.write('[source-guard] PASS ' + feature + '\n');
  }
}

