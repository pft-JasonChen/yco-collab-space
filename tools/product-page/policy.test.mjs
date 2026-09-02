import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import test from 'node:test';
import { readJson } from '../prototype-cli/project.mjs';
import { fromRoot, headingSlug, markdownHeadingSlugs, sha256Text, yamlPathExists } from './project.mjs';
import { loadRegistry, payloadErrors, resolveFieldPath } from './registry-policy.mjs';
import { layoutErrors, loadPatterns, loadTokenDefinitions, patternSemanticErrors } from './pattern-policy.mjs';
import { contentSemanticErrors, reviewErrors } from './content-policy.mjs';
import { loadCollabMap, collabMapSemanticErrors, expandPathTemplate, stagesForTrack, workflowPolicy, isWorkflowPathWritable } from '../collab-space/policy.mjs';

const page = 'ai-motion-transfer';
const clone = (value) => JSON.parse(JSON.stringify(value));
const fixture = async () => ({
  content: await readJson('product-pages/' + page + '/generated/content.json'),
  layout: await readJson('product-pages/' + page + '/generated/layout.json'),
  payload: await readJson('product-pages/' + page + '/generated/strapi-payload.json'),
  source: (await import('./project.mjs')).readPageSource(page),
});
const registry = await loadRegistry();
const { patterns } = await loadPatterns();
const tokens = await loadTokenDefinitions();
const surfacePack = (await import('../prototype-cli/project.mjs')).readYaml('platform/surfaces/marketing/product-page/2026-08/surface.yaml');

test('helpers: heading slugs and yaml paths', () => {
  assert.equal(headingSlug('How to Use: AI Character Motion Swap'), 'how-to-use-ai-character-motion-swap');
  assert.ok(markdownHeadingSlugs('# A\n\n## Tool flow\n### FAQ').has('tool-flow'));
  assert.ok(yamlPathExists({ ctaLinks: { tryNow: '/x' }, useCases: [{ id: 'a' }] }, 'useCases[0].id'));
  assert.equal(yamlPathExists({ a: 1 }, 'a.b'), false);
});

test('contract: product-page track stages and {page} path expansion', async () => {
  const map = await loadCollabMap();
  assert.deepEqual(collabMapSemanticErrors(map), []);
  assert.ok(stagesForTrack(map, 'product-page').some((stage) => stage.id === 'page-generated'));
  assert.ok(stagesForTrack(map, 'prototype').every((stage) => !stage.id.startsWith('page-')));
  assert.equal(expandPathTemplate('product-pages/{page}/generated/**', { page }), 'product-pages/ai-motion-transfer/generated/**');
  const policy = workflowPolicy(map, 'product-page-generate', { page });
  assert.ok(isWorkflowPathWritable(policy, 'product-pages/ai-motion-transfer/generated/content.json'));
  assert.equal(isWorkflowPathWritable(policy, 'product-pages/ai-motion-transfer/source/brief.md'), false);
  assert.equal(isWorkflowPathWritable(policy, 'strapi/components/shared.cta.json'), false);
});

test('contract: a transition may not cross tracks', async () => {
  const map = clone(await loadCollabMap());
  map.transitions.push({ id: 'bad', from: 'pm-review', to: 'page-brief', approvals: ['pm'] });
  assert.ok(collabMapSemanticErrors(map).some((error) => error.includes('crosses tracks')));
});

test('registry: field paths resolve through nested components', () => {
  const component = registry.components.get('apps-page.section-be-af-image');
  assert.equal(resolveFieldPath(component, registry.components, 'sectionBeAfMedia.imageBeforeDesktop').type, 'media');
  assert.equal(resolveFieldPath(component, registry.components, 'cta[].ctaText').type, 'string');
  assert.equal(resolveFieldPath(component, registry.components, 'nope.field'), null);
});

test('fixture: content, layout and payload pass', async () => {
  const { content, layout, payload, source } = await fixture();
  assert.deepEqual(await contentSemanticErrors(content, page, await source), []);
  assert.deepEqual(layoutErrors(layout, content, patterns, await surfacePack), []);
  assert.deepEqual(payloadErrors(payload, registry).errors, []);
});

test('mutation: a claim without sourceRefs is caught', async () => {
  const { content, source } = await fixture();
  content.sections[1].bullets.push({ title: 'Voice Sync', body: 'Adds voice automatically.', sourceRefs: [] });
  const errors = await contentSemanticErrors(content, page, await source);
  assert.ok(errors.some((error) => error.includes('has no sourceRefs')));
});

test('mutation: a sourceRef to a heading that does not exist is caught', async () => {
  const { content, source } = await fixture();
  content.hero.sourceRefs = ['features/ai-motion-transfer/product/prd.md#four-k-export'];
  const errors = await contentSemanticErrors(content, page, await source);
  assert.ok(errors.some((error) => error.includes('heading not found')));
});

test('mutation: a sourceRef outside the page upstream is caught', async () => {
  const { content, source } = await fixture();
  content.hero.sourceRefs = ['features/collab-space-readiness/product/prd.md#goal'];
  const errors = await contentSemanticErrors(content, page, await source);
  assert.ok(errors.some((error) => error.includes('outside the page upstream')));
});

test('mutation: a required section role missing is caught', async () => {
  const { content, source } = await fixture();
  content.sections = content.sections.filter((section) => section.role !== 'faq');
  const errors = await contentSemanticErrors(content, page, await source);
  assert.ok(errors.some((error) => error.includes('Required section role is missing: faq')));
});

test('mutation: layout option outside the component enum is caught', async () => {
  const { content, layout } = await fixture();
  layout.sections[1].options.textPosition = 'center';
  const errors = layoutErrors(layout, content, patterns, await surfacePack);
  assert.ok(errors.some((error) => error.includes('textPosition') && error.includes('not allowed')));
});

test('mutation: consecutive use cases that do not alternate are caught', async () => {
  const { content, layout } = await fixture();
  layout.sections[5].options.textPosition = 'left';
  const errors = layoutErrors(layout, content, patterns, await surfacePack);
  assert.ok(errors.some((error) => error.includes('must alternate textPosition')));
});

test('mutation: copy longer than the pattern limit is caught', async () => {
  const { content, layout } = await fixture();
  content.hero.title = 'A'.repeat(41);
  const errors = layoutErrors(layout, content, patterns, await surfacePack);
  assert.ok(errors.some((error) => error.includes('hero.title')));
});

test('mutation: a pattern bound to an unregistered component is caught', () => {
  const pattern = clone(patterns.get('faq'));
  pattern.strapiComponent = 'apps-page.section-pricing';
  assert.ok(patternSemanticErrors(pattern, registry, tokens).some((error) => error.includes('not registered')));
});

test('mutation: a pattern using an unknown design token is caught', () => {
  const pattern = clone(patterns.get('faq'));
  pattern.tokens.title.color = '--text-hero-glow';
  assert.ok(patternSemanticErrors(pattern, registry, tokens).some((error) => error.includes('unknown design token')));
});

test('mutation: payload with publishedAt, unknown field or bad enum is caught', async () => {
  const { payload } = await fixture();
  payload.publishedAt = '2026-09-02T00:00:00.000Z';
  payload.sections[1].textPosition = 'middle';
  payload.sections[0].heroSize = 'large';
  const { errors } = payloadErrors(payload, registry);
  assert.ok(errors.some((error) => error.includes('publishedAt is forbidden')));
  assert.ok(errors.some((error) => error.includes('textPosition must be one of')));
  assert.ok(errors.some((error) => error.includes('heroSize is not a registered field')));
});

test('mutation: payload media must be null, id or $assetRef', async () => {
  const { payload } = await fixture();
  payload.topBanner.imageBeAf[0].imageBeforeDesktop = 'https://example.com/hero.jpg';
  const { errors } = payloadErrors(payload, registry);
  assert.ok(errors.some((error) => error.includes('imageBeforeDesktop must be null')));
});

test('review: stale hash, same model and blocker verdict are caught', async () => {
  const contentText = await fs.readFile(fromRoot('product-pages', page, 'generated', 'content.json'), 'utf8');
  const good = {
    contentHash: sha256Text(contentText),
    verdict: 'pass',
    findings: [],
    reviewer: { model: 'reviewer-model' },
    builder: { model: 'builder-model' },
  };
  assert.deepEqual(reviewErrors(good, contentText, { builder: { model: 'builder-model' } }), []);
  assert.ok(reviewErrors({ ...good, contentHash: '0'.repeat(64) }, contentText, null).some((error) => error.includes('stale')));
  assert.ok(reviewErrors({ ...good, reviewer: { model: 'builder-model' } }, contentText, null).some((error) => error.includes('must differ')));
  assert.ok(reviewErrors({ ...good, verdict: 'pass', findings: [{ severity: 'blocker' }] }, contentText, null).some((error) => error.includes('blocker')));
  assert.ok(reviewErrors({ ...good, verdict: 'fail' }, contentText, null).some((error) => error.includes('verdict is fail')));
});
