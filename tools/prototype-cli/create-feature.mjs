import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  fromRoot,
  normaliseFeatureSlug,
  pathExists,
  walkFiles,
} from './project.mjs';

const slug = normaliseFeatureSlug(process.argv[2]);
const title =
  process.argv[3] ||
  slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
const templateRoot = fromRoot('features', '_template');
const targetRoot = fromRoot('features', slug);

if (await pathExists(targetRoot)) {
  throw new Error('Feature already exists: ' + slug);
}

await fs.cp(templateRoot, targetRoot, { recursive: true });

for (const file of await walkFiles(targetRoot)) {
  const source = await fs.readFile(file, 'utf8');
  const updated = source
    .replaceAll('__FEATURE_SLUG__', slug)
    .replaceAll('__FEATURE_TITLE__', title);
  await fs.writeFile(file, updated);
}

process.stdout.write(
  'Created features/' +
    slug +
    '. Run prototype-intake and confirm PM inputs before generation.\n',
);
