import { spawnSync } from 'node:child_process';
import { fromRoot, normaliseFeatureSlug } from '../prototype-cli/project.mjs';

/**
 * The end of a generation, as one command: close the source guard, record
 * provenance with the adapter and model that produced the code, and prove the
 * inputs still validate. This is what the Stop hook checks for.
 *
 *   npm run prototype:finish -- <feature> --adapter claude --model <model-id> [--usage '{...}'] [--skip-guard]
 *
 * --skip-guard is for prototype-revise, where product edits are intended and no
 * source snapshot was taken.
 */
const argv = process.argv.slice(2);
const feature = normaliseFeatureSlug(argv[0]);
const skipGuard = argv.includes('--skip-guard');
const passthrough = argv.slice(1).filter((value) => value !== '--skip-guard');
const has = (name) => passthrough.includes(name);

if (!has('--adapter') || !has('--model')) {
  throw new Error('prototype:finish needs --adapter <adapter> and --model <model-id>; provenance without them is not evidence.');
}

const steps = [
  ...(skipGuard
    ? []
    : [['source-guard check', [fromRoot('tools', 'prototype-cli', 'source-guard.mjs'), 'check', feature]]]),
  ['record generation', [fromRoot('tools', 'prototype-cli', 'record-generation.mjs'), feature, ...passthrough]],
  ['validate inputs', [fromRoot('tools', 'prototype-cli', 'validate-inputs.mjs'), '--feature', feature]],
];

for (const [label, args] of steps) {
  const result = spawnSync(process.execPath, args, { cwd: fromRoot(), stdio: 'inherit' });
  if (result.status !== 0) {
    process.stderr.write('[finish] FAIL at ' + label + '\n');
    process.exit(result.status ?? 1);
  }
}

process.stdout.write('[finish] DONE ' + feature + ' — provenance recorded and inputs validated\n');
