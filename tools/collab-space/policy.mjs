import path from 'node:path';
import { readYaml } from '../prototype-cli/project.mjs';

function duplicates(values) {
  const seen = new Set();
  const repeated = new Set();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated].sort();
}

export async function loadCollabMap() {
  return readYaml('collab-space.map.yaml');
}

export function collabMapSemanticErrors(map) {
  const errors = [];
  const actorIds = map.actors.map((item) => item.id);
  const stageIds = map.stages.map((item) => item.id);
  const artifactIds = map.artifacts.map((item) => item.id);
  const workflowIds = map.workflows.map((item) => item.id);
  const actorSet = new Set(actorIds);
  const stageSet = new Set(stageIds);
  const artifactSet = new Set(artifactIds);

  for (const [label, values] of [
    ['actor', actorIds],
    ['stage', stageIds],
    ['artifact', artifactIds],
    ['workflow', workflowIds],
    ['transition', map.transitions.map((item) => item.id)],
    ['system', map.systems.map((item) => item.id)],
    ['rule', map.rules.map((item) => item.id)],
  ]) {
    for (const id of duplicates(values)) errors.push('Duplicate ' + label + ' ID: ' + id);
  }

  if (!actorSet.has(map.owner.actor)) errors.push('Unknown contract owner actor: ' + map.owner.actor);

  for (const stage of map.stages) {
    for (const actor of [...stage.allowedActors, ...stage.exitApprovals]) {
      if (!actorSet.has(actor)) errors.push('Stage ' + stage.id + ' references unknown actor: ' + actor);
    }
    for (const artifact of stage.requiredArtifacts) {
      if (!artifactSet.has(artifact)) errors.push('Stage ' + stage.id + ' references unknown artifact: ' + artifact);
    }
  }

  const stageTrack = new Map(map.stages.map((stage) => [stage.id, trackOf(stage)]));
  for (const transition of map.transitions) {
    if (!stageSet.has(transition.from) || !stageSet.has(transition.to)) {
      errors.push('Transition ' + transition.id + ' references an unknown stage.');
    } else if (
      stageTrack.get(transition.from) !== trackOf(transition) ||
      stageTrack.get(transition.to) !== trackOf(transition)
    ) {
      errors.push('Transition ' + transition.id + ' crosses tracks; stages and transition must share one track.');
    }
    for (const actor of transition.approvals) {
      if (!actorSet.has(actor)) errors.push('Transition ' + transition.id + ' references unknown actor: ' + actor);
    }
  }

  for (const artifact of map.artifacts) {
    if (!actorSet.has(artifact.owner)) errors.push('Artifact ' + artifact.id + ' references unknown owner: ' + artifact.owner);
  }
  for (const system of map.systems) {
    if (!actorSet.has(system.owner)) errors.push('System ' + system.id + ' references unknown owner: ' + system.owner);
  }
  for (const workflow of map.workflows) {
    for (const actor of workflow.actors) {
      if (!actorSet.has(actor)) errors.push('Workflow ' + workflow.id + ' references unknown actor: ' + actor);
    }
  }
  for (const rule of map.rules) {
    for (const actor of rule.actors) {
      if (!actorSet.has(actor)) errors.push('Rule ' + rule.id + ' references unknown actor: ' + actor);
    }
    for (const stage of rule.stages) {
      if (!stageSet.has(stage)) errors.push('Rule ' + rule.id + ' references unknown stage: ' + stage);
    }
  }

  return errors;
}

export function expandPathTemplate(value, context = {}) {
  return value
    .replaceAll('{feature}', context.feature ?? '{feature}')
    .replaceAll('{page}', context.page ?? '{page}');
}

export const defaultTrack = 'prototype';

export function trackOf(item) {
  return item?.track ?? defaultTrack;
}

export function stagesForTrack(map, track = defaultTrack) {
  return map.stages.filter((stage) => trackOf(stage) === track);
}

export function transitionsForTrack(map, track = defaultTrack) {
  return map.transitions.filter((transition) => trackOf(transition) === track);
}

export function pathPatternMatches(pattern, candidate) {
  const normalPattern = pattern.split(path.sep).join('/').replace(/^\.\//, '');
  const normalCandidate = candidate.split(path.sep).join('/').replace(/^\.\//, '');
  let expression = '';
  for (let index = 0; index < normalPattern.length; index += 1) {
    const character = normalPattern[index];
    if (character === '*' && normalPattern[index + 1] === '*') {
      expression += '.*';
      index += 1;
    } else if (character === '*') {
      expression += '[^/]*';
    } else {
      expression += character.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
    }
  }
  return new RegExp('^' + expression + '$').test(normalCandidate);
}

export function workflowPolicy(map, workflowId, context = {}) {
  const workflow = map.workflows.find((item) => item.id === workflowId);
  if (!workflow) throw new Error('Unknown Collab Space workflow: ' + workflowId);
  const expand = (values) => values.map((value) => expandPathTemplate(value, context));
  return {
    ...workflow,
    readablePaths: expand(workflow.readablePaths),
    writablePaths: expand(workflow.writablePaths),
    protectedPaths: expand(workflow.protectedPaths),
  };
}

export function isWorkflowPathWritable(policy, relativePath) {
  return policy.writablePaths.some((pattern) => pathPatternMatches(pattern, relativePath));
}
