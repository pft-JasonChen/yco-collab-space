import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { fromRoot, readJson } from '../prototype-cli/project.mjs';
import { readTaxonomy } from './extract-taxonomy.mjs';

/**
 * Every claim this repository makes about an RD module, checked against every RD source
 * that could contradict it.
 *
 * This exists because four separate errors in one session shared a cause: a conclusion
 * drawn from whichever table happened to be read first. Three of them were the same
 * mistake. productUrls, headerProducts, crossPromoteTypes and acmsTypes all write their
 * keys as `[moduleTypes.x]`, so the key is the module's *effect*, not its id, and looking
 * them up by id silently answers "absent" for every module whose effect differs. Ten live
 * tools were reported as unreachable and uncategorised on exactly that basis.
 *
 * So the keying is no longer assumed. Each table is probed against both key spaces and
 * the audit fails if the shape is not what the code expects.
 */
const workspace = fromRoot();
const manifest = await readJson('migration/rd-snapshot-manifest.json', workspace);
const snapshot = manifest.source.snapshot;
const baseline = (relative) => path.join(workspace, 'platform', 'rd-baseline', snapshot, ...relative.split('/'));

const taxonomy = await readTaxonomy({ workspace, snapshot });
const { moduleTypes, crossPromoteTypes, productUrls, headerProducts, menuMapping } = taxonomy;

const moduleIds = new Set(Object.keys(moduleTypes));
const effects = new Set(Object.values(moduleTypes).map(String));

/** Which key space a table actually uses, decided by counting rather than assumed. */
function keySpace(name, table) {
  const keys = Object.keys(table);
  const asId = keys.filter((key) => moduleIds.has(key)).length;
  const asEffect = keys.filter((key) => effects.has(key)).length;
  return { name, keys: keys.length, asId, asEffect, uses: asEffect >= asId ? 'effect' : 'id' };
}

const spaces = [
  keySpace('productUrls', productUrls),
  keySpace('headerProducts', headerProducts),
  keySpace('crossPromoteTypes', crossPromoteTypes),
];

// Read textually rather than evaluated: the source writes module ids, so scanning the
// text sidesteps the key-space question these tables otherwise raise.
const renderSource = await fs.readFile(
  baseline('src/components/result-page/components/moduleRenderer/moduleRenderer.js'),
  'utf8',
);
const rendersPage = new Set([...renderSource.matchAll(/\[moduleTypes\.([A-Za-z0-9_]+)\]/g)].map((m) => m[1]));

const acmsSource = await fs.readFile(baseline('src/types/acmsTypes.js'), 'utf8');
const acmsCategory = new Set([...acmsSource.matchAll(/\[moduleTypes\.([A-Za-z0-9_]+)\]:/g)].map((m) => m[1]));
const engineListMatch = /export const supportPFengineSingleEffects\s*=\s*\[([\s\S]*?)\]/.exec(acmsSource);
const pfEngineEffects = new Set(
  engineListMatch ? [...engineListMatch[1].matchAll(/'([A-Za-z0-9_]+)'/g)].map((m) => m[1]) : [],
);

const inSidebarMenu = new Set();
for (const group of menuMapping) {
  for (const product of group.products ?? []) inSidebarMenu.add(String(product.moduleType));
}

const lookup = (table, moduleKey) => {
  const value = table[moduleTypes[moduleKey]];
  return typeof value === 'string' ? value : null;
};

export function evidenceFor(moduleKey) {
  const effect = String(moduleTypes[moduleKey]);
  return {
    module: moduleKey,
    effect,
    rendersPage: rendersPage.has(moduleKey),
    productUrl: lookup(productUrls, moduleKey),
    headerProduct: lookup(headerProducts, moduleKey),
    crossPromoteType: lookup(crossPromoteTypes, moduleKey),
    inSidebarMenu: inSidebarMenu.has(effect),
    acmsCategory: acmsCategory.has(moduleKey),
    pfEngineEffect: pfEngineEffects.has(effect),
  };
}

/** A module has a surface if anything at all would let a user arrive at it. */
export const hasSurface = (evidence) =>
  evidence.rendersPage ||
  Boolean(evidence.productUrl) ||
  Boolean(evidence.headerProduct) ||
  Boolean(evidence.crossPromoteType) ||
  evidence.inSidebarMenu;

export async function auditModules({ workspace: root = workspace } = {}) {
  const errors = [];
  const warnings = [];

  for (const space of spaces) {
    if (space.uses !== 'effect') {
      errors.push(
        `${space.name} is keyed by ${space.uses}, not effect. Every lookup in this ` +
          `repository assumes effect keying; re-check them before trusting any result.`,
      );
    }
  }

  const dispositions = parseYaml(
    await fs.readFile(path.join(root, 'platform', 'surfaces', 'module-dispositions.yaml'), 'utf8'),
  );
  const ruled = new Map();
  for (const group of dispositions.dispositions ?? []) {
    for (const entry of group.modules ?? []) ruled.set(entry.id, group.disposition);
  }

  // A route ruling that names a route RD does not serve, or an alias pointing at a
  // route that does not exist, is a stale ruling — the kind that survives a snapshot
  // refresh unnoticed and quietly misdirects a prototype.
  const servedRoutes = new Set(Object.values(productUrls).filter((url) => typeof url === 'string'));
  for (const group of dispositions.routeDispositions ?? []) {
    if (group.aliasOf && !servedRoutes.has(group.aliasOf)) {
      errors.push(`Route ruling aliases ${group.aliasOf}, which no module serves`);
    }
    for (const entry of group.routes ?? []) {
      if (!servedRoutes.has(entry.route)) {
        errors.push(`Route ruling names ${entry.route}, which no module serves`);
      }
      if (entry.module && !(entry.module in moduleTypes)) {
        errors.push(`Route ruling names module ${entry.module}, which does not exist`);
      }
    }
  }

  const rows = Object.keys(moduleTypes).sort().map(evidenceFor);

  for (const evidence of rows) {
    const ruling = ruled.get(evidence.module);
    if (!ruling) continue;

    // A module said to be an engine effect must not be something a user can open.
    if (ruling === 'engine-effect' && hasSurface(evidence)) {
      errors.push(
        `${evidence.module} is ruled engine-effect but has a surface: ` +
          `${[
            evidence.rendersPage && 'renders a result page',
            evidence.productUrl && `productUrl ${evidence.productUrl}`,
            evidence.headerProduct && `headerProduct ${evidence.headerProduct}`,
            evidence.crossPromoteType && `crossPromoteType ${evidence.crossPromoteType}`,
            evidence.inSidebarMenu && 'listed in the sidebar menu',
          ]
            .filter(Boolean)
            .join(', ')}`,
      );
    }

    // A landing page is a page in components/home, never a rendered result page.
    if (ruling === 'seo-landing' && evidence.rendersPage) {
      errors.push(`${evidence.module} is ruled seo-landing but renders a result page`);
    }

    // No exception list. `sod` was carved out of this check when it first fired, which
    // is the same move that produced every other error here: the anomaly was silenced
    // instead of read. It turned out to be the background removal page.
    if (ruling === 'page-infrastructure' && evidence.rendersPage) {
      errors.push(`${evidence.module} is ruled page-infrastructure but renders a result page`);
    }
  }

  // The reverse direction: anything that renders a page and is ruled at all should be
  // ruled as something page-shaped.
  for (const evidence of rows) {
    if (!evidence.rendersPage) continue;
    const ruling = ruled.get(evidence.module);
    if (ruling && !['live-feature', 'page-variant', 'page-infrastructure'].includes(ruling)) {
      errors.push(`${evidence.module} renders a result page but is ruled ${ruling}`);
    }
  }

  return { errors, warnings, rows, spaces };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { errors, warnings, rows, spaces } = await auditModules();
  for (const space of spaces) {
    process.stdout.write(
      `[audit] ${space.name}: ${space.keys} keys — ${space.asEffect} match an effect, ` +
        `${space.asId} match a module id -> keyed by ${space.uses}\n`,
    );
  }
  for (const warning of warnings) process.stdout.write(`[audit] WARN ${warning}\n`);
  if (errors.length > 0) {
    for (const error of errors) process.stderr.write(`[audit] FAIL ${error}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(
      `[audit] PASS ${rows.length} modules; ${rows.filter(hasSurface).length} have a surface\n`,
    );
  }
}
