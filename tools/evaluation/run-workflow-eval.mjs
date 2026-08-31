import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  fromRoot,
  normaliseFeatureSlug,
  readYaml,
} from '../prototype-cli/project.mjs';
import {
  cleanupIsolatedWorkspace,
  createIsolatedWorkspace,
  runCommand,
} from './workspace.mjs';
import {
  diffSourceSnapshots,
  snapshotFeatureSources,
} from './source-boundary.mjs';

function argument(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function markdownReport(report) {
  const lines = [
    '# Workflow evaluation — ' + report.case.id,
    '',
    '- Feature: `' + report.case.feature + '`',
    '- Suite: `' + report.case.suite + '`',
    '- Verdict: **' + report.verdict + '**',
    '- Trials: ' + report.summary.successfulTrials + '/' + report.summary.trials,
    '- pass@1: ' + report.summary.passAt1,
    '- pass^k: ' + report.summary.passToK,
    '- Visual review: ' + report.summary.visualReview,
    '',
    '| Trial | Source boundary | Gates | Rendered | Duration | Verdict |',
    '|---|---|---|---|---|---|',
  ];

  for (const trial of report.trials) {
    lines.push(
      '| ' +
        trial.trial +
        ' | ' +
        (trial.sourceChanges.length === 0 ? 'PASS' : 'FAIL') +
        ' | ' +
        (trial.gatesPassed ? 'PASS' : 'FAIL') +
        ' | ' +
        (trial.renderedPassed ? 'PASS' : 'FAIL') +
        ' | ' +
        trial.durationMs +
        ' ms | ' +
        trial.verdict +
        ' |',
    );
  }

  lines.push('', '## Decision basis', '');
  lines.push(...report.case.decisionBasis.map((item) => '- ' + item));
  lines.push('');

  return lines.join('\n');
}

async function copyEvidence(workspace, feature, destination) {
  const evidence = path.join(workspace, 'features', feature, 'evidence');
  const stat = await fs.stat(evidence).catch(() => null);

  if (stat?.isDirectory()) {
    await fs.cp(evidence, destination, { recursive: true });
  }
}

const caseId = argument('--case', 'collab-space-readiness-regression');

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(caseId)) {
  throw new Error('Evaluation case ID must be kebab-case.');
}

const casePath = 'evals/cases/' + caseId + '.yaml';
const evaluationCase = await readYaml(casePath);
const feature = normaliseFeatureSlug(evaluationCase.feature);
const requestedTrials = Number(argument('--trials', evaluationCase.trials || 1));
const adapterScript = argument('--adapter-script');

if (!Number.isInteger(requestedTrials) || requestedTrials < 1) {
  throw new Error('Trials must be a positive integer.');
}

const runId =
  new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-') +
  '-' +
  caseId;
const runRoot = fromRoot('evals', 'runs', runId);
await fs.mkdir(runRoot, { recursive: true });
const trials = [];

for (let trialNumber = 1; trialNumber <= requestedTrials; trialNumber += 1) {
  const startedAt = Date.now();
  const workspace = await createIsolatedWorkspace(
    caseId + '-' + trialNumber,
  );
  const commands = [];

  try {
    const sourceBefore = await snapshotFeatureSources(workspace, feature);

    if (adapterScript) {
      const adapterPath = path.resolve(workspace, adapterScript);

      if (!adapterPath.startsWith(path.resolve(workspace) + path.sep)) {
        throw new Error('Adapter script must stay inside the evaluation workspace.');
      }

      commands.push(
        await runCommand(process.execPath, [adapterPath, feature], {
          cwd: workspace,
          env: {
            PROTOTYPE_EVAL_CASE: caseId,
            PROTOTYPE_EVAL_TRIAL: String(trialNumber),
          },
        }),
      );
    }

    const sourceAfter = await snapshotFeatureSources(workspace, feature);
    const sourceChanges = diffSourceSnapshots(sourceBefore, sourceAfter);
    const gateCommands = [
      ['npm', ['run', 'validate:intake', '--', '--feature', feature]],
      ['npm', ['run', 'validate:surfaces']],
      ['npm', ['run', 'validate:inputs', '--', '--feature', feature]],
      ['npm', ['run', 'validate:tokens']],
      ['npm', ['run', 'validate:network']],
      ['npm', ['run', 'build:app']],
    ];

    for (const [command, args] of gateCommands) {
      commands.push(await runCommand(command, args, { cwd: workspace }));
    }

    let renderedPassed = true;

    if (evaluationCase.rendered) {
      const rendered = await runCommand(
        'npm',
        ['run', 'test:rendered', '--', '--feature', feature],
        { cwd: workspace },
      );
      commands.push(rendered);
      renderedPassed = rendered.exitCode === 0;
    }

    const generation = JSON.parse(
      await fs.readFile(
        path.join(
          workspace,
          'features',
          feature,
          'generated',
          'generation.json',
        ),
        'utf8',
      ),
    );
    const surfaceMatches =
      generation.surface?.strategy === evaluationCase.expectedSurfaceStrategy;
    const gatesPassed =
      sourceChanges.length === 0 &&
      commands.every((command) => command.exitCode === 0) &&
      surfaceMatches;
    const verdict =
      gatesPassed && renderedPassed ? 'FUNCTIONALLY_READY' : 'INVALID';
    const trial = {
      trial: trialNumber,
      verdict,
      gatesPassed,
      renderedPassed,
      surfaceMatches,
      visualReview: generation.surface?.visualReview || 'not-recorded',
      sourceChanges,
      durationMs: Date.now() - startedAt,
      commands,
    };

    await copyEvidence(
      workspace,
      feature,
      path.join(runRoot, 'trial-' + trialNumber + '-evidence'),
    );
    trials.push(trial);
  } finally {
    await cleanupIsolatedWorkspace(workspace);
  }
}

const successfulTrials = trials.filter(
  (trial) => trial.verdict === 'FUNCTIONALLY_READY',
).length;
const report = {
  schemaVersion: 1,
  runId,
  generatedAt: new Date().toISOString(),
  case: evaluationCase,
  verdict:
    successfulTrials === requestedTrials ? 'FUNCTIONALLY_READY' : 'INVALID',
  summary: {
    trials: requestedTrials,
    successfulTrials,
    passAt1:
      trials[0]?.verdict === 'FUNCTIONALLY_READY' ? 1 : 0,
    passToK: successfulTrials === requestedTrials ? 1 : 0,
    successRate: successfulTrials / requestedTrials,
    visualReview: trials.every(
      (trial) => trial.visualReview === 'reference-ready',
    )
      ? 'reference-ready'
      : 'human-required',
  },
  trials,
};

await fs.writeFile(
  path.join(runRoot, 'report.json'),
  JSON.stringify(report, null, 2) + '\n',
);
await fs.writeFile(
  path.join(runRoot, 'report.md'),
  markdownReport(report),
);

process.stdout.write(
  '[workflow-eval] ' +
    report.verdict +
    ' ' +
    successfulTrials +
    '/' +
    requestedTrials +
    ' — ' +
    path.relative(fromRoot(), runRoot) +
    '\n',
);

if (report.verdict === 'INVALID') {
  process.exitCode = 1;
}
