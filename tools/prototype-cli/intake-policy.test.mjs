import test from 'node:test';
import assert from 'node:assert/strict';
import {
  intakeReferencesBrief,
  markdownListItems,
  markdownSectionBody,
  missingMarkdownSections,
  requiredIntakeSections,
  researchBriefErrors,
  researchBriefStatus,
} from './intake-policy.mjs';

const confirmedBrief = `# Example — Research brief

- Feature: example
- Status: confirmed
- Date: 2026-09-16

## Evidence

| Source | Account | Observed first-hand | Inferred |
|---|---|---|---|
| Competitor A | free | files page | paid UI |

## Production audit

### Existing

- gallery-grid covers the result grid.

### Missing

- No RD component for capacity.

## Competitors

- Competitor A puts the meter in the heading.

## UX principles

- P1 Capacity is always visible.

## Recommendations

- Put the capacity meter in the page heading next to the upgrade entry.
  source: Competitor A heading, observed first-hand.
- Never gate folders. source: Competitor B paywall, observed on Pro.

## Confirm with PM

- Average asset size.
`;

test('a confirmed brief with sourced recommendations passes', () => {
  assert.equal(researchBriefStatus(confirmedBrief), 'confirmed');
  assert.deepEqual(researchBriefErrors(confirmedBrief), []);
});

test('a confirmed brief fails when a recommendation has no source', () => {
  const brief = confirmedBrief.replace(
    '- Never gate folders. source: Competitor B paywall, observed on Pro.',
    '- Never gate folders.',
  );

  assert.match(researchBriefErrors(brief).join('\n'), /recommendation has no source: "Never gate folders/);
});

test('a confirmed brief needs the evidence table and both audit subsections', () => {
  const brief = confirmedBrief
    .replace('| Competitor A | free | files page | paid UI |\n', '')
    .replace('| Source | Account | Observed first-hand | Inferred |\n|---|---|---|---|\n', '')
    .replace('### Missing', '### Gaps');
  const errors = researchBriefErrors(brief).join('\n');

  assert.match(errors, /Evidence section must contain the evidence-level table/);
  assert.match(errors, /Production audit must contain a "### Missing" subsection/);
});

test('a draft brief only needs its sections and a status', () => {
  const brief = confirmedBrief
    .replace('- Status: confirmed', '- Status: draft')
    .replace('- Never gate folders. source: Competitor B paywall, observed on Pro.', '- Never gate folders.');

  assert.equal(researchBriefStatus(brief), 'draft');
  assert.deepEqual(researchBriefErrors(brief), []);
  assert.match(
    researchBriefErrors(brief.replace('## Competitors', '## Rivals')).join('\n'),
    /missing sections: Competitors/,
  );
});

test('a brief without a status line is rejected', () => {
  const brief = confirmedBrief.replace('- Status: confirmed\n', '');

  assert.match(researchBriefErrors(brief).join('\n'), /must declare "- Status: draft" or "- Status: confirmed"/);
});

test('intake must cite the brief by path', () => {
  assert.equal(intakeReferencesBrief('- Evidence in `product/research/brief.md`.'), true);
  assert.equal(intakeReferencesBrief('- Evidence in docs/research/x.md.'), false);
});

test('markdown helpers isolate one section and fold list continuations', () => {
  const body = markdownSectionBody(confirmedBrief, 'Recommendations');
  const items = markdownListItems(body);

  assert.equal(items.length, 2);
  assert.match(items[0], /^Put the capacity meter .* source: Competitor A heading, observed first-hand\.$/);
  assert.deepEqual(missingMarkdownSections('## Problem\n', requiredIntakeSections), [
    'Review goal',
    'Target user',
    'Scope',
    'Open product decisions',
    'Decision basis',
  ]);
});
