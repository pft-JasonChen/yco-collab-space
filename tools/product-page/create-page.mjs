import { promises as fs } from 'node:fs';
import { walkFiles } from '../prototype-cli/project.mjs';
import { fromRoot, normalisePageSlug, pagesRoot, pathExists } from './project.mjs';

const slug = normalisePageSlug(process.argv[2]);
const title = process.argv[3] || slug.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
const templateRoot = fromRoot(pagesRoot, '_template');
const targetRoot = fromRoot(pagesRoot, slug);
if (await pathExists(targetRoot)) throw new Error('Product page already exists: ' + slug);
await fs.cp(templateRoot, targetRoot, { recursive: true });
for (const file of await walkFiles(targetRoot)) {
  const source = await fs.readFile(file, 'utf8');
  await fs.writeFile(file, source.replaceAll('__PAGE_SLUG__', slug).replaceAll('__PAGE_TITLE__', title));
}
process.stdout.write('Created product-pages/' + slug + '. Run /product-page-brief ' + slug + ' to confirm the PM brief before generation.\n');
