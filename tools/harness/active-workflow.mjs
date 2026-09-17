import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fromRoot, normaliseFeatureSlug } from '../prototype-cli/project.mjs';

/**
 * The active workflow is the one fact the hooks need: which /prototype-* command is
 * running, for which feature. It lives in the ignored .prototype-state folder, is
 * written by the UserPromptSubmit hook or `npm run workflow:begin`, and expires on
 * its own so a forgotten session cannot lock the repository the next day.
 */
export const workflowCommands = [
  'prototype-research',
  'prototype-intake',
  'prototype-wireframe',
  'prototype-update',
  'prototype-revise',
  'prototype-promote',
];

export const stateRoot = fromRoot('.prototype-state');
export const activeWorkflowPath = path.join(stateRoot, 'active-workflow.json');
const staleAfterMs = 24 * 60 * 60 * 1000;

export function parseWorkflowPrompt(prompt) {
  const match = String(prompt ?? '').match(
    /^\s*\/(prototype-(?:research|intake|wireframe|update|revise|promote))\s+([a-z0-9]+(?:-[a-z0-9]+)*)\b/,
  );
  if (!match) return null;
  return { workflow: match[1], feature: match[2] };
}

export async function readActiveWorkflow({ now = Date.now() } = {}) {
  try {
    const state = JSON.parse(await fs.readFile(activeWorkflowPath, 'utf8'));
    if (!state?.workflow || !state?.feature) return null;
    if (now - Date.parse(state.startedAt) > staleAfterMs) return null;
    return state;
  } catch {
    return null;
  }
}

export async function writeActiveWorkflow({ workflow, feature }) {
  if (!workflowCommands.includes(workflow)) {
    throw new Error('Unknown prototype workflow: ' + workflow);
  }
  const state = {
    schemaVersion: 1,
    workflow,
    feature: normaliseFeatureSlug(feature),
    startedAt: new Date().toISOString(),
  };
  await fs.mkdir(stateRoot, { recursive: true });
  await fs.writeFile(activeWorkflowPath, JSON.stringify(state, null, 2) + '\n');
  return state;
}

export async function clearActiveWorkflow() {
  await fs.rm(activeWorkflowPath, { force: true });
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  const [mode, workflow, feature] = process.argv.slice(2);

  if (mode === 'begin') {
    if (!workflow || !feature) {
      throw new Error('Usage: workflow:begin -- <workflow> <feature>');
    }
    const state = await writeActiveWorkflow({ workflow, feature });
    process.stdout.write('[workflow] BEGIN ' + state.workflow + ' ' + state.feature + '\n');
  } else if (mode === 'end') {
    const state = await readActiveWorkflow();
    await clearActiveWorkflow();
    process.stdout.write(
      '[workflow] END ' + (state ? state.workflow + ' ' + state.feature : '(none active)') + '\n',
    );
  } else if (mode === 'show') {
    const state = await readActiveWorkflow();
    process.stdout.write(
      state
        ? '[workflow] ACTIVE ' + state.workflow + ' ' + state.feature + ' since ' + state.startedAt + '\n'
        : '[workflow] none active\n',
    );
  } else {
    throw new Error('Usage: active-workflow.mjs begin <workflow> <feature> | end | show');
  }
}
