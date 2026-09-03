import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fromRoot, readJson } from '../prototype-cli/project.mjs';
import { readTaxonomy } from './extract-taxonomy.mjs';

/**
 * Derives platform/surfaces/site-map.yaml from RD's own taxonomy.
 *
 * Nothing here is transcribed: the sidebar categories, the canonical routes and the
 * modules that share them all come from the vendored RD declarations. What cannot be
 * derived is recorded as an open question rather than guessed. Re-running it after a
 * snapshot refresh is how the map stays true.
 */
const workspace = fromRoot();
const manifest = await readJson('migration/rd-snapshot-manifest.json', workspace);
const snapshot = manifest.source?.snapshot ?? 'yce-frontend-gm-260909';
const { moduleTypes, crossPromoteTypes, productUrls, categoryGroups, categories } = await readTaxonomy({ workspace, snapshot });

// crossPromoteTypes maps a module to its cross-promote *identity* ("photo.enhance"),
// not to a sidebar category. Which category a module renders under is resolved at
// runtime from CMS-supplied items, so it cannot be derived here — see SM-003.
const OUT_OF_SCOPE_PREFIXES = ['account', 'my-', 'pricing', 'affiliate', 'contact', 'faq', 'blog', 'terms', 'privacy'];

const routes = new Map();
for (const [moduleKey, url] of Object.entries(productUrls)) {
  if (typeof url !== 'string' || !url.startsWith('/')) continue;
  const entry = routes.get(url) ?? { route: url, modules: [] };
  entry.modules.push(moduleKey);
  routes.set(url, entry);
}

const quote = (value) => (/^[A-Za-z0-9_./:-]+$/.test(value) ? value : JSON.stringify(value));
const lines = [];
const push = (indent, text) => lines.push('  '.repeat(indent) + text);

push(0, 'schemaVersion: 1');
push(0, 'status: derived');
push(0, 'derivedFrom:');
push(1, `snapshot: ${snapshot}`);
push(1, `sourceVersion: ${manifest.source?.packageVersion ?? 'unknown'}`);
push(1, 'sources:');
for (const file of manifest.siteMapSource?.files ?? []) push(2, `- ${file.source}`);
push(1, 'generator: tools/migration/generate-site-map.mjs');
push(0, 'counts:');
push(1, `moduleTypes: ${Object.keys(moduleTypes).length}`);
push(1, `categorisedModules: ${Object.keys(crossPromoteTypes).length}`);
push(1, `canonicalRoutes: ${routes.size}`);
push(1, `sidebarCategories: ${categories.length}`);

push(0, '# The sidebar renders these categories in this order. `crossPromoteCategoryGroups`');
push(0, '# also declares aiGenerator, which no category entry references, so it never shows.');
push(0, 'sidebarCategories:');
for (const category of [...categories].sort((a, b) => a.displayOrder - b.displayOrder)) {
  push(1, `- id: ${quote(category.categoryGroup)}`);
  push(2, `displayOrder: ${category.displayOrder}`);
  push(2, `labelKey: ${quote(category.categoryName)}`);
}
push(0, 'declaredButUnrendered:');
for (const group of Object.keys(categoryGroups).sort()) {
  if (!categories.some((category) => category.categoryGroup === group)) push(1, `- ${quote(group)}`);
}

push(0, '# A canonical route is one result page. Several moduleTypes routinely share');
push(0, '# one route: /photo-enhance serves enhance, enhanceBatch, dehazePhoto and');
push(0, '# shaprenImage. The route is the surface; the module is the behaviour on it.');
push(0, 'canonicalRoutes:');
for (const entry of [...routes.values()].sort((a, b) => a.route.localeCompare(b.route))) {
  const outOfScope = OUT_OF_SCOPE_PREFIXES.some((prefix) => entry.route.slice(1).startsWith(prefix));
  push(1, `- route: ${quote(entry.route)}`);
  push(2, `scope: ${outOfScope ? 'out-of-scope' : 'result-page'}`);
  push(2, `modules: [${entry.modules.sort().map(quote).join(', ')}]`);
}

push(0, '# Resolved by the Product Owner on 2026-09-03.');
push(0, 'resolved:');
push(1, '- id: SM-001');
push(2, 'ruling: >-');
push(3, 'SEO landing routes stay out of scope: prototypes never target them. Only two');
push(3, 'representative page entries are vendored so the shape integration.yaml');
push(3, 'prescribes stays checkable. See manifest.pageEntryReference.');
push(1, '- id: SM-003');
push(2, 'ruling: >-');
push(3, 'The module-to-category mapping is recorded by hand rather than derived, because');
push(3, 'the sidebar resolves it at runtime from CMS-supplied items. It is not in this');
push(3, 'generated file; put it in a hand-maintained record when the CMS export arrives.');
push(0, 'openQuestions:');
push(1, '- id: SM-002');
push(2, 'question: >-');
push(3, `${Object.keys(moduleTypes).length - Object.keys(crossPromoteTypes).length} moduleTypes carry no crossPromoteTypes category, so they belong to no tool`);
push(3, 'family. Are they retired, internal, or simply missing from the sidebar?');
push(2, 'owner: pm');

const out = path.join(workspace, 'platform', 'surfaces', 'site-map.yaml');
await fs.writeFile(out, lines.join('\n') + '\n');
process.stdout.write(
  `[site-map] GENERATED ${categories.length} sidebar categories · ${routes.size} canonical routes · ` +
    `${Object.keys(moduleTypes).length} modules\n`,
);
