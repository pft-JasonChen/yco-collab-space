import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveSurfaceContextFromIntent,
  surfacePackRelativeRoot,
} from './surface-policy.mjs';

test('novel surface resolves without a pack', async () => {
  const result = await resolveSurfaceContextFromIntent({
    strategy: 'novel',
    temporary: true,
    primaryPack: null,
    borrowedPacks: [],
    layoutIntent: {
      zones: ['primary-content'],
      componentRoles: ['primary-action'],
      responsivePriority: ['Preserve the primary action.'],
    },
  });

  assert.deepEqual(result.errors, []);
  assert.equal(result.context.strategy, 'novel');
  assert.equal(result.context.primaryPack, null);
});

test('presence keeps the composition complete but asserts only the at-rest set', async () => {
  const result = await resolveSurfaceContextFromIntent({
    strategy: 'novel',
    temporary: true,
    primaryPack: null,
    borrowedPacks: [],
    layoutIntent: {
      zones: ['primary-content', 'detail-dialog'],
      componentRoles: ['primary-action', 'close-action', 'empty-state'],
      responsivePriority: ['Preserve the primary action.'],
      presence: {
        zones: { 'detail-dialog': 'on-interaction' },
        componentRoles: {
          'close-action': { presence: 'on-interaction', via: 'AC-002' },
          'empty-state': 'conditional',
        },
      },
    },
  });

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.context.requiredZones, ['primary-content', 'detail-dialog']);
  assert.deepEqual(result.context.atRestZones, ['primary-content']);
  assert.deepEqual(result.context.atRestComponentRoles, ['primary-action']);
  assert.equal(result.context.presence.componentRoles['close-action'].via, 'AC-002');
});

test('presence rejects an undeclared id and a deferred entry without a reason', async () => {
  const result = await resolveSurfaceContextFromIntent({
    strategy: 'novel',
    temporary: true,
    primaryPack: null,
    borrowedPacks: [],
    layoutIntent: {
      zones: ['primary-content'],
      componentRoles: ['primary-action'],
      responsivePriority: ['Preserve the primary action.'],
      presence: {
        zones: { 'missing-zone': 'conditional' },
        componentRoles: { 'primary-action': 'deferred' },
      },
    },
  });

  assert.equal(result.context, null);
  assert.match(result.errors.join('\n'), /presence\.zones\.missing-zone is not a declared/);
  assert.match(result.errors.join('\n'), /presence\.componentRoles\.primary-action is deferred and must record a reason/);
});

test('presence can override a role a pinned pack contributes', async () => {
  const result = await resolveSurfaceContextFromIntent({
    strategy: 'reuse',
    temporary: true,
    primaryPack: {
      id: 'marketing/product-page',
      version: '2026-08',
    },
    borrowedPacks: [],
    layoutIntent: {
      zones: [],
      componentRoles: [],
      responsivePriority: [],
      presence: { componentRoles: { 'primary-action': 'on-interaction' } },
    },
  });

  assert.deepEqual(result.errors, []);
  assert.ok(result.context.requiredComponentRoles.includes('primary-action'));
  assert.ok(!result.context.atRestComponentRoles.includes('primary-action'));
});

test('surface pack path is deterministic and versioned', () => {
  assert.equal(
    surfacePackRelativeRoot({
      id: 'marketing/product-page',
      version: '2026-08',
    }),
    'platform/surfaces/marketing/product-page/2026-08',
  );
});

test('planned surface pack cannot be resolved as implemented', async () => {
  const result = await resolveSurfaceContextFromIntent({
    strategy: 'reuse',
    temporary: true,
    primaryPack: {
      id: 'workspace/tool-ai-agent',
      version: '2026-08',
    },
    borrowedPacks: [],
    layoutIntent: {
      zones: [],
      componentRoles: [],
      responsivePriority: [],
    },
  });

  assert.match(result.errors.join('\n'), /planned but not implemented/);
  assert.equal(result.context, null);
});

test('reuse resolves required zones and component roles from an implemented pack', async () => {
  const result = await resolveSurfaceContextFromIntent({
    strategy: 'reuse',
    temporary: true,
    primaryPack: {
      id: 'marketing/product-page',
      version: '2026-08',
    },
    borrowedPacks: [],
    layoutIntent: {
      zones: [],
      componentRoles: [],
      responsivePriority: [],
    },
  });

  assert.deepEqual(result.errors, []);
  assert.ok(result.context.requiredZones.includes('feature-hero'));
  assert.ok(result.context.requiredComponentRoles.includes('primary-action'));
});

test('hybrid resolves declared roles from a borrowed pack', async () => {
  const result = await resolveSurfaceContextFromIntent({
    strategy: 'hybrid',
    temporary: true,
    primaryPack: {
      id: 'marketing/product-page',
      version: '2026-08',
    },
    borrowedPacks: [
      {
        id: 'workspace/tool-image-generator',
        version: '2026-08',
        roles: ['result-gallery'],
      },
    ],
    layoutIntent: {
      zones: ['embedded-demo'],
      componentRoles: [],
      responsivePriority: ['Preserve the embedded result.'],
    },
  });

  assert.deepEqual(result.errors, []);
  assert.equal(result.context.strategy, 'hybrid');
  assert.ok(result.context.requiredZones.includes('embedded-demo'));
  assert.ok(result.context.requiredComponentRoles.includes('result-gallery'));
});

test('hybrid rejects a borrowed role that the pack does not declare', async () => {
  const result = await resolveSurfaceContextFromIntent({
    strategy: 'hybrid',
    temporary: true,
    primaryPack: {
      id: 'marketing/product-page',
      version: '2026-08',
    },
    borrowedPacks: [
      {
        id: 'workspace/tool-image-generator',
        version: '2026-08',
        roles: ['role-that-does-not-exist'],
      },
    ],
    layoutIntent: {
      zones: [],
      componentRoles: [],
      responsivePriority: [],
    },
  });

  assert.match(result.errors.join('\n'), /is not declared by Surface Pack/);
  assert.equal(result.context, null);
});
