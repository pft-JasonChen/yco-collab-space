import { promises as fs } from 'node:fs';
import path from 'node:path';
import { readYaml, walkFiles } from '../prototype-cli/project.mjs';
import { fromRoot, markdownHeadingSlugs, pathExists, toPosix } from './project.mjs';

async function indexKind(kind, fileName) {
  const root = fromRoot('product-library', kind);
  if (!(await pathExists(root))) return [];
  const entries = [];
  const files = (await walkFiles(root, (file) => path.basename(file) === fileName)).filter((file) => !file.includes(path.sep + '_template' + path.sep));
  for (const file of files) {
    const relative = toPosix(path.relative(fromRoot(), file));
    const document = await readYaml(relative);
    const pages = [];
    for (const page of document.pages ?? []) {
      const pagePath = path.join(path.dirname(file), page.file);
      if (!(await pathExists(pagePath))) continue;
      pages.push({ ...page, path: toPosix(path.relative(fromRoot(), pagePath)), headings: [...markdownHeadingSlugs(await fs.readFile(pagePath, 'utf8'))] });
    }
    entries.push({ slug: document.slug, name: document.name, status: document.status, path: relative, pages });
  }
  return entries;
}

const index = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  products: await indexKind('products', 'product.yaml'),
  competitors: await indexKind('competitors', 'competitor.yaml'),
};
const cachePath = fromRoot('.collab-cache', 'product-library-index.json');
await fs.mkdir(path.dirname(cachePath), { recursive: true });
await fs.writeFile(cachePath, JSON.stringify(index, null, 2) + '\n');
process.stdout.write('[product-library] INDEXED ' + index.products.length + ' products, ' + index.competitors.length + ' competitors → .collab-cache/product-library-index.json\n');
