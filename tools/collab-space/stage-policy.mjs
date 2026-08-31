import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fromRoot, hashFeatureInputs, pathExists, readJson, readYaml, sha256File } from '../prototype-cli/project.mjs';
import { loadCollabMap } from './policy.mjs';

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

export function hashEvidence(value) {
  return createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
}

export async function readReleaseState(feature) {
  return readJson(path.join('features', feature, 'releases.json'));
}

export function transitionFor(map, from, to) {
  return map.transitions.find((item) => item.from === from && item.to === to) ?? null;
}

export async function currentEvidence(feature) {
  const generationPath = fromRoot('features', feature, 'generated', 'generation.json');
  if (!(await pathExists(generationPath))) throw new Error('generation.json is missing. Generate and record the prototype first.');
  const generation = JSON.parse(await fs.readFile(generationPath, 'utf8'));
  const inputHash = await hashFeatureInputs(feature);
  if (generation.inputHash !== inputHash) throw new Error('Generated prototype is stale. Run prototype-update and prototype:record first.');
  const generationHash = await sha256File(generationPath);
  const facts = {
    feature,
    inputHash,
    generationHash,
    resources: generation.resources,
    surface: generation.surface,
    tokens: generation.tokens,
  };
  return { ...facts, evidenceHash: hashEvidence(facts), generation };
}

export function designFinalPolicyErrors(product, gaps, generation) {
  const errors = [];
  if (product.design?.status !== 'final' || !product.design?.reference) {
    errors.push('design-final requires a final Figma/design reference in prototype.contract.yaml.');
  }
  const blocking = (gaps.gaps ?? []).filter((gap) => gap.status !== 'resolved');
  if (blocking.length > 0) {
    errors.push('design-final has unresolved or temporary design gaps: ' + blocking.map((gap) => gap.id).join(', '));
  }
  const temporary = (generation.resources?.selected ?? []).filter((item) => item.source === 'pm-mock');
  if (temporary.length > 0) {
    errors.push('design-final cannot use PM temporary assets: ' + temporary.map((item) => item.repositoryPath).join(', '));
  }
  if (generation.tokens?.activationStatus !== 'rd-compatible') {
    errors.push('design-final requires an RD-compatible token version.');
  }
  return errors;
}

export async function designFinalErrors(feature, generation) {
  const product = await readYaml(path.join('features', feature, 'product', 'prototype.contract.yaml'));
  const gaps = await readYaml(path.join('features', feature, 'design', 'design-gaps.yaml'));
  return designFinalPolicyErrors(product, gaps, generation);
}

export async function transitionGateErrors(feature, transition, evidence) {
  if (transition.to === 'design-final' || transition.to === 'rd-handoff' || transition.to === 'qa-spec') {
    return designFinalErrors(feature, evidence.generation);
  }
  return [];
}

export async function validateReleaseSemantics(feature, release) {
  const map = await loadCollabMap();
  const errors = [];
  if (release.feature !== feature) errors.push('releases.json feature does not match folder: ' + feature);
  if (!map.stages.some((stage) => stage.id === release.currentStage && stage.kind === 'lifecycle')) {
    errors.push('Unknown lifecycle currentStage: ' + release.currentStage);
  }
  for (const record of [...release.transitions, ...release.downstreamOutputs]) {
    const transition = transitionFor(map, record.from, record.to);
    if (!transition) errors.push('Release record references an undeclared transition: ' + record.from + ' -> ' + record.to);
    const approved = new Set(record.approvals.map((item) => item.actor));
    for (const actor of transition?.approvals ?? []) {
      if (!approved.has(actor)) errors.push('Release record is missing approval from ' + actor + ': ' + record.id);
    }
  }
  return errors;
}

export async function stageContext(feature) {
  const map = await loadCollabMap();
  return { map, release: await readReleaseState(feature) };
}
