import { promises as fs } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fromRoot } from '../prototype-cli/project.mjs';

/**
 * Reads RD's module taxonomy out of the vendored snapshot.
 *
 * These files are plain object literals behind `@/` import aliases, so they cannot
 * simply be imported. Evaluating just the literals in a locked-down VM context —
 * no require, no process, no timers — keeps the derivation honest: the site map is
 * computed from RD's own declarations rather than transcribed by hand.
 */
export const TAXONOMY_SOURCES = [
  'src/types/moduleTypes.js',
  'src/types/moduleConfigTypes.js',
  'src/components/result-page/common/features-panel/utils/sideBarMenuUtils.js',
];

function objectLiteral(source, name) {
  const declaration = new RegExp(`(?:export )?const ${name}\\s*=\\s*\\{`).exec(source);
  if (!declaration) return null;
  const open = declaration.index + declaration[0].length - 1;
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  return null;
}

function evaluate(literal, scope) {
  const context = vm.createContext(Object.create(null));
  Object.assign(context, scope);
  return vm.runInContext(`(${literal})`, context, { timeout: 2000 });
}

export async function readTaxonomy({ workspace = fromRoot(), snapshot } = {}) {
  const root = path.join(workspace, 'platform', 'rd-baseline', snapshot);
  const [types, config, sidebar] = await Promise.all(
    TAXONOMY_SOURCES.map((relative) => fs.readFile(path.join(root, ...relative.split('/')), 'utf8')),
  );

  const moduleTypes = evaluate(objectLiteral(types, 'moduleTypes'), {});
  const sodTypes = evaluate(objectLiteral(types, 'sodTypes'), {}) ?? {};
  const basicEditingTypes = evaluate(objectLiteral(types, 'basicEditingTypes'), {}) ?? {};
  const scope = { moduleTypes, sodTypes, basicEditingTypes };
  const crossPromoteTypes = evaluate(objectLiteral(types, 'crossPromoteTypes'), scope);
  const productUrls = evaluate(objectLiteral(config, 'productUrls'), scope);
  const headerProducts = evaluate(objectLiteral(config, 'headerProducts'), scope);

  // The sidebar's own category list, in the order it renders. `crossPromoteCategoryGroups`
  // also declares `aiGenerator`, which no category entry references, so it never appears.
  const categoryGroups = evaluate(objectLiteral(sidebar, 'crossPromoteCategoryGroups'), {}) ?? {};
  const categoriesLiteral = /const crossPromoteCategories\s*=\s*(\[[\s\S]*?\n\];)/.exec(sidebar);
  const categories = categoriesLiteral
    ? evaluate(categoriesLiteral[1].replace(/;$/, ''), { crossPromoteCategoryGroups: categoryGroups })
    : [];

  return { moduleTypes, crossPromoteTypes, productUrls, headerProducts, categoryGroups, categories };
}

/** Reverse the moduleTypes map so a raw effect string resolves back to its key. */
export function moduleKeyByValue(moduleTypes) {
  const byValue = new Map();
  for (const [key, value] of Object.entries(moduleTypes)) {
    if (typeof value === 'string' && !byValue.has(value)) byValue.set(value, key);
  }
  return byValue;
}
