import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { fromRoot } from '../prototype-cli/project.mjs';
import {
  cleanupIsolatedWorkspace,
  createIsolatedWorkspace,
  runCommand,
} from './workspace.mjs';
import {
  diffSourceSnapshots,
  snapshotFeatureSources,
} from './source-boundary.mjs';

const feature = 'collab-space-readiness';

async function append(workspace, relativePath, source) {
  await fs.appendFile(path.join(workspace, relativePath), source);
}

async function updateYaml(workspace, relativePath, update) {
  const absolutePath = path.join(workspace, relativePath);
  const value = parseYaml(await fs.readFile(absolutePath, 'utf8'));
  update(value);
  await fs.writeFile(absolutePath, stringifyYaml(value));
}

async function updateJson(workspace, relativePath, update) {
  const absolutePath = path.join(workspace, relativePath);
  const value = JSON.parse(await fs.readFile(absolutePath, 'utf8'));
  update(value);
  await fs.writeFile(absolutePath, JSON.stringify(value, null, 2) + '\n');
}

async function replace(workspace, relativePath, pattern, replacement) {
  const absolutePath = path.join(workspace, relativePath);
  const source = await fs.readFile(absolutePath, 'utf8');

  if (!source.includes(pattern)) {
    throw new Error('Mutation target not found in ' + relativePath);
  }

  await fs.writeFile(absolutePath, source.replace(pattern, replacement));
}

const mutations = [
  {
    id: 'contract-unknown-artifact',
    expected: /references unknown artifact: missing-artifact/,
    mutate: (workspace) =>
      updateYaml(workspace, 'collab-space.map.yaml', (map) => {
        map.stages[0].requiredArtifacts.push('missing-artifact');
      }),
    grader: ['npm', ['run', 'validate:contract']],
  },
  {
    id: 'invalid-release-stage',
    expected: /Unknown lifecycle currentStage: imaginary-stage/,
    mutate: (workspace) =>
      updateJson(workspace, 'features/collab-space-readiness/releases.json', (release) => {
        release.currentStage = 'imaginary-stage';
      }),
    grader: ['npm', ['run', 'validate:stages', '--', '--feature', feature]],
  },
  {
    id: 'media-collection-provenance-drift',
    expected: /Media collection changed since generation: assets\/video\/dance/,
    mutate: (workspace) =>
      updateJson(workspace, 'features/collab-space-readiness/generated/generation.json', (generation) => {
        generation.resources.requestedCollections.push({ path: 'assets/video/dance', contextHash: 'stale', fileCount: 0 });
      }),
    grader: ['npm', ['run', 'validate:inputs', '--', '--feature', feature]],
  },
  {
    id: 'token-provenance-drift',
    expected: /Token baseline changed since generation/,
    mutate: (workspace) => append(workspace, 'platform/tokens/tokens.lock.json', ' '),
    grader: ['npm', ['run', 'validate:inputs', '--', '--feature', feature]],
  },
  {
    id: 'unknown-token',
    expected: /Unknown token --token-that-must-not-exist/,
    mutate: (workspace) =>
      append(
        workspace,
        'features/collab-space-readiness/generated/feature.module.scss',
        '\n.evalMutation { color: var(--token-that-must-not-exist); }\n',
      ),
    grader: ['npm', ['run', 'validate:tokens']],
  },
  {
    id: 'raw-colour',
    expected: /Raw colour/,
    mutate: (workspace) =>
      append(
        workspace,
        'features/collab-space-readiness/generated/feature.module.scss',
        '\n.evalMutation { color: #abcdef; }\n',
      ),
    grader: ['npm', ['run', 'validate:tokens']],
  },
  {
    id: 'external-network',
    expected: /disallowed client network API.*fetch/,
    mutate: (workspace) =>
      append(
        workspace,
        'features/collab-space-readiness/generated/feature.jsx',
        '\nexport const evalNetworkMutation = () => fetch("https://example.invalid");\n',
      ),
    grader: ['npm', ['run', 'validate:network']],
  },
  {
    id: 'stale-input',
    expected: /Generated code is stale because product or design inputs changed/,
    mutate: (workspace) =>
      append(
        workspace,
        'features/collab-space-readiness/product/decisions.md',
        '\n- Evaluation mutation.\n',
      ),
    grader: [
      'npm',
      ['run', 'validate:inputs', '--', '--feature', feature],
    ],
  },
  {
    id: 'acceptance-without-check',
    expected: /Acceptance criterion has no executable validation check: P0-003/,
    mutate: (workspace) =>
      updateYaml(
        workspace,
        'features/collab-space-readiness/product/validation.yaml',
        (validation) => validation.checks.pop(),
      ),
    grader: [
      'npm',
      ['run', 'validate:inputs', '--', '--feature', feature],
    ],
  },
  {
    id: 'planned-pack-used-as-reuse',
    expected: /planned but not implemented: workspace\/tool-ai-agent/,
    mutate: (workspace) =>
      updateYaml(
        workspace,
        'features/collab-space-readiness/product/surface-intent.yaml',
        (intent) => {
          intent.strategy = 'reuse';
          intent.primaryPack = {
            id: 'workspace/tool-ai-agent',
            version: '2026-08',
          };
          intent.borrowedPacks = [];
          intent.layoutIntent = {
            zones: [],
            componentRoles: [],
            responsivePriority: [],
          };
        },
      ),
    grader: [
      'npm',
      ['run', 'validate:inputs', '--', '--feature', feature],
    ],
  },
  {
    id: 'novel-without-decision-basis',
    expected: /surface-intent\.yaml:.*must NOT have fewer than 1 items/,
    mutate: (workspace) =>
      updateYaml(
        workspace,
        'features/collab-space-readiness/product/surface-intent.yaml',
        (intent) => {
          intent.decisionBasis = [];
        },
      ),
    grader: [
      'npm',
      ['run', 'validate:inputs', '--', '--feature', feature],
    ],
  },
  {
    id: 'unknown-state-transition',
    expected: /Action references an unknown state: reset-draft/,
    mutate: (workspace) =>
      updateYaml(
        workspace,
        'features/collab-space-readiness/product/prototype.contract.yaml',
        (contract) => {
          contract.actions.find((action) => action.id === 'reset-draft').to =
            'missing-state';
        },
      ),
    grader: [
      'npm',
      ['run', 'validate:inputs', '--', '--feature', feature],
    ],
  },
  {
    id: 'source-boundary-mutation',
    expected: /product\/prd\.md/,
    mutate: (workspace) =>
      append(
        workspace,
        'features/collab-space-readiness/product/prd.md',
        '\nEvaluation mutation.\n',
      ),
    sourceBoundaryOnly: true,
  },
  {
    id: 'horizontal-overflow',
    expected: /Horizontal overflow/,
    mutate: (workspace) =>
      append(
        workspace,
        'features/collab-space-readiness/generated/feature.module.scss',
        '\n.page { min-width: calc(var(--spacing-256) * 20); }\n',
      ),
    setup: [['npm', ['run', 'build:app']]],
    grader: [
      'npm',
      ['run', 'test:rendered', '--', '--feature', feature],
    ],
  },
  {
    id: 'console-error',
    expected: /Console errors: evaluation mutation/,
    mutate: (workspace) =>
      replace(
        workspace,
        'features/collab-space-readiness/generated/feature.jsx',
        'export default function CollabSpaceReadinessFeature() {',
        "export default function CollabSpaceReadinessFeature() {\n  console.error('evaluation mutation');",
      ),
    setup: [['npm', ['run', 'build:app']]],
    grader: [
      'npm',
      ['run', 'test:rendered', '--', '--feature', feature],
    ],
  },
  {
    id: 'missing-surface-zone',
    expected: /Missing required surface zone: readiness-status/,
    mutate: (workspace) =>
      replace(
        workspace,
        'features/collab-space-readiness/generated/feature.jsx',
        'data-surface-zone="readiness-status"',
        'data-surface-zone="wrong-readiness-status"',
      ),
    setup: [['npm', ['run', 'build:app']]],
    grader: [
      'npm',
      ['run', 'test:rendered', '--', '--feature', feature],
    ],
  },
];

const runId =
  new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-') +
  '-mutation-suite';
const runRoot = fromRoot('evals', 'runs', runId);
await fs.mkdir(runRoot, { recursive: true });
const results = [];

for (const mutation of mutations) {
  const workspace = await createIsolatedWorkspace('mutation-' + mutation.id);
  const commands = [];
  let caught = false;
  let observation = '';

  try {
    const sourceBefore = await snapshotFeatureSources(workspace, feature);
    await mutation.mutate(workspace);

    if (mutation.sourceBoundaryOnly) {
      const sourceAfter = await snapshotFeatureSources(workspace, feature);
      const changes = diffSourceSnapshots(sourceBefore, sourceAfter);
      observation = JSON.stringify(changes);
      caught = mutation.expected.test(observation);
    } else {
      let setupPassed = true;

      for (const [command, args] of mutation.setup || []) {
        const result = await runCommand(command, args, { cwd: workspace });
        commands.push(result);
        setupPassed &&= result.exitCode === 0;
      }

      if (setupPassed) {
        const [command, args] = mutation.grader;
        const result = await runCommand(command, args, { cwd: workspace });
        commands.push(result);
        observation = result.stdout + '\n' + result.stderr;
        caught = result.exitCode !== 0 && mutation.expected.test(observation);
      } else {
        observation = commands
          .map((result) => result.stdout + '\n' + result.stderr)
          .join('\n');
      }
    }

    results.push({
      id: mutation.id,
      caught,
      observation: observation.slice(0, 4000),
      commands,
    });
  } finally {
    await cleanupIsolatedWorkspace(workspace);
  }

  process.stdout.write(
    '[mutation] ' + (caught ? 'CAUGHT ' : 'MISSED ') + mutation.id + '\n',
  );
}

const report = {
  schemaVersion: 1,
  runId,
  generatedAt: new Date().toISOString(),
  passed: results.every((result) => result.caught),
  caught: results.filter((result) => result.caught).length,
  total: results.length,
  decisionBasis: [
    'A workflow evaluator is trustworthy only if it detects deliberately seeded failures.',
  ],
  results,
};

await fs.writeFile(
  path.join(runRoot, 'mutation-report.json'),
  JSON.stringify(report, null, 2) + '\n',
);
await fs.writeFile(
  path.join(runRoot, 'mutation-report.md'),
  [
    '# Mutation evaluation',
    '',
    '- Result: **' + (report.passed ? 'PASS' : 'FAIL') + '**',
    '- Caught: ' + report.caught + '/' + report.total,
    '',
    '| Mutation | Result |',
    '|---|---|',
    ...results.map(
      (result) =>
        '| ' + result.id + ' | ' + (result.caught ? 'CAUGHT' : 'MISSED') + ' |',
    ),
    '',
    '## Decision basis',
    '',
    '- ' + report.decisionBasis[0],
    '',
  ].join('\n'),
);

process.stdout.write(
  '[mutation-suite] ' +
    (report.passed ? 'PASS ' : 'FAIL ') +
    report.caught +
    '/' +
    report.total +
    ' — ' +
    path.relative(fromRoot(), runRoot) +
    '\n',
);

if (!report.passed) {
  process.exitCode = 1;
}
