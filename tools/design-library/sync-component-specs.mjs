// Keeps each design-library/components/*/component.yaml's implementation.localFiles
// hashes (and a decisionBasis note) in sync with the actual platform/ui/** files.
//
// This is a heuristic, NOT a semantic reviewer. It can tell you a file's hash
// changed; it cannot tell you whether the change is "fine" the way a person
// reading the diff can. So it only auto-syncs when two cheap, deterministic
// checks both come back clean:
//   1. Public prop check — the destructured prop names it can find in the
//      component's own .jsx file(s) still match publicApi.props exactly.
//   2. Documented-literal check — every backtick-quoted, CSS-value-shaped
//      snippet anywhere in this component's decisionBasis (e.g. `opacity: 0.3`,
//      `--fill-disabled`, `2px`) still appears somewhere in the component's
//      current files.
// Either check tripping (or a file being added/removed) means "don't guess" —
// the component is left completely untouched and reported under needsReview
// instead, for a human/agent to look at and decide by hand.
//
// First run for a component with no recorded implementation.localFiles yet is
// a baseline: it just records current hashes, no decisionBasis note, since
// there's nothing to compare against.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import Ajv from 'ajv';
import { fromRoot, pathExists, readJson, sha256File } from '../prototype-cli/project.mjs';
import { listComponentContractFiles } from './component-contracts.mjs';

const schema = await readJson('tools/design-library/schemas/component-contract.schema.json');
const validateSchema = new Ajv({ allErrors: true, strict: false }).compile(schema);

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

// ---- reading the actual implementation directory ----

async function listComponentDirFiles(workspace, dir) {
  const absoluteDir = path.join(workspace, ...dir.split('/'));
  const entries = await fs.readdir(absoluteDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && !entry.name.startsWith('.'))
    .map((entry) => toPosix(path.posix.join(dir, entry.name)))
    .sort();
}

async function hashCurrentFiles(workspace, filePaths) {
  const result = [];
  for (const relativePath of filePaths) {
    const sha256 = await sha256File(path.join(workspace, ...relativePath.split('/')));
    result.push({ path: relativePath, sha256 });
  }
  return result;
}

// ---- heuristic 1: public prop names ----

// Splits a destructured param-list body on its TOP-LEVEL commas only — a
// naive `.split(',')` breaks as soon as any entry has a default value with
// its own comma-bearing braces/parens in it (e.g. `labels = {}`, or a
// default arrow function), which single-line param lists can avoid but the
// multi-line, heavily-commented signatures this codebase actually uses
// cannot.
function splitTopLevelEntries(body) {
  const entries = [];
  let depth = 0;
  let current = '';
  for (const ch of body) {
    if (ch === '{' || ch === '[' || ch === '(') depth++;
    else if (ch === '}' || ch === ']' || ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      entries.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) entries.push(current);
  return entries;
}

function extractDestructuredPropNames(source) {
  const names = new Set();
  // Strip comments first — this codebase's components document individual
  // props with substantial `/** ... */` blocks (and occasional `//` lines)
  // INSIDE the param list, and those often contain their own commas/braces/
  // parens, which would otherwise confuse the brace-depth split below.
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');
  // Matches `function Name({ a, b = x, ...rest })` and `= ({ a, b }) =>` styles —
  // the consistent destructured-props convention this codebase's components
  // use. Finds each `({` and then walks forward tracking brace depth to find
  // its true matching `}` (rather than stopping at the first one), so a
  // default object value like `= {}` nested inside the param list doesn't
  // truncate the match.
  for (let i = 0; i < withoutComments.length - 1; i++) {
    if (withoutComments[i] !== '(') continue;
    let j = i + 1;
    while (j < withoutComments.length && /\s/.test(withoutComments[j])) j++;
    if (withoutComments[j] !== '{') continue;
    let depth = 0;
    let k = j;
    for (; k < withoutComments.length; k++) {
      if (withoutComments[k] === '{') depth++;
      else if (withoutComments[k] === '}') {
        depth--;
        if (depth === 0) break;
      }
    }
    if (depth !== 0) continue; // unbalanced — bail on this occurrence
    let m = k + 1;
    while (m < withoutComments.length && /\s/.test(withoutComments[m])) m++;
    if (withoutComments[m] !== ')') continue;
    const body = withoutComments.slice(j + 1, k);
    for (const rawEntry of splitTopLevelEntries(body)) {
      const entry = rawEntry.trim();
      if (!entry || entry.startsWith('...')) continue;
      const name = entry.split('=')[0].trim().split(':')[0].trim();
      if (/^[A-Za-z_$][\w$]*$/.test(name)) names.add(name);
    }
  }
  return names;
}

async function checkPublicPropsUnchanged(workspace, dir, publicApiProps) {
  const absoluteDir = path.join(workspace, ...dir.split('/'));
  const entries = await fs.readdir(absoluteDir, { withFileTypes: true });
  const jsxFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.jsx') && !entry.name.endsWith('.stories.jsx'))
    .map((entry) => entry.name);

  if (jsxFiles.length === 0) return { ok: true, reason: null };

  const found = new Set();
  for (const file of jsxFiles) {
    const source = await fs.readFile(path.join(absoluteDir, file), 'utf8');
    for (const name of extractDestructuredPropNames(source)) found.add(name);
  }

  const documented = new Set(publicApiProps.map((prop) => prop.name));
  const missing = [...documented].filter((name) => !found.has(name));
  // Only a documented prop disappearing is treated as a conflict — a brand-new
  // undocumented name showing up is common (local destructured non-props, or a
  // prop not yet added to the contract) and too noisy to flag reliably here.
  if (missing.length > 0) {
    return { ok: false, reason: 'documented prop(s) no longer found in the component signature: ' + missing.join(', ') };
  }
  return { ok: true, reason: null };
}

// ---- heuristic 2: literal values quoted in decisionBasis still exist somewhere ----

function extractLiteralCandidates(decisionBasis) {
  const candidates = new Set();
  const backtickPattern = /`([^`]+)`/g;
  for (const entry of decisionBasis) {
    let match;
    while ((match = backtickPattern.exec(entry))) {
      const span = match[1];
      const looksLikeCssValue =
        /^--[a-z0-9-]+$/.test(span) || // a token name
        /^-?\d+(\.\d+)?(px|%|rem|em|deg)$/.test(span) || // a bare dimension
        /^[a-z-]+:\s*.+$/i.test(span); // a `property: value` declaration
      if (looksLikeCssValue) candidates.add(span);
    }
  }
  return [...candidates];
}

async function checkDocumentedLiteralsStillPresent(workspace, currentFilePaths, decisionBasis) {
  const candidates = extractLiteralCandidates(decisionBasis);
  if (candidates.length === 0) return { ok: true, reason: null };

  let combined = '';
  for (const relativePath of currentFilePaths) {
    combined += await fs.readFile(path.join(workspace, ...relativePath.split('/')), 'utf8');
    combined += '\n';
  }

  const missing = candidates.filter((literal) => !combined.includes(literal));
  if (missing.length > 0) {
    return {
      ok: false,
      reason: 'decisionBasis references value(s) no longer found in any current file: ' + missing.map((v) => '`' + v + '`').join(', '),
    };
  }
  return { ok: true, reason: null };
}

// ---- targeted text surgery on the raw yaml (never a full parse+stringify rewrite,
// to avoid reformatting untouched lines / rewrapping long decisionBasis strings) ----

function renderLocalFilesBlock(localFiles, date) {
  const lines = ['  localFiles:'];
  for (const entry of localFiles) {
    lines.push('    - path: ' + entry.path);
    lines.push('      sha256: ' + entry.sha256);
  }
  lines.push('  localFilesUpdated: ' + date);
  return lines.join('\n') + '\n';
}

function insertLocalFilesBlock(rawText, block) {
  const marker = '\npublicApi:';
  const index = rawText.indexOf(marker);
  if (index === -1) throw new Error("could not find 'publicApi:' following 'implementation:' — aborting to avoid guessing");
  return rawText.slice(0, index + 1) + block + rawText.slice(index + 1);
}

function updateLocalFileHash(rawText, relativePath, newSha256) {
  const escapedPath = relativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp('(-\\s*path:\\s*' + escapedPath + '\\s*\\n\\s*sha256:\\s*)[a-f0-9]{64}');
  if (!pattern.test(rawText)) return null;
  return rawText.replace(pattern, '$1' + newSha256);
}

function updateLocalFilesUpdatedDate(rawText, date) {
  return rawText.replace(/localFilesUpdated:\s*\d{4}-\d{2}-\d{2}/, 'localFilesUpdated: ' + date);
}

function appendLocalFileEntry(rawText, entry) {
  const marker = 'localFilesUpdated:';
  const index = rawText.indexOf(marker);
  if (index === -1) throw new Error("could not find 'localFilesUpdated:' to append a new tracked file before — aborting");
  const insertion = '    - path: ' + entry.path + '\n      sha256: ' + entry.sha256 + '\n  ';
  return rawText.slice(0, index) + insertion + rawText.slice(index);
}

function appendDecisionBasisEntry(rawText, entryText) {
  const escaped = entryText.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const trimmed = rawText.replace(/\s+$/, '');
  return trimmed + '\n  - "' + escaped + '"\n';
}

function setCanonicalReviewDesigner(rawText, value) {
  const pattern = /(canonicalReview:[\s\S]*?designer:\s*)(pending|approved)/;
  if (!pattern.test(rawText)) return null;
  return rawText.replace(pattern, '$1' + value);
}

// ---- main sync pass ----

export async function syncComponentSpecs({ workspace = fromRoot(), write = true } = {}) {
  const files = await listComponentContractFiles(workspace);
  const report = { baselined: [], synced: [], needsReview: [], unchanged: [], errors: [] };

  for (const file of files) {
    const relativeYamlPath = toPosix(path.relative(workspace, file));
    let rawText = await fs.readFile(file, 'utf8');
    let contract;
    try {
      contract = parseYaml(rawText);
    } catch (error) {
      report.errors.push(relativeYamlPath + ': invalid YAML: ' + error.message);
      continue;
    }

    const dir = path.posix.dirname(contract.implementation.importPath);
    if (!(await pathExists(path.join(workspace, ...dir.split('/'))))) {
      report.errors.push(relativeYamlPath + ': implementation dir missing: ' + dir);
      continue;
    }

    const currentPaths = await listComponentDirFiles(workspace, dir);
    const currentFiles = await hashCurrentFiles(workspace, currentPaths);
    const existing = contract.implementation.localFiles;

    if (!existing || existing.length === 0) {
      if (write) {
        const block = renderLocalFilesBlock(currentFiles, todayIso());
        rawText = insertLocalFilesBlock(rawText, block);
        await fs.writeFile(file, rawText, 'utf8');
      }
      report.baselined.push({ id: contract.id, files: currentFiles.map((f) => f.path) });
      continue;
    }

    const existingByPath = new Map(existing.map((entry) => [entry.path, entry.sha256]));
    const currentByPath = new Map(currentFiles.map((entry) => [entry.path, entry.sha256]));

    const changed = currentFiles.filter((entry) => existingByPath.has(entry.path) && existingByPath.get(entry.path) !== entry.sha256);
    const added = currentFiles.filter((entry) => !existingByPath.has(entry.path));
    const removed = [...existingByPath.keys()].filter((p) => !currentByPath.has(p));

    if (changed.length === 0 && added.length === 0 && removed.length === 0) {
      report.unchanged.push(contract.id);
      continue;
    }

    if (removed.length > 0) {
      report.needsReview.push({ id: contract.id, reason: 'file(s) removed from ' + dir + ': ' + removed.join(', ') });
      continue;
    }

    if (added.length > 0) {
      report.needsReview.push({ id: contract.id, reason: 'new file(s) added to ' + dir + ': ' + added.map((f) => f.path).join(', ') });
      continue;
    }

    const propCheck = await checkPublicPropsUnchanged(workspace, dir, contract.publicApi.props);
    if (!propCheck.ok) {
      report.needsReview.push({ id: contract.id, reason: propCheck.reason });
      continue;
    }

    const literalCheck = await checkDocumentedLiteralsStillPresent(workspace, currentPaths, contract.decisionBasis);
    if (!literalCheck.ok) {
      report.needsReview.push({ id: contract.id, reason: literalCheck.reason });
      continue;
    }

    // Clean change: hash(es) moved, nothing documented conflicts with it. Sync.
    if (write) {
      const date = todayIso();
      for (const entry of changed) {
        const next = updateLocalFileHash(rawText, entry.path, entry.sha256);
        if (next === null) throw new Error('could not locate localFiles entry for ' + entry.path + ' in ' + relativeYamlPath);
        rawText = next;
      }
      rawText = updateLocalFilesUpdatedDate(rawText, date);
      const summary = changed.map((entry) => '`' + path.posix.basename(entry.path) + '`').join(', ');
      rawText = appendDecisionBasisEntry(
        rawText,
        'Auto-sync (' + date + '): ' + summary + ' hash' + (changed.length > 1 ? 'es' : '') +
          ' updated — no documented public prop or decisionBasis-quoted value appears to have changed, so this synced automatically. Review if this doesn\'t look right.',
      );

      const reparsed = parseYaml(rawText);
      if (!validateSchema(reparsed)) {
        throw new Error(relativeYamlPath + ': auto-sync would produce invalid contract, aborting write: ' + JSON.stringify(validateSchema.errors));
      }
      await fs.writeFile(file, rawText, 'utf8');
    }
    report.synced.push({ id: contract.id, files: changed.map((entry) => entry.path) });
  }

  return report;
}

function printReport(report) {
  const lines = ['[sync-component-specs]'];
  if (report.baselined.length) {
    lines.push('  baselined (no prior record, hashes captured as-is):');
    for (const entry of report.baselined) lines.push('    - ' + entry.id);
  }
  if (report.synced.length) {
    lines.push('  synced:');
    for (const entry of report.synced) lines.push('    - ' + entry.id + ': ' + entry.files.join(', '));
  }
  if (report.unchanged.length) {
    lines.push('  unchanged: ' + report.unchanged.join(', '));
  }
  if (report.needsReview.length) {
    lines.push('  NEEDS REVIEW (left untouched):');
    for (const entry of report.needsReview) lines.push('    - ' + entry.id + ': ' + entry.reason);
  }
  if (report.errors.length) {
    lines.push('  errors:');
    for (const error of report.errors) lines.push('    - ' + error);
  }
  return lines.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const write = !process.argv.includes('--check');
  const report = await syncComponentSpecs({ write });
  process.stdout.write(printReport(report) + '\n');
  if (report.errors.length > 0 || report.needsReview.length > 0) process.exitCode = 1;
}
