import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { loadCollabMap } from '../collab-space/policy.mjs';
import { parseWorkflowPrompt, workflowCommands } from './active-workflow.mjs';
import { decideWrite, relativeToRoot } from './write-guard.mjs';

const map = await loadCollabMap();
const root = path.resolve('fixture-repository-root');
const inRepo = (...parts) => path.join(root, ...parts);
const outsideRepo = path.resolve('elsewhere', 'note.md');

test('a /prototype-* command names the workflow and feature', () => {
  assert.deepEqual(parseWorkflowPrompt('/prototype-update cloud-storage'), {
    workflow: 'prototype-update',
    feature: 'cloud-storage',
  });
  assert.deepEqual(parseWorkflowPrompt('  /prototype-research image-relight "Image Relight"'), {
    workflow: 'prototype-research',
    feature: 'image-relight',
  });
  assert.equal(parseWorkflowPrompt('/prototype-update'), null);
  assert.equal(parseWorkflowPrompt('please run prototype-update cloud-storage'), null);
  assert.equal(parseWorkflowPrompt('/prototype-promote cloud-storage pm-review').workflow, 'prototype-promote');
});

test('every prototype command the hooks recognise is a map workflow or the promote CLI', () => {
  for (const command of workflowCommands) {
    const inMap = map.workflows.some((workflow) => workflow.id === command);
    assert.ok(inMap || command === 'prototype-promote', command + ' has no map workflow');
  }
});

test('without an active workflow every write is allowed', () => {
  const decision = decideWrite({ map, active: null, root, filePath: inRepo('AGENTS.md') });
  assert.equal(decision.allowed, true);
});

test('intake may write product source but not generated code', () => {
  const active = { workflow: 'prototype-intake', feature: 'demo' };
  assert.equal(
    decideWrite({ map, active, root, filePath: inRepo('features', 'demo', 'product', 'prd.md') }).allowed,
    true,
  );
  const denied = decideWrite({ map, active, root, filePath: inRepo('features', 'demo', 'generated', 'feature.jsx') });
  assert.equal(denied.allowed, false);
  assert.match(denied.reason, /not writable during prototype-intake/);
});

test('update may write generated code but not product source or platform', () => {
  const active = { workflow: 'prototype-update', feature: 'demo' };
  assert.equal(
    decideWrite({ map, active, root, filePath: inRepo('features', 'demo', 'generated', 'index.jsx') }).allowed,
    true,
  );
  assert.equal(
    decideWrite({ map, active, root, filePath: inRepo('features', 'demo', 'product', 'decisions.md') }).allowed,
    false,
  );
  assert.equal(
    decideWrite({ map, active, root, filePath: inRepo('platform', 'ui', 'button', 'Button.jsx') }).allowed,
    false,
  );
});

test('research writes only the brief; revise may write source and generated code', () => {
  const research = { workflow: 'prototype-research', feature: 'demo' };
  assert.equal(
    decideWrite({ map, active: research, root, filePath: inRepo('features', 'demo', 'product', 'research', 'brief.md') }).allowed,
    true,
  );
  assert.equal(
    decideWrite({ map, active: research, root, filePath: inRepo('features', 'demo', 'product', 'prd.md') }).allowed,
    false,
  );

  const revise = { workflow: 'prototype-revise', feature: 'demo' };
  assert.equal(
    decideWrite({ map, active: revise, root, filePath: inRepo('features', 'demo', 'product', 'decisions.md') }).allowed,
    true,
  );
  assert.equal(
    decideWrite({ map, active: revise, root, filePath: inRepo('features', 'demo', 'generated', 'index.jsx') }).allowed,
    true,
  );
  assert.equal(
    decideWrite({ map, active: revise, root, filePath: inRepo('design-library', 'components', 'button', 'component.yaml') }).allowed,
    false,
  );
});

test('a workflow without map paths denies every write and says why', () => {
  const decision = decideWrite({
    map,
    active: { workflow: 'prototype-promote', feature: 'demo' },
    root,
    filePath: inRepo('features', 'demo', 'releases.json'),
  });
  assert.equal(decision.allowed, false);
  assert.match(decision.reason, /no writable paths/);
});

test('files outside the repository are never guarded', () => {
  assert.equal(relativeToRoot(root, outsideRepo), null);
  assert.equal(
    relativeToRoot(root, inRepo('features', 'demo', 'product', 'prd.md')),
    'features/demo/product/prd.md',
  );
  assert.equal(
    decideWrite({ map, active: { workflow: 'prototype-update', feature: 'demo' }, root, filePath: outsideRepo }).allowed,
    true,
  );
});
