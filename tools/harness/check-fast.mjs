import { spawnSync } from 'node:child_process';
import { fromRoot, requestedFeature } from '../prototype-cli/project.mjs';

/**
 * The fix-loop gate for one feature: the static gates that can fail on generated
 * code, the app build, and the rendered check. It skips Storybook, RD parity,
 * geometry, snapshot and module audits, which only platform changes can break.
 * Run the full `npm run build` once this passes and before any stage transition.
 *
 *   npm run prototype:check:fast -- <feature> [--check a,b] [--viewport name] [--no-build]
 */
const feature = requestedFeature();
if (!feature) throw new Error('Usage: prototype:check:fast -- <feature> [--check a,b] [--viewport name] [--no-build]');

const argv = process.argv.slice(2);
const flag = (name) => {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : null;
};
const skipBuild = argv.includes('--no-build');
const renderedArgs = ['--feature', feature];
for (const name of ['--check', '--viewport']) {
  const value = flag(name);
  if (value) renderedArgs.push(name, value);
}

const steps = [
  ['validate:intake', ['run', 'validate:intake', '--', '--feature', feature]],
  ['validate:inputs', ['run', 'validate:inputs', '--', '--feature', feature]],
  ['validate:tokens', ['run', 'validate:tokens']],
  ['validate:network', ['run', 'validate:network']],
  ...(skipBuild ? [] : [['build:app', ['run', 'build:app']]]),
  ['test:rendered', ['run', 'test:rendered', '--', ...renderedArgs]],
];

const startedAt = Date.now();
for (const [label, args] of steps) {
  const stepStart = Date.now();
  const result = spawnSync('npm', args, {
    cwd: fromRoot(),
    stdio: 'inherit',
    shell: true,
  });
  const seconds = ((Date.now() - stepStart) / 1000).toFixed(1);
  if (result.status !== 0) {
    process.stderr.write('[check:fast] FAIL at ' + label + ' after ' + seconds + 's\n');
    if (label === 'test:rendered') {
      process.stderr.write('[check:fast] summarise with: npm run rendered:summary -- ' + feature + '\n');
    }
    process.exit(result.status ?? 1);
  }
  process.stdout.write('[check:fast] ok ' + label + ' (' + seconds + 's)\n');
}

process.stdout.write(
  '[check:fast] PASS ' + feature + ' in ' + ((Date.now() - startedAt) / 1000).toFixed(1) +
    's — run `npm run build` for the full gate before a stage transition\n',
);
