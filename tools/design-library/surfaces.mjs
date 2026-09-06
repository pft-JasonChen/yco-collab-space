import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { fromRoot, pathExists } from '../prototype-cli/project.mjs';
import { surfacePackRelativeRoot } from '../prototype-cli/surface-policy.mjs';

/**
 * An index of every surface the catalog declares, for the browser to render.
 *
 * The point of this index is not to describe the surfaces flatteringly. It is to
 * make three facts impossible to miss, because nobody has been able to see them:
 *
 *   - a `planned` entry is a name and nothing else,
 *   - a `provisional` entry has never been reviewed by anyone,
 *   - a surface with no adopter has never been used by any feature.
 *
 * So `summary` counts those deliberately, and every entry carries its adopters
 * even when the list is empty.
 */

const SURFACES_ROOT = ['platform', 'surfaces'];
const UI_ROOT = ['platform', 'ui'];

/** Directory names under platform/ui, which is what a `shell:` value should name. */
async function listUiComponents(workspace) {
  const root = path.join(workspace, ...UI_ROOT);
  if (!(await pathExists(root))) return new Set();
  const entries = await fs.readdir(root, { withFileTypes: true });
  return new Set(entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name));
}

/** Version directories that exist on disk for a catalog id, newest last. */
async function listVersions(workspace, id) {
  const root = path.join(workspace, ...SURFACES_ROOT, ...id.split('/'));
  if (!(await pathExists(root))) return [];
  const entries = await fs.readdir(root, { withFileTypes: true });
  const versions = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (await pathExists(path.join(root, entry.name, 'surface.yaml'))) versions.push(entry.name);
  }
  return versions.sort();
}

/**
 * Which patterns a pack composes, read out of the prose in its zone and slot
 * descriptions ("Left column, from pattern/tool-page.").
 *
 * Both files have to be read. tool-video names five patterns in its zones and the
 * sixth only in its slots, so scanning zones alone reports pattern/video-results as
 * used by nobody — which is how a pattern in daily use gets proposed for deletion.
 *
 * This is a regex over English sentences, and it is labelled as derived wherever it
 * is displayed, because that is exactly the point: the composition is real, but no
 * field declares it, so the only way to show it is to read the prose. SB-001 asks RD
 * where the declared version should live.
 */
export function composedPatterns(rows) {
  const found = new Set();
  for (const row of rows) {
    for (const match of String(row.description ?? '').matchAll(/\bfrom (pattern\/[a-z0-9-]+)/gi)) {
      found.add(match[1].toLowerCase());
    }
  }
  return [...found].sort();
}

/** Every feature that pins a pack, as primary or borrowed. */
export async function collectAdopters(workspace = fromRoot()) {
  const byPack = new Map();
  const featuresRoot = path.join(workspace, 'features');
  if (!(await pathExists(featuresRoot))) return byPack;

  const record = (id, adopter) => {
    const list = byPack.get(id) ?? [];
    list.push(adopter);
    byPack.set(id, list);
  };

  const entries = await fs.readdir(featuresRoot, { withFileTypes: true });
  // `_template` is not a feature. Counting it would inflate the adoption numbers
  // this index exists to report honestly.
  const slugs = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .map((entry) => entry.name)
    .sort();

  for (const slug of slugs) {
    const file = path.join(featuresRoot, slug, 'product', 'surface-intent.yaml');
    if (!(await pathExists(file))) continue;
    const intent = parseYaml(await fs.readFile(file, 'utf8'));

    if (intent?.primaryPack?.id) {
      record(intent.primaryPack.id, {
        feature: slug,
        relationship: 'primary',
        version: intent.primaryPack.version ?? null,
        strategy: intent.strategy ?? null,
      });
    }
    for (const borrowed of intent?.borrowedPacks ?? []) {
      if (!borrowed?.id) continue;
      record(borrowed.id, {
        feature: slug,
        relationship: 'borrowed',
        version: borrowed.version ?? null,
        strategy: intent.strategy ?? null,
        roles: borrowed.roles ?? [],
      });
    }
  }
  return byPack;
}

async function readPack(workspace, id, version, uiComponents) {
  const relativeRoot = surfacePackRelativeRoot({ id, version });
  const root = path.join(workspace, relativeRoot);
  if (!(await pathExists(path.join(root, 'surface.yaml')))) return null;

  const manifest = parseYaml(await fs.readFile(path.join(root, 'surface.yaml'), 'utf8')) ?? {};
  const zones = (manifest.zones ?? []).map((zone) => ({
    id: zone.id,
    required: zone.required === true,
    description: zone.description ?? '',
  }));

  const slotsPath = path.join(root, 'component-slots.yaml');
  const slots = (await pathExists(slotsPath))
    ? ((parseYaml(await fs.readFile(slotsPath, 'utf8')) ?? {}).slots ?? []).map((slot) => ({
        id: slot.id,
        required: slot.required === true,
        description: slot.description ?? '',
      }))
    : [];

  const rulesPath = path.join(root, 'layout-rules.md');
  const layoutRules = (await pathExists(rulesPath)) ? await fs.readFile(rulesPath, 'utf8') : null;

  const declaredShell = manifest.shell ?? null;

  return {
    version,
    relativeRoot,
    // `shell` is meant to name the implementation. Today not one value matches a
    // platform/ui directory, so the browser reports the mismatch rather than
    // printing the field as though it resolved.
    shell: declaredShell
      ? { declared: declaredShell, resolves: uiComponents.has(declaredShell) }
      : null,
    zones,
    slots,
    // An id can be both a zone and a component role, which is why SB-002 asks RD
    // which of the two a component binding should attach to.
    sharedIds: zones.map((zone) => zone.id).filter((id) => slots.some((slot) => slot.id === id)).sort(),
    composesPatterns: composedPatterns([...zones, ...slots]),
    responsivePriority: manifest.responsivePriority ?? [],
    decisionBasis: manifest.decisionBasis ?? [],
    layoutRules,
  };
}

export async function scanSurfaces(workspace = fromRoot()) {
  const catalogPath = path.join(workspace, ...SURFACES_ROOT, 'catalog.yaml');
  const catalog = parseYaml(await fs.readFile(catalogPath, 'utf8')) ?? {};
  const uiComponents = await listUiComponents(workspace);
  const adopters = await collectAdopters(workspace);

  const entries = [];
  for (const entry of catalog.entries ?? []) {
    const versions = await listVersions(workspace, entry.id);
    const defaultVersion = entry.defaultVersion ?? null;
    const pack = defaultVersion ? await readPack(workspace, entry.id, defaultVersion, uiComponents) : null;
    const used = adopters.get(entry.id) ?? [];

    entries.push({
      id: entry.id,
      kind: entry.kind,
      status: entry.status,
      defaultVersion,
      versions,
      // A planned entry is one line of catalog and no files at all. Saying so is
      // more useful than showing an empty card.
      defined: pack !== null,
      pack,
      adopters: used,
    });
  }

  // A pattern is used when a pack composes it, not only when a feature pins it.
  // Without this, all six patterns read as unused, because the one pack that
  // composes them records that fact in prose instead of in a field.
  for (const entry of entries) {
    entry.composedBy = entries
      .filter((other) => other.pack?.composesPatterns.includes(entry.id))
      .map((other) => other.id)
      .sort();
    entry.used = entry.adopters.length > 0 || entry.composedBy.length > 0;
  }

  const defined = entries.filter((entry) => entry.defined);
  return {
    entries,
    components: [...uiComponents].sort(),
    summary: {
      total: entries.length,
      byKind: tally(entries, (entry) => entry.kind),
      byStatus: tally(entries, (entry) => entry.status),
      defined: defined.length,
      nameOnly: entries.length - defined.length,
      unused: defined.filter((entry) => !entry.used).length,
      shellMismatches: defined.filter((entry) => entry.pack.shell && !entry.pack.shell.resolves).length,
      // Ids that are both a zone and a component slot in the same pack. SB-002
      // asks RD which of the two a component binding attaches to, so how far the
      // overlap spreads is the measure of how much that answer decides.
      packsWithSharedIds: defined.filter((entry) => entry.pack.sharedIds.length > 0).length,
      versionDirectories: entries.reduce((total, entry) => total + entry.versions.length, 0),
    },
  };
}

function tally(items, pick) {
  const counts = {};
  for (const item of items) {
    const key = pick(item) ?? 'unknown';
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}
