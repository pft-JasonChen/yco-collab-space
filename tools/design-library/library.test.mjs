import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { normaliseCollectionReference, scanCollection, scanLibrary } from './library.mjs';

test('collection reference accepts the fixed type and a free kebab-case collection', () => {
  assert.equal(normaliseCollectionReference('design-library/assets/video/dance/'), 'assets/video/dance');
  assert.throws(() => normaliseCollectionReference('assets/video/../secret'));
});

test('scanner indexes only a requested collection and records exact hashes', async () => {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'yco-library-'));
  try {
    await fs.mkdir(path.join(workspace, 'design-library/assets/video/dance'), { recursive: true });
    await fs.mkdir(path.join(workspace, 'design-library/assets/video/unused'), { recursive: true });
    await fs.writeFile(path.join(workspace, 'design-library/assets/video/dance/one.mp4'), 'one');
    await fs.writeFile(path.join(workspace, 'design-library/assets/video/unused/two.mp4'), 'two');
    const result = await scanCollection('assets/video/dance', workspace);
    assert.equal(result.files.length, 1);
    assert.equal(result.files[0].repositoryPath, 'design-library/assets/video/dance/one.mp4');
    assert.equal(result.files[0].sha256.length, 64);
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
});

test('full library index ignores files outside typed collection folders', async () => {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'yco-library-'));
  try {
    await fs.mkdir(path.join(workspace, 'design-library/assets'), { recursive: true });
    await fs.writeFile(path.join(workspace, 'design-library/assets/orphan.mp4'), 'orphan');
    const index = await scanLibrary(workspace);
    assert.equal(index.collections.length, 0);
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
});
