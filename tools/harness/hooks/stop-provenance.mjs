import { promises as fs } from 'node:fs';
import { fromRoot, pathExists } from '../../prototype-cli/project.mjs';
import { readActiveWorkflow } from '../active-workflow.mjs';
import { guarded, readStdinJson, respond } from './io.mjs';

// Stop hook. A prototype-update or prototype-revise turn may not end with an open
// source-guard snapshot or a generation.json that predates the run or names no
// model. This is the rule that stopped being followed by hand.
await guarded('stop-provenance', async () => {
  const input = await readStdinJson();
  if (input?.stop_hook_active) return;

  const active = await readActiveWorkflow();
  if (!active || !['prototype-update', 'prototype-revise'].includes(active.workflow)) {
    return;
  }

  const feature = active.feature;
  const problems = [];
  const guardState = fromRoot('.prototype-state', feature + '-source.json');
  const generationPath = fromRoot('features', feature, 'generated', 'generation.json');

  if (active.workflow === 'prototype-update' && (await pathExists(guardState))) {
    problems.push('the source-guard snapshot is still open (prototype:update:check has not run)');
  }

  if (!(await pathExists(generationPath))) {
    problems.push('generated/generation.json does not exist');
  } else {
    const generation = JSON.parse(await fs.readFile(generationPath, 'utf8'));
    if (!generation.adapter || generation.adapter === 'not-recorded') {
      problems.push('generation.json has no adapter recorded');
    }
    if (!generation.model || generation.model === 'not-recorded') {
      problems.push('generation.json has no model recorded');
    }
    if (Date.parse(generation.generatedAt) < Date.parse(active.startedAt)) {
      problems.push('generation.json predates this ' + active.workflow + ' run');
    }
  }

  if (problems.length === 0) return;

  respond({
    decision: 'block',
    reason:
      '[provenance] ' +
      active.workflow +
      ' for ' +
      feature +
      ' is not finished: ' +
      problems.join('; ') +
      '. Run `npm run prototype:finish -- ' +
      feature +
      ' --adapter <adapter> --model <model-id>`' +
      (active.workflow === 'prototype-revise' ? ' --skip-guard' : '') +
      ' and report the result. If the generation was deliberately abandoned, run `npm run workflow:end` and say so.',
  });
});
