import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  diffSourceSnapshots,
  snapshotFeatureSources,
} from './source-boundary.mjs';

test('source boundary reports PM source mutations', async () => {
  const workspace = await fs.mkdtemp(
    path.join(os.tmpdir(), 'yco-source-boundary-test-'),
  );
  const featureRoot = path.join(workspace, 'features', 'example');

  try {
    await fs.mkdir(path.join(featureRoot, 'product'), { recursive: true });
    await fs.mkdir(path.join(featureRoot, 'design'), { recursive: true });
    await fs.writeFile(path.join(featureRoot, 'product', 'prd.md'), 'before\n');
    await fs.writeFile(
      path.join(featureRoot, 'design', 'design-gaps.yaml'),
      'gaps: []\n',
    );
    const before = await snapshotFeatureSources(workspace, 'example');

    await fs.writeFile(path.join(featureRoot, 'product', 'prd.md'), 'after\n');
    const after = await snapshotFeatureSources(workspace, 'example');
    const changes = diffSourceSnapshots(before, after);

    assert.equal(changes.length, 1);
    assert.equal(changes[0].path, 'product/prd.md');
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
});

test('source boundary ignores macOS metadata files', async () => {
  const workspace = await fs.mkdtemp(
    path.join(os.tmpdir(), 'yco-source-boundary-metadata-test-'),
  );
  const featureRoot = path.join(workspace, 'features', 'example');

  try {
    await fs.mkdir(path.join(featureRoot, 'product'), { recursive: true });
    await fs.mkdir(path.join(featureRoot, 'design'), { recursive: true });
    await fs.writeFile(path.join(featureRoot, 'product', 'prd.md'), 'stable\n');
    await fs.writeFile(path.join(featureRoot, 'product', '.DS_Store'), 'before\n');
    const before = await snapshotFeatureSources(workspace, 'example');

    await fs.writeFile(path.join(featureRoot, 'product', '.DS_Store'), 'after\n');
    const after = await snapshotFeatureSources(workspace, 'example');

    assert.deepEqual(diffSourceSnapshots(before, after), []);
    assert.equal(Object.keys(after).includes('product/.DS_Store'), false);
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
});
