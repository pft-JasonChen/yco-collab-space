import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  fromRoot,
  readJson,
  sha256File,
  walkFiles,
} from './project.mjs';
import {
  extractTokenDefinitions,
  extractTokenReferences,
  findRawColours,
} from './token-policy.mjs';

const lock = await readJson('platform/tokens/tokens.lock.json');
const definitions = new Set();
const failures = [];

for (const file of lock.files) {
  const absolutePath = fromRoot(file.path);
  const source = await fs.readFile(absolutePath, 'utf8');
  const hash = await sha256File(absolutePath);
  const fileDefinitions = extractTokenDefinitions(source);

  if (hash !== file.sha256) {
    failures.push('Upstream token hash changed: ' + file.path);
  }

  if (fileDefinitions.size !== file.uniqueTokenCount) {
    failures.push('Unexpected token count in ' + file.path);
  }

  for (const token of fileDefinitions) {
    definitions.add(token);
  }
}

if (definitions.size !== lock.combinedUniqueTokenCount) {
  failures.push('Combined unique token count does not match tokens.lock.json.');
}

const styleRoots = [
  fromRoot('app'),
  fromRoot('platform', 'runtime'),
  fromRoot('platform', 'ui'),
  fromRoot('features'),
];

for (const styleRoot of styleRoots) {
  const files = await walkFiles(
    styleRoot,
    (file) =>
      (file.endsWith('.css') || file.endsWith('.scss')) &&
      !file.includes(path.join('features', '_template')),
  );

  for (const file of files) {
    const source = await fs.readFile(file, 'utf8');
    const relativePath = path.relative(fromRoot(), file);
    const rawColours = findRawColours(source);

    if (rawColours.length > 0) {
      failures.push(
        'Raw colour in ' + relativePath + ': ' + rawColours.join(', '),
      );
    }

    for (const reference of extractTokenReferences(source)) {
      if (!definitions.has(reference)) {
        failures.push('Unknown token ' + reference + ' in ' + relativePath);
      }
    }
  }
}

if (failures.length > 0) {
  process.stderr.write('[tokens] FAIL\n');
  for (const failure of failures) {
    process.stderr.write('  - ' + failure + '\n');
  }
  process.exitCode = 1;
} else {
  process.stdout.write(
    '[tokens] PASS ' +
      definitions.size +
      ' unique tokens; upstream hashes match\n',
  );
}
