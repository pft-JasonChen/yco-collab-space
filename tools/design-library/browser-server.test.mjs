import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createLibraryServer } from './browser-server.mjs';

test('local browser lists collections and serves only Design Library assets', async () => {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'yco-browser-'));
  const collection = path.join(workspace, 'design-library/assets/image/examples');
  await fs.mkdir(collection, { recursive: true });
  await fs.writeFile(path.join(collection, 'sample.png'), 'fake-image');
  const server = createLibraryServer({ workspace });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const { port } = server.address();
    const root = await fetch('http://127.0.0.1:' + port + '/');
    assert.match(await root.text(), /assets\/image\/examples/);
    const asset = await fetch('http://127.0.0.1:' + port + '/asset/design-library/assets/image/examples/sample.png');
    assert.equal(asset.status, 200);
    const blocked = await fetch('http://127.0.0.1:' + port + '/asset/package.json');
    assert.equal(blocked.status, 403);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(workspace, { recursive: true, force: true });
  }
});
