import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { scanSurfaces } from './surfaces.mjs';
import { renderSurfaceHtml, createSurfaceServer } from './surface-browser.mjs';

/**
 * A workspace with the shapes that matter: a pack composing a pattern in prose, a
 * pattern nothing pins directly, a planned entry with no files, and a shell value
 * naming a component that does not exist.
 */
async function fixture() {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'yco-surfaces-'));
  const write = async (relative, contents) => {
    const absolute = path.join(workspace, relative);
    await fs.mkdir(path.dirname(absolute), { recursive: true });
    await fs.writeFile(absolute, contents);
  };

  await fs.mkdir(path.join(workspace, 'platform/ui/tool-page-layout'), { recursive: true });
  await fs.mkdir(path.join(workspace, 'platform/ui/button'), { recursive: true });

  await write(
    'platform/surfaces/catalog.yaml',
    [
      'schemaVersion: 1',
      'entries:',
      '  - id: workspace/tool-demo',
      '    kind: surface',
      '    status: provisional',
      '    defaultVersion: 2026-09',
      '  - id: pattern/demo-page',
      '    kind: module',
      '    status: provisional',
      '    defaultVersion: 2026-09',
      '  - id: marketing/never-built',
      '    kind: surface',
      '    status: planned',
      '',
    ].join('\n'),
  );

  await write(
    'platform/surfaces/workspace/tool-demo/2026-09/surface.yaml',
    [
      'schemaVersion: 1',
      'id: workspace/tool-demo',
      'version: 2026-09',
      'kind: surface',
      'status: provisional',
      'shell: demo-workspace',
      'zones:',
      '  - id: settings-inspector',
      '    required: true',
      '    description: Left column, from pattern/demo-page.',
      '  - id: result-column',
      '    required: false',
      '    description: The working view.',
      'responsivePriority:',
      '  - Keep the result dominant.',
      'decisionBasis:',
      '  - Composes the demo page pattern.',
      '',
    ].join('\n'),
  );
  await write(
    'platform/surfaces/workspace/tool-demo/2026-09/component-slots.yaml',
    [
      'schemaVersion: 1',
      'pack: workspace/tool-demo',
      'composes: [pattern/demo-page@2026-09]',
      'version: 2026-09',
      'slots:',
      '  - id: settings-inspector',
      '    required: true',
      '    description: Feature-owned content.',
      '',
    ].join('\n'),
  );
  await write('platform/surfaces/workspace/tool-demo/2026-09/layout-rules.md', '# Demo rules\n\nTwo columns.\n');

  await write(
    'platform/surfaces/pattern/demo-page/2026-09/surface.yaml',
    [
      'schemaVersion: 1',
      'id: pattern/demo-page',
      'version: 2026-09',
      'kind: module',
      'status: provisional',
      'shell: tool-page-layout',
      'zones:',
      '  - id: body',
      '    required: true',
      '    description: The page body.',
      '',
    ].join('\n'),
  );

  await write(
    'features/demo-feature/product/surface-intent.yaml',
    [
      'schemaVersion: 1',
      'feature: demo-feature',
      'strategy: reuse',
      'primaryPack:',
      '  id: workspace/tool-demo',
      '  version: 2026-09',
      'borrowedPacks: []',
      '',
    ].join('\n'),
  );
  // `_template` is not a feature and must not count towards adoption.
  await write(
    'features/_template/product/surface-intent.yaml',
    [
      'schemaVersion: 1',
      'feature: _template',
      'strategy: reuse',
      'primaryPack:',
      '  id: pattern/demo-page',
      '  version: 2026-09',
      'borrowedPacks: []',
      '',
    ].join('\n'),
  );

  return workspace;
}

test('the index separates a defined pack from a name-only catalog entry', async () => {
  const workspace = await fixture();
  try {
    const index = await scanSurfaces(workspace);
    const byId = new Map(index.entries.map((entry) => [entry.id, entry]));

    assert.equal(index.summary.total, 3);
    assert.equal(index.summary.defined, 2);
    assert.equal(index.summary.nameOnly, 1);
    assert.equal(byId.get('marketing/never-built').defined, false);
    assert.equal(byId.get('marketing/never-built').pack, null);
    assert.deepEqual(byId.get('workspace/tool-demo').pack.zones.map((zone) => zone.id), [
      'settings-inspector',
      'result-column',
    ]);
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
});

test('a pattern counts as used when a pack composes it, not only when a feature pins it', async () => {
  const workspace = await fixture();
  try {
    const index = await scanSurfaces(workspace);
    const byId = new Map(index.entries.map((entry) => [entry.id, entry]));
    const pattern = byId.get('pattern/demo-page');

    // Nothing pins the pattern directly, so counting adopters alone would call it
    // unused and invite the team to delete a pattern that is in fact in use.
    assert.deepEqual(pattern.adopters, []);
    assert.deepEqual(pattern.composedBy, ['workspace/tool-demo']);
    assert.equal(pattern.used, true);
    assert.equal(index.summary.unused, 0);
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
});

test('the template is not counted as an adopter', async () => {
  const workspace = await fixture();
  try {
    const index = await scanSurfaces(workspace);
    const features = index.entries.flatMap((entry) => entry.adopters.map((adopter) => adopter.feature));
    assert.deepEqual(features, ['demo-feature']);
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
});

test('shell is retained as a semantic category, not an import assertion', async () => {
  const workspace = await fixture();
  try { const index = await scanSurfaces(workspace); assert.deepEqual(index.entries[0].pack.shell, { declared: 'demo-workspace' }); }
  finally { await fs.rm(workspace, { recursive: true, force: true }); }
});

test('an id declared as both a zone and a slot is reported', async () => {
  const workspace = await fixture();
  try {
    const index = await scanSurfaces(workspace);
    const byId = new Map(index.entries.map((entry) => [entry.id, entry]));

    assert.deepEqual(byId.get('workspace/tool-demo').pack.sharedIds, ['settings-inspector']);
    assert.equal(index.summary.packsWithSharedIds, 1);
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
});

test('the page states what is missing rather than only what exists', async () => {
  const workspace = await fixture();
  try {
    const html = renderSurfaceHtml(await scanSurfaces(workspace));

    assert.match(html, /marketing\/never-built/);
    assert.match(html, /只有名字/);
    assert.match(html, /語意分類/);
    // Composition comes from the machine-readable declaration.
    assert.match(html, /component-slots.yaml.composes/);
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
});

test('the server renders the page and exposes the index as JSON', async () => {
  const workspace = await fixture();
  const server = createSurfaceServer({ workspace });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const { port } = server.address();
    const page = await fetch('http://127.0.0.1:' + port + '/');
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Surface Browser/);

    const api = await fetch('http://127.0.0.1:' + port + '/api/index');
    assert.equal((await api.json()).summary.total, 3);

    assert.equal((await fetch('http://127.0.0.1:' + port + '/nope')).status, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(workspace, { recursive: true, force: true });
  }
});
