import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fromRoot, normaliseFeatureSlug } from '../prototype-cli/project.mjs';
import { currentEvidence, stageContext, transitionFor, transitionGateErrors } from './stage-policy.mjs';

function flag(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

const feature = normaliseFeatureSlug(flag('--feature'));
const target = flag('--to');
const actor = flag('--actor');
if (!process.argv.includes('--confirm')) throw new Error('Explicit --confirm is required. This records a human stage approval.');

const { map, release } = await stageContext(feature);
const transition = transitionFor(map, release.currentStage, target);
if (!transition) throw new Error('No declared transition from ' + release.currentStage + ' to ' + target + '.');
if (!transition.approvals.includes(actor)) {
  throw new Error(actor + ' cannot approve ' + transition.id + '. Required: ' + transition.approvals.join(', '));
}

const evidence = await currentEvidence(feature);
const gateErrors = await transitionGateErrors(feature, transition, evidence);
if (gateErrors.length > 0) throw new Error(gateErrors.join('\n'));

let pending = release.pendingTransition;
if (pending && (pending.id !== transition.id || pending.evidenceHash !== evidence.evidenceHash)) {
  throw new Error('A pending approval belongs to another transition or an older revision. Clear it by completing/correcting that transition before retrying.');
}
if (!pending) {
  pending = {
    id: transition.id,
    from: transition.from,
    to: transition.to,
    evidenceHash: evidence.evidenceHash,
    inputHash: evidence.inputHash,
    generationHash: evidence.generationHash,
    approvals: [],
  };
}

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
} else {
  release.pendingTransition = pending;
}

await fs.writeFile(fromRoot('features', feature, 'releases.json'), JSON.stringify(release, null, 2) + '\n');
process.stdout.write(
  complete
    ? '[stage] CONFIRMED ' + feature + ' ' + transition.from + ' -> ' + transition.to + '\n'
    : '[stage] PENDING ' + feature + ' ' + transition.id + ' needs ' + transition.approvals.filter((item) => !approvedActors.has(item)).join(', ') + '\n',
);
