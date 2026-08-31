import test from 'node:test';
import assert from 'node:assert/strict';
import { collabMapSemanticErrors, expandPathTemplate, isWorkflowPathWritable, loadCollabMap, pathPatternMatches, workflowPolicy } from './policy.mjs';

const map = await loadCollabMap();

test('Collab Space map has valid semantic references', () => {
  assert.deepEqual(collabMapSemanticErrors(map), []);
});

test('workflow policy expands the feature without code changes', () => {
  const policy = workflowPolicy(map, 'prototype-update', { feature: 'image-relight' });
  assert.equal(isWorkflowPathWritable(policy, 'features/image-relight/generated/feature.jsx'), true);
  assert.equal(isWorkflowPathWritable(policy, 'features/image-relight/product/prd.md'), false);
});

test('path policy supports exact, single and recursive patterns', () => {
  assert.equal(pathPatternMatches('collab-space.map.yaml', 'collab-space.map.yaml'), true);
  assert.equal(pathPatternMatches('features/*/generated/**', 'features/demo/generated/feature.jsx'), true);
  assert.equal(pathPatternMatches('features/*/generated/**', 'features/demo/product/prd.md'), false);
});

test('path template keeps an unresolved placeholder explicit', () => {
  assert.equal(expandPathTemplate('features/{feature}/product/**'), 'features/{feature}/product/**');
});

test('semantic validation rejects an unknown transition stage', () => {
  const changed = structuredClone(map);
  changed.transitions[0].to = 'missing-stage';
  assert.ok(collabMapSemanticErrors(changed).includes('Transition intake-to-working references an unknown stage.'));
});
