import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fromRoot, normalisePageSlug, pathExists } from './project.mjs';
import { diffSourceSnapshots, snapshotWorkspacePaths } from '../evaluation/source-boundary.mjs';
import { loadCollabMap, workflowPolicy } from '../collab-space/policy.mjs';

const mode = process.argv[2];
const page = normalisePageSlug(process.argv[3]);
const workflowId = process.argv.includes('--workflow') ? process.argv[process.argv.indexOf('--workflow') + 1] : 'product-page-generate';
const stateRoot = fromRoot('.prototype-state');
const statePath = path.join(stateRoot, 'page-' + page + '-' + workflowId + '.json');
const map = await loadCollabMap();
const policy = workflowPolicy(map, workflowId, { page });

if (!['snapshot', 'check'].includes(mode)) throw new Error('Source guard mode must be snapshot or check.');

if (mode === 'snapshot') {
  await fs.mkdir(stateRoot, { recursive: true });
  const snapshot = await snapshotWorkspacePaths(fromRoot(), policy.protectedPaths);
  await fs.writeFile(
    statePath,
    JSON.stringify({ schemaVersion: 1, page, workflow: policy.id, createdAt: new Date().toISOString(), protectedPaths: policy.protectedPaths, snapshot }, null, 2) + '\n',
  );
  process.stdout.write('[page-source-guard] SNAPSHOT ' + page + ' (' + policy.id + ', ' + policy.protectedPaths.length + ' protected paths)\n');
} else {
  if (!(await pathExists(statePath))) throw new Error('Source snapshot is missing. Run page:update:begin before generation.');
  const before = JSON.parse(await fs.readFile(statePath, 'utf8'));
  const after = await snapshotWorkspacePaths(fromRoot(), before.protectedPaths ?? policy.protectedPaths);
  const changes = diffSourceSnapshots(before.snapshot, after);
  if (changes.length > 0) {
    process.stderr.write('[page-source-guard] FAIL ' + page + '\n');
    for (const change of changes) process.stderr.write('  - protected source changed: ' + change.path + '\n');
    process.exitCode = 1;
  } else {
    await fs.unlink(statePath);
    process.stdout.write('[page-source-guard] PASS ' + page + '\n');
  }
}
