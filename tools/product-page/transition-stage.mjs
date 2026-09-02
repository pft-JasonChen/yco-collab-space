import { promises as fs } from 'node:fs';
import { createHash } from 'node:crypto';
import { loadCollabMap, transitionsForTrack } from '../collab-space/policy.mjs';
import { fromRoot, hashPageInputs, normalisePageSlug, pagePaths, pathExists, readJson, readPageSource, sha256File } from './project.mjs';

function flag(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  return value;
}

const page = normalisePageSlug(flag('--page'));
const target = flag('--to');
const actor = flag('--actor');
if (!process.argv.includes('--confirm')) throw new Error('Explicit --confirm is required. This records a human stage approval.');

const map = await loadCollabMap();
const paths = pagePaths(page);
const release = await readJson(paths.releases);
const transition = transitionsForTrack(map, 'product-page').find((item) => item.from === release.currentStage && item.to === target);
if (!transition) throw new Error('No declared product-page transition from ' + release.currentStage + ' to ' + target + '.');
if (!transition.approvals.includes(actor)) throw new Error(actor + ' cannot approve ' + transition.id + '. Required: ' + transition.approvals.join(', '));

const source = await readPageSource(page);
if (!(await pathExists(fromRoot(paths.generation)))) throw new Error('generation.json is missing. Generate and record the page first.');
const generation = await readJson(paths.generation);
const { inputHash } = await hashPageInputs(page, source);
if (generation.inputHash !== inputHash) throw new Error('Generated page is stale. Run /product-page-generate first.');
if (!generation.review || !['pass', 'pass-with-notes'].includes(generation.review.verdict)) throw new Error('Spec-compliance review must pass before any stage transition.');
if (['page-pm-review', 'page-strapi-draft', 'page-published'].includes(target)) {
  const temporary = generation.resources.selected.filter((item) => item.status === 'temporary');
  if (temporary.length > 0) throw new Error(target + ' cannot use PM temporary assets: ' + temporary.map((item) => item.assetRef).join(', '));
}
if (['page-strapi-draft', 'page-published'].includes(target)) {
  const publishRoot = fromRoot(paths.evidence, 'publish');
  const evidence = (await pathExists(publishRoot)) ? (await fs.readdir(publishRoot)).filter((file) => file.endsWith('.json')) : [];
  if (evidence.length === 0) throw new Error(target + ' requires Strapi publish evidence under evidence/publish/. Run /product-page-publish first.');
}
const generationHash = await sha256File(fromRoot(paths.generation));
const facts = { page, inputHash, generationHash, review: generation.review, resources: generation.resources };
const evidenceHash = createHash('sha256').update(JSON.stringify(stable(facts))).digest('hex');

let pending = release.pendingTransition;
if (pending && (pending.id !== transition.id || pending.evidenceHash !== evidenceHash)) {
  throw new Error('A pending approval belongs to another transition or an older revision.');
}
if (!pending) pending = { id: transition.id, from: transition.from, to: transition.to, evidenceHash, inputHash, generationHash, approvals: [] };
const now = new Date().toISOString();
if (!pending.approvals.some((item) => item.actor === actor)) pending.approvals.push({ actor, confirmedAt: now });
const approvedActors = new Set(pending.approvals.map((item) => item.actor));
const complete = transition.approvals.every((required) => approvedActors.has(required));
if (complete) {
  const completed = { ...pending, confirmedAt: now };
  if (transition.parallelOutput) {
    release.downstreamOutputs = release.downstreamOutputs.filter((item) => item.to !== transition.to);
    release.downstreamOutputs.push(completed);
  } else {
    release.currentStage = transition.to;
    release.transitions.push(completed);
  }
  release.pendingTransition = null;
} else release.pendingTransition = pending;
await fs.writeFile(fromRoot(paths.releases), JSON.stringify(release, null, 2) + '\n');
process.stdout.write(
  complete
    ? '[page-stage] CONFIRMED ' + page + ' ' + transition.from + ' -> ' + transition.to + ' evidence=' + evidenceHash.slice(0, 12) + '\n'
    : '[page-stage] PENDING ' + page + ' ' + transition.id + ' needs ' + transition.approvals.filter((item) => !approvedActors.has(item)).join(', ') + '\n',
);
