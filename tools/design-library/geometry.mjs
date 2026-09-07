import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { fromRoot, pathExists, walkFiles } from '../prototype-cli/project.mjs';

/**
 * Geometry parity between a port and the RD source it came from.
 *
 * Two kinds of fact, deliberately kept apart:
 *
 *   declared — a number RD literally writes in its stylesheet. Checkable statically
 *              by resolving our tokens back to pixels and comparing.
 *   measured — an intrinsic result of layout and content, such as the width a two-tab
 *              segmented control settles at. No stylesheet declares it, so it can only
 *              be asserted in a browser at a fixed viewport.
 *
 * Recording which kind a fact is stops a measured value from being presented as if RD
 * had written it down.
 */
const TOKENS_PATH = 'platform/tokens/rd/yce-frontend-1.34.1/variables.css';
const ROOT_FONT_SIZE = 16;

/** Every `--token: value` pair, with rem values already resolved to pixels. */
export async function readTokenPixels(workspace = fromRoot()) {
  const source = await fs.readFile(path.join(workspace, ...TOKENS_PATH.split('/')), 'utf8');
  const raw = new Map();
  for (const match of source.matchAll(/^\s*(--[a-z0-9-]+)\s*:\s*([^;]+);/gm)) {
    raw.set(match[1], match[2].trim());
  }

  const resolve = (value, seen = new Set()) => {
    const alias = /^var\((--[a-z0-9-]+)\)$/.exec(value);
    if (alias) {
      if (seen.has(alias[1])) return null;
      seen.add(alias[1]);
      const next = raw.get(alias[1]);
      return next === undefined ? null : resolve(next, seen);
    }
    const rem = /^(-?[\d.]+)rem$/.exec(value);
    if (rem) return Number(rem[1]) * ROOT_FONT_SIZE;
    const px = /^(-?[\d.]+)px$/.exec(value);
    if (px) return Number(px[1]);
    return null;
  };

  const pixels = new Map();
  for (const [token, value] of raw) {
    const resolved = resolve(value);
    if (resolved !== null) pixels.set(token, resolved);
  }
  return pixels;
}

/** Turn a CSS length written with tokens, rem, px or a simple calc() into pixels. */
export function toPixels(value, tokenPixels) {
  const trimmed = String(value).trim();

  // calc() of additions and subtractions only. Anything richer is a sign the fact
  // should be measured in a browser rather than compared statically.
  const calc = /^calc\((.+)\)$/.exec(trimmed);
  if (calc) {
    const parts = calc[1].split(/\s+([+-])\s+/);
    let total = toPixels(parts[0], tokenPixels);
    if (total === null) return null;
    for (let i = 1; i < parts.length; i += 2) {
      const operand = toPixels(parts[i + 1], tokenPixels);
      if (operand === null) return null;
      total += parts[i] === '-' ? -operand : operand;
    }
    return total;
  }

  const alias = /^var\((--[a-z0-9-]+)(?:\s*,[^)]*)?\)$/.exec(trimmed);
  if (alias) return tokenPixels.get(alias[1]) ?? null;
  const rem = /^(-?[\d.]+)rem$/.exec(trimmed);
  if (rem) return Number(rem[1]) * ROOT_FONT_SIZE;
  const px = /^(-?[\d.]+)px$/.exec(trimmed);
  if (px) return Number(px[1]);
  if (trimmed === '0') return 0;
  return null;
}

/**
 * First declaration of `property` inside the rule whose selector list contains
 * `selector`. Deliberately simple: geometry facts point at one rule and one property,
 * and a fact that needs more than that is a measured fact, not a declared one.
 */
export function readDeclaration(rawSource, selector, property) {
  // Strip comments first: a selector is whatever precedes the brace, and a stray
  // comment or an @import above the first rule would otherwise be read as part of it.
  const source = rawSource.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/[^\n]*/g, '$1');
  const blocks = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < source.length; i += 1) {
    if (source[i] === '{') {
      if (depth === 0) start = i;
      depth += 1;
    } else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) {
        const head = source.slice(0, start);
        const boundary = Math.max(head.lastIndexOf('}'), head.lastIndexOf(';'));
        const selectorText = head.slice(boundary + 1).trim();
        blocks.push({ selectorText, body: source.slice(start + 1, i) });
      }
    }
  }
  for (const block of blocks) {
    const selectors = block.selectorText.split(',').map((entry) => entry.trim());
    if (!selectors.includes(selector)) continue;
    const declaration = new RegExp(`(?:^|;|\\n)\\s*${property}\\s*:\\s*([^;\\n]+)`).exec(block.body);
    if (declaration) return declaration[1].trim();
  }
  return null;
}

/** Split a shorthand into its parts without breaking a calc(). */
function splitLengths(declaration) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const character of declaration) {
    if (character === '(') depth += 1;
    if (character === ')') depth -= 1;
    if (/\s/.test(character) && depth === 0) {
      if (current) parts.push(current);
      current = '';
      continue;
    }
    current += character;
  }
  if (current) parts.push(current);
  return parts;
}

const normalise = (value) => String(value).replace(/\s+/g, ' ').trim();

export async function listGeometryFixtures(workspace = fromRoot()) {
  const root = path.join(workspace, 'platform', 'surfaces');
  if (!(await pathExists(root))) return [];
  return (await walkFiles(root)).filter((file) => path.basename(file) === 'geometry.yaml');
}

export async function checkGeometry({ workspace = fromRoot() } = {}) {
  const tokenPixels = await readTokenPixels(workspace);
  const errors = [];
  const checked = [];
  const deferred = [];

  for (const file of await listGeometryFixtures(workspace)) {
    const relative = path.relative(workspace, file).split(path.sep).join('/');
    const fixture = parseYaml(await fs.readFile(file, 'utf8'));

    for (const fact of fixture.facts ?? []) {
      if (fact.kind === 'measured') {
        deferred.push({ fixture: relative, id: fact.id });
        continue;
      }

      const rdPath = path.join(workspace, 'platform', 'rd-baseline', fixture.snapshot, ...fact.rd.file.split('/'));
      const ourPath = path.join(workspace, ...fact.port.file.split('/'));

      if (!(await pathExists(rdPath))) {
        errors.push(`${relative}: RD baseline is missing for ${fact.id}: ${fact.rd.file}`);
        continue;
      }
      if (!(await pathExists(ourPath))) {
        errors.push(`${relative}: port stylesheet is missing for ${fact.id}: ${fact.port.file}`);
        continue;
      }

      const rdSource = await fs.readFile(rdPath, 'utf8');
      const ourSource = await fs.readFile(ourPath, 'utf8');
      const rdRaw = readDeclaration(rdSource, fact.rd.selector, fact.rd.property);
      const ourRaw = readDeclaration(ourSource, fact.port.selector, fact.port.property);

      if (rdRaw === null) {
        errors.push(`${relative}: ${fact.id} — RD declares no ${fact.rd.property} on ${fact.rd.selector}`);
        continue;
      }
      if (ourRaw === null) {
        errors.push(`${relative}: ${fact.id} — the port declares no ${fact.port.property} on ${fact.port.selector}`);
        continue;
      }

      const rdPixels = splitLengths(rdRaw).map((part) => toPixels(part, tokenPixels));
      const ourPixels = splitLengths(ourRaw).map((part) => toPixels(part, tokenPixels));

      // Not every geometry fact is a length. `aspect-ratio: 368 / 136` carries meaning
      // as written, so compare those literally rather than pretending to resolve them.
      if (rdPixels.includes(null) || ourPixels.includes(null)) {
        if (normalise(rdRaw) === normalise(ourRaw)) {
          checked.push({ fixture: relative, id: fact.id, literal: true });
          continue;
        }
        errors.push(
          `${relative}: ${fact.id} — no pixel reading and the declarations differ ` +
            `(RD "${rdRaw}", port "${ourRaw}")`,
        );
        continue;
      }
      if (rdPixels.length !== ourPixels.length || rdPixels.some((value, index) => value !== ourPixels[index])) {
        const accepted = fact.acceptedDeviation;
        if (accepted) {
          checked.push({ fixture: relative, id: fact.id, deviation: accepted.reason });
          continue;
        }
        errors.push(
          `${relative}: ${fact.id} — geometry drifted. RD ${fact.rd.selector} ${fact.rd.property}: ` +
            `${rdRaw} (${rdPixels.join(' ')}px) vs port ${fact.port.selector} ${fact.port.property}: ` +
            `${ourRaw} (${ourPixels.join(' ')}px)`,
        );
        continue;
      }
      checked.push({ fixture: relative, id: fact.id });
    }
  }

  return { errors, checked, deferred };
}

/**
 * Measured facts, grouped by the viewport they were measured at. A measured fact has
 * no declaration to compare against, so the browser has to produce it.
 */
export async function measuredFacts({ workspace = fromRoot(), packs = null } = {}) {
  const facts = [];
  for (const file of await listGeometryFixtures(workspace)) {
    const relative = path.relative(workspace, file).split(path.sep).join('/');
    const fixture = parseYaml(await fs.readFile(file, 'utf8'));
    // A measured fact only applies to a page that actually composes its pattern.
    // Asserting every fixture against every feature would fail a feature simply for
    // not using a surface it never claimed.
    if (packs && !packs.has(fixture.pack)) continue;
    for (const fact of fixture.facts ?? []) {
      if (fact.kind !== 'measured') continue;
      if (!fact.selector) continue;
      facts.push({
        fixture: relative,
        id: fact.id,
        selector: fact.selector,
        dimension: fact.dimension ?? 'width',
        value: fact.value,
        tolerance: fact.tolerance ?? 1,
        viewport: fact.viewport ?? 'desktop',
      });
    }
  }
  return facts;
}
