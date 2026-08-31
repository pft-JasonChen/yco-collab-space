import test from 'node:test';
import assert from 'node:assert/strict';
import { designFinalPolicyErrors, hashEvidence, transitionFor } from './stage-policy.mjs';
import { loadCollabMap } from './policy.mjs';

test('evidence hash is stable across object key order', () => {
  assert.equal(hashEvidence({ b: 2, a: 1 }), hashEvidence({ a: 1, b: 2 }));
});

test('RD and QA are parallel outputs from design-final', async () => {
  const map = await loadCollabMap();
  assert.equal(transitionFor(map, 'design-final', 'rd-handoff').parallelOutput, true);
  assert.equal(transitionFor(map, 'design-final', 'qa-spec').parallelOutput, true);
});

test('design-final blocks PM temporary assets and incomplete design', () => {
  const errors = designFinalPolicyErrors(
    { design: { status: 'temporary', reference: null } },
    { gaps: [{ id: 'DESIGN-1', status: 'accepted-temporary' }] },
    { resources: { selected: [{ source: 'pm-mock', repositoryPath: 'features/demo/product/mock-assets/hero.png' }] }, tokens: { activationStatus: 'experimental' } },
  );
  assert.equal(errors.length, 4);
  assert.match(errors.join('\n'), /PM temporary assets/);
});
