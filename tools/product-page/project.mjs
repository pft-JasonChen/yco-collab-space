import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  fromRoot,
  pathExists,
  readJson,
  readYaml,
  sha256File,
  walkFiles,
} from '../prototype-cli/project.mjs';

export { fromRoot, pathExists, readJson, readYaml, sha256File, walkFiles };

export const pagesRoot = 'product-pages';
export const skillFiles = {
  'spec-to-content': 'product-library/skills/spec-to-content/SKILL.md',
  'page-layout': 'design-library/skills/page-layout/SKILL.md',
  'content-to-strapi': 'strapi/skills/content-to-strapi/SKILL.md',
};
export const rubricFile = 'product-library/review/spec-compliance-rubric.md';
export const messagingRoot = 'product-library/messaging';
export const patternsRoot = 'design-library/patterns/product-page';
export const strapiRoot = 'strapi';
export const tokenLockPath = 'platform/tokens/tokens.lock.json';

export function toPosix(value) {
  return value.split(path.sep).join('/');
}

export function normalisePageSlug(value) {
  const slug = String(value ?? '').trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('Page slug must use lowercase letters, digits and single hyphens.');
  }
  return slug;
}

export function requestedPage(argv = process.argv.slice(2)) {
  const index = argv.indexOf('--page');
  if (index >= 0) return normalisePageSlug(argv[index + 1]);
  const positional = argv.find((argument) => !argument.startsWith('-'));
  return positional ? normalisePageSlug(positional) : null;
}

export async function listPageSlugs(page = null) {
  if (page) {
    const target = fromRoot(pagesRoot, page);
    const stat = await fs.stat(target).catch(() => null);
    if (!stat?.isDirectory()) throw new Error('Product page folder does not exist: ' + page);
    return [page];
  }
  const entries = await fs.readdir(fromRoot(pagesRoot), { withFileTypes: true }).catch(() => []);
  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .map((entry) => entry.name)
    .sort();
}

export function pagePaths(page) {
  const root = path.join(pagesRoot, page);
  return {
    root,
    source: path.join(root, 'source'),
    pageSource: path.join(root, 'source', 'page.source.yaml'),
    brief: path.join(root, 'source', 'brief.md'),
    mockAssets: path.join(root, 'source', 'mock-assets'),
    generated: path.join(root, 'generated'),
    content: path.join(root, 'generated', 'content.json'),
    layout: path.join(root, 'generated', 'layout.json'),
    payload: path.join(root, 'generated', 'strapi-payload.json'),
    review: path.join(root, 'generated', 'review', 'spec-compliance.json'),
    generation: path.join(root, 'generated', 'generation.json'),
    evidence: path.join(root, 'evidence'),
    releases: path.join(root, 'releases.json'),
  };
}

export async function readPageSource(page) {
  return readYaml(pagePaths(page).pageSource);
}

export function sha256Text(value) {
  return createHash('sha256').update(value).digest('hex');
}

export async function sha256Json(relativePath) {
  return sha256Text(await fs.readFile(fromRoot(relativePath), 'utf8'));
}

async function filesUnder(relativeRoot, predicate = () => true) {
  const absoluteRoot = fromRoot(relativeRoot);
  if (!(await pathExists(absoluteRoot))) return [];
  const stat = await fs.stat(absoluteRoot);
  if (stat.isFile()) return [absoluteRoot];
  return walkFiles(absoluteRoot, predicate);
}

/**
 * Every file whose change must invalidate a generated page: PM page source, upstream
 * feature specs, referenced product-library entries, messaging + rubric, all three
 * role-owned skills, Designer patterns, the RD Strapi registry and the token lock.
 */
export async function pageInputFiles(page, source = null) {
  const pageSource = source ?? (await readPageSource(page));
  const paths = pagePaths(page);
  const roots = [
    paths.source,
    ...(pageSource.upstream?.features ?? []).map((feature) => path.join('features', feature, 'product')),
    ...(pageSource.upstream?.products ?? []).map((slug) => path.join('product-library', 'products', slug)),
    ...(pageSource.upstream?.competitors ?? []).map((slug) => path.join('product-library', 'competitors', slug)),
    messagingRoot,
    rubricFile,
    ...Object.values(skillFiles),
    patternsRoot,
    strapiRoot,
    tokenLockPath,
  ];
  const files = new Set();
  for (const root of roots) {
    for (const file of await filesUnder(root, (file) => !path.basename(file).startsWith('.'))) {
      files.add(toPosix(path.relative(fromRoot(), file)));
    }
  }
  return [...files].sort();
}

export async function hashPageInputs(page, source = null) {
  const files = await pageInputFiles(page, source);
  const hash = createHash('sha256');
  const entries = [];
  for (const file of files) {
    const digest = await sha256File(fromRoot(file));
    hash.update(file + '\0' + digest + '\0');
    entries.push({ path: file, sha256: digest });
  }
  return { inputHash: hash.digest('hex'), files: entries };
}

export function headingSlug(value) {
  return String(value)
    .trim()
    .toLocaleLowerCase('en-US')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function markdownHeadingSlugs(source) {
  return new Set(
    String(source)
      .split(/\r?\n/)
      .map((line) => line.match(/^#{1,6}\s+(.+?)\s*$/)?.[1])
      .filter(Boolean)
      .map(headingSlug),
  );
}

export function yamlPathExists(document, dottedPath) {
  let current = document;
  for (const segment of dottedPath.split('.')) {
    if (current === null || typeof current !== 'object') return false;
    const arrayMatch = segment.match(/^([^[]+)\[(\d+)\]$/);
    if (arrayMatch) {
      current = current[arrayMatch[1]];
      if (!Array.isArray(current)) return false;
      current = current[Number(arrayMatch[2])];
      continue;
    }
    if (!(segment in current)) return false;
    current = current[segment];
  }
  return current !== undefined;
}

export function stripHtml(value) {
  return String(value ?? '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
