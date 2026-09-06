import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { syncComponentSpecs } from './sync-component-specs.mjs';

function contract(overrides = {}) {
  return {
    schemaVersion: 1,
    id: 'widget',
    displayName: 'Widget',
    classification: 'foundation',
    status: 'pilot-approved',
    rd: {
      sourcePackage: 'youcam-enhance-frontend',
      sourceVersion: '1.34.1',
      snapshot: 'yce-frontend-gm-260909',
      sourcePaths: ['src/components/common/widget/index.js'],
      sourceHashes: [{ path: 'src/components/common/widget/index.js', sha256: 'a'.repeat(64) }],
    },
    figma: { status: 'pending', fileKey: null, componentSetNodeId: null, variants: [] },
    implementation: {
      importPath: 'platform/ui/widget/index.js',
      storyId: 'ui-widget',
      framework: 'react',
      dependencies: ['react'],
      removedDependencies: ['next/router'],
    },
    publicApi: {
      props: [
        { name: 'label', required: false },
        { name: 'disabled', required: false },
      ],
      states: ['default', 'disabled'],
    },
    tokens: { lockPath: 'platform/tokens/tokens.lock.json', uses: ['--fill-brand-strong'] },
    assets: [],
    review: {
      pilotApprover: { actor: 'pm', id: 'collab-space-owner', date: '2026-09-01' },
      canonicalReview: { designer: 'pending', rd: 'pending' },
    },
    decisionBasis: ['Widget fixture. Uses `opacity: 0.3` when disabled.'],
    ...overrides,
  };
}

const widgetJsx = (extra = '') =>
  `export default function Widget({ label, disabled }) {\n  // disabled uses opacity: 0.3\n  ${extra}\n  return null;\n}\n`;
const widgetJsxWithoutOpacity = () => `export default function Widget({ label, disabled }) {\n  // opacity removed entirely\n  return null;\n}\n`;

async function fixture(component, jsxSource) {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'yco-sync-specs-'));
  await fs.mkdir(path.join(workspace, 'design-library/components/widget'), { recursive: true });
  await fs.mkdir(path.join(workspace, 'platform/ui/widget'), { recursive: true });
  await fs.writeFile(path.join(workspace, 'platform/ui/widget/index.js'), 'export { default } from "./Widget.jsx";\n');
  await fs.writeFile(path.join(workspace, 'platform/ui/widget/Widget.jsx'), jsxSource);
  await fs.writeFile(path.join(workspace, 'design-library/components/widget/component.yaml'), stringifyYaml(component));
  return workspace;
}

async function readContract(workspace) {
  const raw = await fs.readFile(path.join(workspace, 'design-library/components/widget/component.yaml'), 'utf8');
  return { raw, parsed: parseYaml(raw) };
}

test('first run baselines localFiles without touching decisionBasis', async () => {
  const workspace = await fixture(contract(), widgetJsx());
  try {
    const report = await syncComponentSpecs({ workspace });
    assert.deepEqual(report.needsReview, []);
    assert.deepEqual(report.baselined.map((e) => e.id), ['widget']);

    const { parsed } = await readContract(workspace);
    assert.ok(parsed.implementation.localFiles.length > 0);
    assert.equal(parsed.decisionBasis.length, 1); // unchanged from fixture
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
});

test('a clean change (no documented prop or literal affected) auto-syncs', async () => {
  const workspace = await fixture(contract(), widgetJsx());
  try {
    await syncComponentSpecs({ workspace }); // baseline
    await fs.writeFile(path.join(workspace, 'platform/ui/widget/Widget.jsx'), widgetJsx('// harmless comment'));

    const report = await syncComponentSpecs({ workspace });
    assert.deepEqual(report.needsReview, []);
    assert.equal(report.synced.length, 1);
    assert.equal(report.synced[0].id, 'widget');

    const { parsed } = await readContract(workspace);
    assert.equal(parsed.decisionBasis.length, 2);
    assert.match(parsed.decisionBasis[1], /Auto-sync/);

    // running again with nothing further changed should be a no-op
    const secondReport = await syncComponentSpecs({ workspace });
    assert.deepEqual(secondReport.synced, []);
    assert.deepEqual(secondReport.unchanged, ['widget']);
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
});

test('removing a documented prop is flagged for review and the file is left untouched', async () => {
  const workspace = await fixture(contract(), widgetJsx());
  try {
    await syncComponentSpecs({ workspace }); // baseline
    const before = await readContract(workspace);

    // `disabled` is documented in publicApi.props but no longer destructured
    await fs.writeFile(path.join(workspace, 'platform/ui/widget/Widget.jsx'), 'export default function Widget({ label }) {\n  return null;\n}\n');

    const report = await syncComponentSpecs({ workspace });
    assert.equal(report.synced.length, 0);
    assert.equal(report.needsReview.length, 1);
    assert.match(report.needsReview[0].reason, /disabled/);

    const after = await readContract(workspace);
    assert.equal(after.raw, before.raw); // component.yaml is byte-for-byte untouched
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
});

test('a documented literal value disappearing from the implementation is flagged for review', async () => {
  const workspace = await fixture(contract(), widgetJsx());
  try {
    await syncComponentSpecs({ workspace }); // baseline
    const before = await readContract(workspace);

    // decisionBasis says `opacity: 0.3` but no current file contains it
    await fs.writeFile(path.join(workspace, 'platform/ui/widget/Widget.jsx'), widgetJsxWithoutOpacity());

    const report = await syncComponentSpecs({ workspace });
    assert.equal(report.synced.length, 0);
    assert.equal(report.needsReview.length, 1);
    assert.match(report.needsReview[0].reason, /opacity: 0\.3/);

    const after = await readContract(workspace);
    assert.equal(after.raw, before.raw);
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
});

test('adding a new file to the component directory is flagged for review', async () => {
  const workspace = await fixture(contract(), widgetJsx());
  try {
    await syncComponentSpecs({ workspace }); // baseline
    const before = await readContract(workspace);

    await fs.writeFile(path.join(workspace, 'platform/ui/widget/Widget.module.css'), '.root { color: red; }\n');

    const report = await syncComponentSpecs({ workspace });
    assert.equal(report.synced.length, 0);
    assert.equal(report.needsReview.length, 1);
    assert.match(report.needsReview[0].reason, /new file/);

    const after = await readContract(workspace);
    assert.equal(after.raw, before.raw);
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
});

test('removing a tracked file is flagged for review', async () => {
  const workspace = await fixture(contract(), widgetJsx());
  try {
    await fs.writeFile(path.join(workspace, 'platform/ui/widget/Widget.module.css'), '.root { color: red; }\n');
    await syncComponentSpecs({ workspace }); // baseline (now tracks 3 files)
    const before = await readContract(workspace);

    await fs.rm(path.join(workspace, 'platform/ui/widget/Widget.module.css'));

    const report = await syncComponentSpecs({ workspace });
    assert.equal(report.synced.length, 0);
    assert.equal(report.needsReview.length, 1);
    assert.match(report.needsReview[0].reason, /removed/);

    const after = await readContract(workspace);
    assert.equal(after.raw, before.raw);
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
});

test('write: false performs no writes but still reports what would happen', async () => {
  const workspace = await fixture(contract(), widgetJsx());
  try {
    await syncComponentSpecs({ workspace }); // baseline
    await fs.writeFile(path.join(workspace, 'platform/ui/widget/Widget.jsx'), widgetJsx('// harmless comment'));

    const before = await readContract(workspace);
    const report = await syncComponentSpecs({ workspace, write: false });
    assert.equal(report.synced.length, 1);
    const after = await readContract(workspace);
    assert.equal(after.raw, before.raw); // no write happened despite being reported as syncable
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
});
