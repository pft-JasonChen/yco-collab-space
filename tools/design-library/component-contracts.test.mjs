import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { stringify as stringifyYaml } from 'yaml';
import { validateComponentContracts } from './component-contracts.mjs';

function contract(overrides = {}) {
  return {
    schemaVersion: 1,
    id: 'button',
    displayName: 'Button',
    classification: 'foundation',
    status: 'pilot-approved',
    rd: {
      sourcePackage: 'youcam-enhance-frontend',
      sourceVersion: '1.34.1',
      snapshot: 'yce-frontend-gm-260909',
      sourcePaths: ['src/components/common/button-wrapper/index.js'],
      sourceHashes: [{ path: 'src/components/common/button-wrapper/index.js', sha256: 'a'.repeat(64) }],
    },
    figma: { status: 'pending', fileKey: null, componentSetNodeId: null, variants: [] },
    implementation: {
      importPath: 'platform/ui/button/index.js',
      storyId: 'ui-button',
      framework: 'react',
      dependencies: ['react'],
      removedDependencies: ['next/router'],
    },
    publicApi: { props: [{ name: 'variant', required: false }], states: ['default', 'disabled'] },
    tokens: { lockPath: 'platform/tokens/tokens.lock.json', uses: ['--fill-brand-strong'] },
    assets: [],
    review: {
      pilotApprover: { actor: 'pm', id: 'collab-space-owner', date: '2026-09-01' },
      canonicalReview: { designer: 'pending', rd: 'pending' },
    },
    decisionBasis: ['Pilot contract fixture.'],
    ...overrides,
  };
}

async function fixture(component) {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'yco-components-'));
  await fs.mkdir(path.join(workspace, 'design-library/components/button'), { recursive: true });
  await fs.mkdir(path.join(workspace, 'platform/ui/button'), { recursive: true });
  await fs.writeFile(path.join(workspace, 'platform/ui/button/index.js'), 'export default {};\n');
  await fs.writeFile(path.join(workspace, 'design-library/components/button/component.yaml'), stringifyYaml(component));
  return workspace;
}

test('pilot component contract accepts complete RD provenance and a platform import', async () => {
  const workspace = await fixture(contract());
  try {
    const result = await validateComponentContracts({ workspace });
    assert.deepEqual(result.errors, []);
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
});

test('component contract rejects invalid status and missing RD provenance', async () => {
  const component = contract({ status: 'approved', rd: { sourcePackage: 'rd' } });
  const workspace = await fixture(component);
  try {
    const result = await validateComponentContracts({ workspace });
    assert.match(result.errors.join('\n'), /status|sourceVersion|sourcePaths/);
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
});

test('component contract rejects an unknown implementation import', async () => {
  const component = contract();
  component.implementation.importPath = 'platform/ui/missing/index.js';
  const workspace = await fixture(component);
  try {
    const result = await validateComponentContracts({ workspace });
    assert.match(result.errors.join('\n'), /implementation import does not exist/);
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
});

test('component contract rejects an asset collection with only unsupported files', async () => {
  const component = contract({ assets: [{ path: 'assets/font/yco-icons', usage: 'runtime' }] });
  const workspace = await fixture(component);
  try {
    const collection = path.join(workspace, 'design-library/assets/font/yco-icons');
    await fs.mkdir(collection, { recursive: true });
    await fs.writeFile(path.join(collection, 'icons.ttf'), 'not-allowlisted');
    const result = await validateComponentContracts({ workspace });
    assert.match(result.errors.join('\n'), /missing or empty|Unsupported font/);
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
});
