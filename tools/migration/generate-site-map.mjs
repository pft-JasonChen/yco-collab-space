import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
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
const snapshot = manifest.source.snapshot;
const { moduleTypes, crossPromoteTypes, productUrls, headerProducts, categoryGroups, categories, subCategoryGroups, subCategories, menuMapping } = await readTaxonomy({ workspace, snapshot });

// crossPromoteTypes maps a module to its cross-promote *identity* ("photo.enhance"),
// not to a sidebar category. The category a module renders under comes from
// crossPromoteMenuMapping, which is declared statically in sideBarMenuUtils.js — see
// SM-003, which had assumed it was fetched from a CMS and therefore underivable.
const OUT_OF_SCOPE_PREFIXES = ['account', 'my-', 'pricing', 'affiliate', 'contact', 'faq', 'blog', 'terms', 'privacy'];

// productUrls and headerProducts are written as `[moduleTypes.x]: '/route'`, so their
// keys are the *effect* the module resolves to, not the module id. Several modules can
// share one effect, so the reverse index is one-to-many. Looking these tables up by
// module id silently returns undefined for every module whose effect differs from its
// id, which reads as "no route" when the route is simply filed under another name.
const modulesByEffect = new Map();
for (const [moduleKey, effect] of Object.entries(moduleTypes)) {
  const list = modulesByEffect.get(effect) ?? [];
  list.push(moduleKey);
  modulesByEffect.set(effect, list);
}
const routeFor = (table, moduleKey) => {
  const value = table[moduleTypes[moduleKey]];
  return typeof value === 'string' ? value : null;
};

const routes = new Map();
for (const [effect, url] of Object.entries(productUrls)) {
  if (typeof url !== 'string' || !url.startsWith('/')) continue;
  const entry = routes.get(url) ?? { route: url, modules: [] };
  entry.modules.push(...(modulesByEffect.get(effect) ?? [effect]));
  routes.set(url, entry);
}

const dispositionsFile = path.join(workspace, 'platform', 'surfaces', 'module-dispositions.yaml');
const dispositionsDoc = parseYaml(await fs.readFile(dispositionsFile, 'utf8'));

// Route-level rulings: which of RD's routes a prototype may target, and which are the
// same surface reached by another name.
const routeRulings = new Map();
for (const group of dispositionsDoc.routeDispositions ?? []) {
  for (const entry of group.routes ?? []) {
    routeRulings.set(entry.route, { ...group, ...entry, routes: undefined });
  }
}

const quote = (value) => (/^[A-Za-z0-9_./:-]+$/.test(value) ? value : JSON.stringify(value));
const lines = [];
const push = (indent, text) => lines.push('  '.repeat(indent) + text);

push(0, 'schemaVersion: 1');
push(0, 'status: derived');
push(0, 'derivedFrom:');
push(1, `snapshot: ${snapshot}`);
push(1, `sourceVersion: ${manifest.source.packageVersion}`);
push(1, 'sources:');
for (const file of manifest.siteMapSource?.files ?? []) push(2, `- ${file.source}`);
push(1, 'generator: tools/migration/generate-site-map.mjs');
push(0, 'counts:');
push(1, `moduleTypes: ${Object.keys(moduleTypes).length}`);
push(1, `categorisedModules: ${Object.keys(crossPromoteTypes).length}`);
push(1, `canonicalRoutes: ${routes.size}`);
push(1, `sidebarCategories: ${categories.length}`);
push(1, `sidebarSubCategories: ${subCategories.length}`);
push(1, `menuMappedModules: ${menuMapping.reduce((total, group) => total + (group.products?.length ?? 0), 0)}`);

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

push(0, '# Which tool family a module belongs to, and where the sidebar files it. Read');
push(0, '# straight out of crossPromoteMenuMapping; nothing here is transcribed by hand.');
push(0, 'sidebarMenu:');
for (const group of menuMapping) {
  push(1, `- category: ${quote(String(group.category))}`);
  push(2, `subCategory: ${quote(String(group.subCategory))}`);
  push(2, 'products:');
  for (const product of group.products ?? []) {
    push(3, `- moduleType: ${quote(String(product.moduleType))}`);
    push(4, `crossPromoteType: ${quote(String(product.crossPromoteType ?? 'null'))}`);
    push(4, product.targetUrl ? `targetUrl: ${quote(String(product.targetUrl))}` : 'targetUrl: null');
  }
}
push(0, 'sidebarSubCategories:');
for (const entry of subCategories) {
  push(1, `- id: ${quote(String(entry.subCategoryGroup ?? entry.subCategory ?? ''))}`);
  push(2, `parent: ${quote(String(entry.categoryGroup ?? entry.category ?? ''))}`);
}

push(0, '# A canonical route is one result page. Several moduleTypes routinely share');
push(0, '# one route: /photo-enhance serves enhance, enhanceBatch, dehazePhoto and');
push(0, '# shaprenImage. The route is the surface; the module is the behaviour on it.');
push(0, 'canonicalRoutes:');
for (const entry of [...routes.values()].sort((a, b) => a.route.localeCompare(b.route))) {
  const ruling = routeRulings.get(entry.route);
  const outOfScope = OUT_OF_SCOPE_PREFIXES.some((prefix) => entry.route.slice(1).startsWith(prefix));
  push(1, `- route: ${quote(entry.route)}`);
  if (ruling) {
    push(2, `scope: ${ruling.disposition}`);
    push(2, 'ruledBy: pm');
    if (ruling.aliasOf) push(2, `aliasOf: ${quote(ruling.aliasOf)}`);
    if (ruling.linksTo) push(2, `linksTo: ${quote(ruling.linksTo)}`);
  } else {
    push(2, `scope: ${outOfScope ? 'out-of-scope' : 'result-page'}`);
  }
  push(2, `modules: [${entry.modules.sort().map(quote).join(', ')}]`);
}

push(0, '# Resolved by the Product Owner on 2026-09-03.');
push(0, 'resolved:');
push(1, '- id: SM-001');
push(2, 'ruling: >-');
push(3, 'SEO landing routes stay out of scope: prototypes never target them. Only two');
push(3, 'representative page entries are vendored so the shape integration.yaml');
push(3, 'prescribes stays checkable. See manifest.pageEntryReference.');
push(1, '- id: SM-002');
push(2, 'ruling: >-');
push(3, 'Answered on 2026-09-04. The generator classifies each uncategorised module and');
push(3, 'the Product Owner ruled the rest in module-dispositions.yaml. It also uncovered a');
push(3, 'defect: productUrls and headerProducts are keyed by effect, not module id, so ten');
push(3, 'live tools had been reported as having no route at all.');
push(1, '- id: SM-003');
push(2, 'ruling: >-');
push(3, 'Corrected on 2026-09-04. The earlier ruling said the module-to-category mapping');
push(3, 'was resolved at runtime from CMS items and had to be recorded by hand once a CMS');
push(3, 'export arrived. That was wrong: crossPromoteMenuMapping in sideBarMenuUtils.js');
push(3, 'declares it statically, naming the moduleType and target URL of every product.');
push(3, 'It is now derived, in sidebarMenu above. No CMS export is needed.');
// crossPromoteTypes is keyed by effect, like productUrls and headerProducts. Ten
// modules whose effect differs from their id looked uncategorised for that reason
// alone; they carry a cross-promote identity and always did.
const uncategorised = Object.keys(moduleTypes)
  .filter((moduleKey) => !(moduleTypes[moduleKey] in crossPromoteTypes))
  .sort();

// SM-002 asked what 62 uncategorised moduleTypes are. Most of the answer is derivable:
// a `category*` module has no category because it *is* one, and a module sharing another
// module's route is a variant of an existing page rather than a missing one. Only what
// needs product knowledge is ruled by hand, in module-dispositions.yaml.
const ruled = new Map();
for (const group of dispositionsDoc.dispositions ?? []) {
  for (const entry of group.modules ?? []) ruled.set(entry.id, group.disposition);
}

const routeOwners = new Map();
for (const entry of routes.values()) {
  for (const moduleKey of entry.modules) routeOwners.set(moduleKey, entry.modules.length);
}

const MARKETING = /^(affiliate|banner$|contest$)/;
const classify = (moduleKey, productRoute, headerRoute) => {
  const ruling = ruled.get(moduleKey);
  if (ruling) return { disposition: ruling, by: 'pm-ruling' };
  if (moduleKey.startsWith('category')) return { disposition: 'taxonomy-node', by: 'derived' };
  if (MARKETING.test(moduleKey)) return { disposition: 'marketing-widget', by: 'derived' };
  // SM-001 put SEO landing routes out of scope, and headerProducts is the landing table.
  if (!productRoute && headerRoute) return { disposition: 'seo-landing', by: 'derived' };
  if (productRoute && (routeOwners.get(moduleKey) ?? 1) > 1) {
    return { disposition: 'page-variant', by: 'derived' };
  }
  // A module holding a canonical route on its own is a page, whatever the sidebar does
  // with it. Absent contrary evidence that is a live feature; a PM ruling overrides.
  if (productRoute) return { disposition: 'live-feature', by: 'derived' };
  return { disposition: 'unresolved', by: null };
};

const classified = uncategorised.map((moduleKey) => {
  const url = routeFor(productUrls, moduleKey);
  const productRoute = url && url.startsWith('/') ? url : null;
  const headerRoute = routeFor(headerProducts, moduleKey);
  return { moduleKey, productRoute, headerRoute, ...classify(moduleKey, productRoute, headerRoute) };
});
const tally = new Map();
for (const entry of classified) tally.set(entry.disposition, (tally.get(entry.disposition) ?? 0) + 1);
const unresolved = classified.filter((entry) => entry.disposition === 'unresolved');

push(0, '# SM-002, resolved on 2026-09-04. Nothing here is guessed: a disposition is either');
push(0, '# derived from the taxonomy or ruled by the Product Owner in module-dispositions.yaml.');
push(0, 'uncategorisedModules:');
push(1, `total: ${classified.length}`);
push(1, 'byDisposition:');
for (const [disposition, count] of [...tally].sort((a, b) => b[1] - a[1])) {
  push(2, `${disposition}: ${count}`);
}
push(1, 'rulingSource: platform/surfaces/module-dispositions.yaml');
push(1, 'modules:');
for (const entry of classified) {
  push(2, `- id: ${quote(entry.moduleKey)}`);
  push(3, `effect: ${quote(String(moduleTypes[entry.moduleKey]))}`);
  push(3, `disposition: ${entry.disposition}`);
  if (entry.by) push(3, `ruledBy: ${entry.by}`);
  push(3, entry.productRoute ? `productUrl: ${quote(entry.productRoute)}` : 'productUrl: null');
  push(3, entry.headerRoute ? `headerProduct: ${quote(entry.headerRoute)}` : 'headerProduct: null');
  push(3, `reachable: ${entry.productRoute || entry.headerRoute ? 'true' : 'false'}`);
}

push(0, 'openQuestions:');
if (unresolved.length === 0) {
  push(1, '[]');
} else {
  push(1, '- id: SM-002');
  push(2, 'question: >-');
  push(3, `${unresolved.length} moduleTypes still carry no category and match no disposition rule.`);
  push(2, 'owner: pm');
  push(2, `modules: [${unresolved.map((entry) => quote(entry.moduleKey)).join(', ')}]`);
}

const out = path.join(workspace, 'platform', 'surfaces', 'site-map.yaml');
await fs.writeFile(out, lines.join('\n') + '\n');
process.stdout.write(
  `[site-map] GENERATED ${categories.length} sidebar categories · ${routes.size} canonical routes · ` +
    `${Object.keys(moduleTypes).length} modules\n`,
);
