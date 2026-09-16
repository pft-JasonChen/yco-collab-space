export const requiredIntakeSections = [
  'Problem',
  'Review goal',
  'Target user',
  'Scope',
  'Open product decisions',
  'Decision basis',
];

export const requiredDecisionSections = ['Decisions', 'Decision basis'];

// `## Decisions` is canonical and is rewritten in place when a decision changes.
// `## Review log` is an append-only record of each PM review pass; the feature
// digest reads only the canonical sections, so the log never has to be re-read by
// the generator.
export const optionalDecisionSections = ['Review log'];

// A research brief is optional. When one exists and is confirmed it becomes an
// input Intake must cite, and its recommendations must each carry a source.
export const requiredResearchSections = [
  'Evidence',
  'Production audit',
  'Competitors',
  'UX principles',
  'Recommendations',
  'Confirm with PM',
];

function normaliseHeading(value) {
  return value.trim().toLocaleLowerCase('en-US');
}

export function markdownSectionHeadings(source) {
  return new Set(
    String(source)
      .split(/\r?\n/)
      .map((line) => line.match(/^##\s+(.+?)\s*$/)?.[1])
      .filter(Boolean)
      .map(normaliseHeading),
  );
}

export function missingMarkdownSections(source, requiredSections) {
  const headings = markdownSectionHeadings(source);

  return requiredSections.filter(
    (section) => !headings.has(normaliseHeading(section)),
  );
}

/** Body of one `## heading` section, without the heading line. */
export function markdownSectionBody(source, heading) {
  const target = normaliseHeading(heading);
  const body = [];
  let capturing = false;

  for (const line of String(source).split(/\r?\n/)) {
    const match = line.match(/^##\s+(.+?)\s*$/);
    if (match) {
      capturing = normaliseHeading(match[1]) === target;
      continue;
    }
    if (capturing) body.push(line);
  }

  return body.join('\n');
}

/** Top-level list items, with indented continuation lines folded in. */
export function markdownListItems(body) {
  const items = [];
  let current = null;

  for (const line of String(body).split(/\r?\n/)) {
    if (/^[-*]\s+/.test(line)) {
      if (current !== null) items.push(current);
      current = line.replace(/^[-*]\s+/, '').trim();
    } else if (current !== null && /^\s+\S/.test(line)) {
      current += ' ' + line.trim();
    } else if (current !== null) {
      items.push(current);
      current = null;
    }
  }

  if (current !== null) items.push(current);
  return items;
}

export function researchBriefStatus(source) {
  const match = String(source).match(/^\s*-\s*Status:\s*(draft|confirmed)\b/im);
  return match ? match[1].toLowerCase() : null;
}

export function researchBriefErrors(source) {
  const errors = [];
  const missing = missingMarkdownSections(source, requiredResearchSections);

  if (missing.length > 0) {
    errors.push('missing sections: ' + missing.join(', '));
  }

  const status = researchBriefStatus(source);

  if (!status) {
    errors.push('must declare "- Status: draft" or "- Status: confirmed" near the top');
  }

  if (status !== 'confirmed') {
    return errors;
  }

  const evidence = markdownSectionBody(source, 'Evidence');
  if (!/^\s*\|.*\|\s*$/m.test(evidence)) {
    errors.push('Evidence section must contain the evidence-level table');
  }

  const audit = markdownSectionBody(source, 'Production audit');
  for (const subsection of ['Existing', 'Missing']) {
    if (!new RegExp('^###\\s+' + subsection + '\\b', 'im').test(audit)) {
      errors.push('Production audit must contain a "### ' + subsection + '" subsection');
    }
  }

  const recommendations = markdownListItems(
    markdownSectionBody(source, 'Recommendations'),
  );
  if (recommendations.length === 0) {
    errors.push('Recommendations must list at least one item');
  }
  for (const item of recommendations) {
    if (!/\bsource:/i.test(item)) {
      errors.push('recommendation has no source: "' + item.slice(0, 60) + '"');
    }
  }

  return errors;
}

export function intakeReferencesBrief(intakeSource) {
  return /research\/brief\.md/.test(String(intakeSource));
}

export function acceptanceCoverageErrors(contract, validation) {
  const acceptanceIds = new Set(
    contract.acceptance.map((criterion) => criterion.id),
  );
  const coveredIds = new Set(validation.checks.map((check) => check.criterion));
  const errors = [];

  for (const check of validation.checks) {
    if (!acceptanceIds.has(check.criterion)) {
      errors.push(
        'Validation check references unknown criterion: ' + check.criterion,
      );
    }
  }

  for (const criterion of contract.acceptance) {
    if (!coveredIds.has(criterion.id)) {
      errors.push(
        'Acceptance criterion has no executable validation check: ' +
          criterion.id,
      );
    }
  }

  return errors;
}

