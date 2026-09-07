import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fromRoot, readJson, sha256File } from '../prototype-cli/project.mjs';
import { validateComponentContracts } from '../design-library/component-contracts.mjs';

/**
 * Writes the evidence half of each reusable surface pattern.
 *
 * The authored halves — surface.yaml, component-slots.yaml, layout-rules.md — are
 * owner decisions and are never touched here. provenance.json and the RD file list
 * inside evaluation.yaml are derived from the vendored baseline, so a pattern can no
 * longer claim `requires-current-production-capture` while pointing at nothing.
 */
const workspace = fromRoot();
const VERSION = '2026-09';
const manifest = await readJson('migration/rd-snapshot-manifest.json', workspace);
const snapshot = manifest.source.snapshot;
const baselineRoot = path.join(workspace, 'platform', 'rd-baseline', snapshot);

/** Which catalogued components each pattern is composed of, and how widely RD uses it. */
const PATTERNS = {
  'tool-page': { components: ['tool-page-layout', 'result-page-shell'], rdSurface: 'feature-layout', adoption: '31/34' },
  'video-results': { components: ['video-results-surface'], rdSurface: 'video-feature', adoption: '10/34' },
  'history-list': { components: ['video-history', 'icon-action-buttons'], rdSurface: 'video-feature', adoption: '10/34' },
  'detail-modal': { components: ['video-info-dialog'], rdSurface: 'video-feature', adoption: '10/34' },
  'uploaded-media': { components: ['upload-media-block'], rdSurface: 'upload-image-block', adoption: 'not-measured' },
  'action-footer': { components: ['credit-controls', 'button'], rdSurface: 'apply-button-with-coin-credit', adoption: '7/34' },
};

const { contracts, errors } = await validateComponentContracts({ workspace });
if (errors.length > 0) throw new Error(errors.join('\n'));
const byId = new Map(contracts.map(({ contract }) => [contract.id, contract]));

const written = [];
for (const [pattern, spec] of Object.entries(PATTERNS)) {
  const evidence = [];
  for (const componentId of spec.components) {
    const contract = byId.get(componentId);
    if (!contract) throw new Error('Pattern references an uncatalogued component: ' + componentId);
    for (const sourcePath of contract.rd.sourcePaths) {
      const absolute = path.join(baselineRoot, ...sourcePath.split('/'));
      evidence.push({ path: sourcePath, sha256: await sha256File(absolute), component: componentId });
    }
  }
  evidence.sort((a, b) => a.path.localeCompare(b.path));

  const root = path.join(workspace, 'platform', 'surfaces', 'pattern', pattern, VERSION);
  await fs.mkdir(root, { recursive: true });
  await fs.writeFile(
    path.join(root, 'provenance.json'),
    JSON.stringify(
      {
        schemaVersion: 1,
        pack: `pattern/${pattern}`,
        version: VERSION,
        sourceCatalog: 'rd-vendored-baseline',
        evidenceStatus: 'vendored-source-verified',
        capturedAt: new Date().toISOString().slice(0, 10),
        figma: null,
        rd: {
          snapshot,
          sourceVersion: manifest.source.packageVersion,
          primarySurface: spec.rdSurface,
          familyAdoption: spec.adoption,
          components: spec.components,
          evidence,
        },
        decisionBasis: [
          'Evidence is the vendored RD source every catalogued component in this pattern was ported from, with the hash each file carries in platform/rd-baseline. It is verifiable on any clone by validate:snapshot.',
          'familyAdoption is how many of the 34 result-page families import the RD surface this pattern models, measured in docs/surfaces/rd-composition-deviations.md. It is context, not approval.',
          'Visual and geometry parity against a running production page is a separate concern; this status only claims that the structural source is pinned and checkable.',
        ],
      },
      null,
      2,
    ) + '\n',
  );
  written.push({ pattern, files: evidence.length });
}

process.stdout.write(
  '[patterns] EVIDENCE ' +
    written.map((entry) => `${entry.pattern}(${entry.files})`).join(' ') +
    '\n',
);
