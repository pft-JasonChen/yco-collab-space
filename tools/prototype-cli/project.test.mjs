import test from 'node:test';
import assert from 'node:assert/strict';
import { normaliseFeatureSlug } from './project.mjs';
import {
  extractTokenDefinitions,
  extractTokenReferences,
  findRawColours,
} from './token-policy.mjs';
import { findNetworkApis } from './network-policy.mjs';

test('normaliseFeatureSlug accepts a stable kebab-case slug', () => {
  assert.equal(normaliseFeatureSlug('photo-enhance'), 'photo-enhance');
});

test('normaliseFeatureSlug rejects paths and uppercase names', () => {
  assert.throws(() => normaliseFeatureSlug('../Feature'));
});

test('token policy extracts definitions and references', () => {
  const source = ':root { --fill-test: var(--fill-strong); }';
  assert.deepEqual([...extractTokenDefinitions(source)], ['--fill-test']);
  assert.deepEqual([...extractTokenReferences(source)], ['--fill-strong']);
});

test('token policy finds raw colours', () => {
  assert.deepEqual(findRawColours('color: #abcdef;'), ['#abcdef']);
  assert.deepEqual(findRawColours('color: var(--text-strong);'), []);
});

test('network policy detects client request APIs', () => {
  assert.deepEqual(findNetworkApis('fetch("/api/example")'), ['fetch']);
  assert.deepEqual(findNetworkApis('const data = localMock;'), []);
});
