import test from 'node:test';
import assert from 'node:assert/strict';
import Ajv from 'ajv';
import { readJson } from './project.mjs';

const ajv = new Ajv({ allErrors: true, strict: false });
const surfaceIntentSchema = await readJson(
  'tools/prototype-cli/schemas/surface-intent.schema.json',
);
const validateSurfaceIntent = ajv.compile(surfaceIntentSchema);
const mediaIntentSchema = await readJson(
  'tools/prototype-cli/schemas/media-intent.schema.json',
);
const validateMediaIntent = ajv.compile(mediaIntentSchema);

function baseIntent() {
  return {
    schemaVersion: 1,
    feature: 'example-feature',
    strategy: 'novel',
    temporary: true,
    primaryPack: null,
    borrowedPacks: [],
    layoutIntent: {
      zones: ['primary-content'],
      componentRoles: ['primary-action'],
      responsivePriority: ['Preserve the primary action.'],
    },
    deviations: [],
    decisionBasis: ['No existing pack fits.'],
  };
}

test('surface-intent schema accepts a complete novel strategy', () => {
  assert.equal(validateSurfaceIntent(baseIntent()), true);
});

test('surface-intent schema rejects reuse without a primary pack', () => {
  const intent = baseIntent();
  intent.strategy = 'reuse';

  assert.equal(validateSurfaceIntent(intent), false);
});

test('surface-intent schema rejects hybrid without a borrowed pack', () => {
  const intent = baseIntent();
  intent.strategy = 'hybrid';
  intent.primaryPack = {
    id: 'marketing/product-page',
    version: '2026-08',
  };
  intent.layoutIntent = {
    zones: [],
    componentRoles: [],
    responsivePriority: [],
  };

  assert.equal(validateSurfaceIntent(intent), false);
});

test('media-intent accepts a shared collection reference without per-file manifests', () => {
  assert.equal(
    validateMediaIntent({
      schemaVersion: 1,
      feature: 'example-feature',
      requestedCollections: [
        {
          path: 'assets/video/dance',
          purpose: 'Offer dance examples.',
          selectionGuidance: 'Show different dance styles.',
          requiredForGeneration: false,
        },
      ],
      decisionBasis: ['The collection is reusable across features.'],
    }),
    true,
  );
});

test('media-intent rejects a traversal instead of scanning the repository', () => {
  assert.equal(
    validateMediaIntent({
      schemaVersion: 1,
      feature: 'example-feature',
      requestedCollections: [
        {
          path: 'assets/video/../secret',
          purpose: 'Invalid.',
          selectionGuidance: '',
          requiredForGeneration: false,
        },
      ],
      decisionBasis: ['Negative test.'],
    }),
    false,
  );
});
