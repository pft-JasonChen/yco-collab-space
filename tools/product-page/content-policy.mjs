import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { fromRoot, markdownHeadingSlugs, pagePaths, pathExists, sha256Text, stripHtml, yamlPathExists } from './project.mjs';

export const sectionRoles = ['intro', 'benefits', 'how-to', 'use-case-group-heading', 'use-case', 'faq'];
export const capabilityRoles = new Set(['benefits', 'how-to', 'use-case', 'faq']);

export function allowedSourceRoots(page, source) {
  const roots = [
    pagePaths(page).source + '/',
    'product-library/messaging/',
    ...(source.upstream?.features ?? []).map((feature) => 'features/' + feature + '/product/'),
    ...(source.upstream?.products ?? []).map((slug) => 'product-library/products/' + slug + '/'),
  ];
  const competitorRoots = (source.upstream?.competitors ?? []).map((slug) => 'product-library/competitors/' + slug + '/');
  return { roots, competitorRoots };
}

const fileCache = new Map();
async function readCached(relativePath) {
  if (!fileCache.has(relativePath)) fileCache.set(relativePath, await fs.readFile(fromRoot(relativePath), 'utf8'));
  return fileCache.get(relativePath);
}

export async function sourceRefError(ref, allowed) {
  if (typeof ref !== 'string' || ref.length === 0) return 'sourceRef must be a non-empty string';
  const [filePath, anchor] = ref.split('#');
  const isCompetitor = allowed.competitorRoots.some((root) => filePath.startsWith(root));
  if (!isCompetitor && !allowed.roots.some((root) => filePath.startsWith(root))) return 'sourceRef points outside the page upstream: ' + ref;
  if (!(await pathExists(fromRoot(filePath)))) return 'sourceRef file does not exist: ' + filePath;
  if (!anchor) return null;
  const text = await readCached(filePath);
  if (filePath.endsWith('.md')) {
    if (!markdownHeadingSlugs(text).has(anchor)) return 'sourceRef heading not found: ' + ref;
  } else if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
    if (!yamlPathExists(parseYaml(text), anchor)) return 'sourceRef key not found: ' + ref;
  } else if (filePath.endsWith('.json')) {
    if (!yamlPathExists(JSON.parse(text), anchor)) return 'sourceRef key not found: ' + ref;
  }
  return null;
}

function nodesRequiringSources(content) {
  const nodes = [{ where: 'hero', refs: content.hero?.sourceRefs, capability: false }];
  if (content.seo) nodes.push({ where: 'seo', refs: content.seo.sourceRefs, capability: false });
  (content.sections ?? []).forEach((section, index) => {
    const base = 'sections[' + index + ']';
    nodes.push({ where: base, refs: section.sourceRefs, capability: capabilityRoles.has(section.role) });
    (section.bullets ?? []).forEach((bullet, i) => nodes.push({ where: base + '.bullets[' + i + ']', refs: bullet.sourceRefs, capability: true }));
    (section.steps ?? []).forEach((step, i) => nodes.push({ where: base + '.steps[' + i + ']', refs: step.sourceRefs, capability: true }));
    (section.items ?? []).forEach((item, i) => nodes.push({ where: base + '.items[' + i + ']', refs: item.sourceRefs, capability: true }));
  });
  return nodes;
}

export async function contentSemanticErrors(content, page, source) {
  const errors = [];
  if (content.page !== page) errors.push('content.json page does not match folder: ' + page);
  if (content.locale !== source.locale) errors.push('content.json locale does not match page.source.yaml');
  if (content.meta?.pageKey !== source.pageKey) errors.push('content.meta.pageKey must equal page.source.yaml pageKey');
  if (content.meta?.functionKey !== source.functionKey) errors.push('content.meta.functionKey must equal page.source.yaml functionKey');
  if (content.meta?.audience !== source.audience) errors.push('content.meta.audience must equal page.source.yaml audience');
  const allowed = allowedSourceRoots(page, source);
  const ids = new Set();
  const roles = new Set();
  for (const section of content.sections ?? []) {
    if (ids.has(section.id)) errors.push('Duplicate content section id: ' + section.id);
    ids.add(section.id);
    roles.add(section.role);
    if (!sectionRoles.includes(section.role)) errors.push('Unknown section role ' + section.role + ' in ' + section.id);
  }
  for (const role of source.requiredSections ?? []) {
    if (!roles.has(role)) errors.push('Required section role is missing: ' + role);
  }
  for (const node of nodesRequiringSources(content)) {
    if (!Array.isArray(node.refs) || node.refs.length === 0) {
      errors.push(node.where + ' has no sourceRefs');
      continue;
    }
    let nonCompetitor = false;
    for (const ref of node.refs) {
      const error = await sourceRefError(ref, allowed);
      if (error) errors.push(node.where + ': ' + error);
      else if (!allowed.competitorRoots.some((root) => ref.startsWith(root))) nonCompetitor = true;
    }
    if (node.capability && !nonCompetitor) errors.push(node.where + ' cites only competitor sources for a product capability');
  }
  const seo = content.seo ?? {};
  if (stripHtml(seo.metaTitle).length > 70) errors.push('seo.metaTitle exceeds 70 characters');
  if (stripHtml(seo.metaDescription).length > 160) errors.push('seo.metaDescription exceeds 160 characters');
  const placeholder = /lorem ipsum|\bTBD\b|\bTODO\b/i;
  const scan = (value, where) => {
    if (typeof value === 'string' && placeholder.test(value)) errors.push(where + ' contains placeholder text');
    else if (Array.isArray(value)) value.forEach((item, i) => scan(item, where + '[' + i + ']'));
    else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) if (k !== 'sourceRefs') scan(v, where + '.' + k);
  };
  scan(content.hero, 'hero');
  scan(content.sections, 'sections');
  scan(content.seo, 'seo');
  for (const media of collectMedia(content)) {
    const error = await assetRefError(media.assetRef, page, source);
    if (error) errors.push(media.where + ': ' + error);
  }
  return errors;
}

export function collectMedia(content) {
  const media = [];
  (content.hero?.media ?? []).forEach((item, i) => media.push({ ...item, where: 'hero.media[' + i + ']' }));
  (content.sections ?? []).forEach((section, s) => {
    (section.media ?? []).forEach((item, i) => media.push({ ...item, where: 'sections[' + s + '].media[' + i + ']' }));
    (section.steps ?? []).forEach((step, j) => (step.media ?? []).forEach((item, i) => media.push({ ...item, where: 'sections[' + s + '].steps[' + j + '].media[' + i + ']' })));
  });
  return media;
}

export function parseAssetRef(ref) {
  const match = String(ref ?? '').match(/^(strapi|design-library|mock):(.+)$/);
  return match ? { kind: match[1], target: match[2] } : null;
}

export async function assetRefError(ref, page, source) {
  const parsed = parseAssetRef(ref);
  if (!parsed) return 'assetRef must be strapi:<ref>, design-library:assets/<type>/<collection>/<file> or mock:<file>; received ' + ref;
  if (parsed.kind === 'design-library') {
    if (!/^assets\/(image|video|icon|illustration|logo)\/[a-z0-9][a-z0-9-]*\/.+/.test(parsed.target)) return 'design-library assetRef must be assets/<type>/<collection>/<file>: ' + ref;
    if (!(await pathExists(fromRoot('design-library', parsed.target)))) return 'design-library asset does not exist: ' + parsed.target;
  }
  if (parsed.kind === 'mock') {
    if (source.media?.allowMockAssets === false) return 'mock assets are not allowed for this page: ' + ref;
    if (parsed.target.includes('..')) return 'mock assetRef may not traverse directories: ' + ref;
    if (!(await pathExists(fromRoot(pagePaths(page).mockAssets, parsed.target)))) return 'mock asset does not exist: ' + parsed.target;
  }
  return null;
}

export function assetRefRepositoryPath(ref, page) {
  const parsed = parseAssetRef(ref);
  if (!parsed) return null;
  if (parsed.kind === 'design-library') return 'design-library/' + parsed.target;
  if (parsed.kind === 'mock') return path.posix.join(pagePaths(page).mockAssets.split(path.sep).join('/'), parsed.target);
  return null;
}

export function reviewErrors(review, contentText, generation) {
  const errors = [];
  const contentHash = sha256Text(contentText);
  if (review.contentHash !== contentHash) errors.push('spec-compliance review is stale: it reviewed a different content.json');
  if (!['pass', 'pass-with-notes'].includes(review.verdict)) errors.push('spec-compliance review verdict is ' + review.verdict);
  const blockers = (review.findings ?? []).filter((finding) => finding.severity === 'blocker');
  if (blockers.length > 0 && review.verdict !== 'fail') errors.push('review has blocker findings but verdict is not fail');
  if (review.reviewer?.model && review.builder?.model && review.reviewer.model === review.builder.model) errors.push('reviewer model must differ from builder model');
  if (generation && review.builder?.model && generation.builder?.model && review.builder.model !== generation.builder.model) errors.push('review records a different builder model than generation.json');
  return errors;
}
