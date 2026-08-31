export const requiredIntakeSections = [
  'Problem',
  'Review goal',
  'Target user',
  'Scope',
  'Open product decisions',
  'Decision basis',
];

export const requiredDecisionSections = ['Decisions', 'Decision basis'];

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

