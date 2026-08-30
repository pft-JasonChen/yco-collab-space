import { promises as fs } from 'node:fs';
import path from 'node:path';
import { findNetworkApis } from './network-policy.mjs';
import { fromRoot, walkFiles } from './project.mjs';

const roots = [
  fromRoot('app', 'src'),
  fromRoot('platform', 'runtime'),
  fromRoot('platform', 'ui'),
  fromRoot('features'),
];
const failures = [];

for (const root of roots) {
  const files = await walkFiles(
    root,
    (file) =>
      /\.(?:js|jsx|mjs)$/.test(file) &&
      !file.includes(path.join('features', '_template')),
  );

  for (const file of files) {
    const source = await fs.readFile(file, 'utf8');
    const matches = findNetworkApis(source);

    if (matches.length > 0) {
      failures.push(
        path.relative(fromRoot(), file) + ': ' + matches.join(', '),
      );
    }
  }
}

if (failures.length > 0) {
  process.stderr.write('[network] FAIL\n');
  for (const failure of failures) {
    process.stderr.write('  - disallowed client network API in ' + failure + '\n');
  }
  process.exitCode = 1;
} else {
  process.stdout.write('[network] PASS — no client network APIs detected\n');
}
