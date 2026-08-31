import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fromRoot, pathExists, walkFiles } from '../prototype-cli/project.mjs';

const dist = fromRoot('dist');
if (!(await pathExists(dist))) throw new Error('dist is missing. Run build:app before public-build validation.');
const forbidden = ['design-library-index.json', '.collab-cache', 'media-intent.yaml', 'tokens.lock.json'];
const failures = [];
for (const file of await walkFiles(dist)) {
  const relative = path.relative(dist, file).split(path.sep).join('/');
  const contents = await fs.readFile(file);
  for (const marker of forbidden) {
    if (relative.includes(marker) || contents.includes(Buffer.from(marker))) failures.push(relative + ' exposes ' + marker);
  }
}
if (failures.length) throw new Error('Public build isolation failed:\n' + failures.join('\n'));
process.stdout.write('[public-build] PASS local indexes and source manifests are excluded\n');
