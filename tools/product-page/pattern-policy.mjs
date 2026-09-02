import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fromRoot, patternsRoot, readJson, readYaml, sha256File, stripHtml, toPosix, tokenLockPath, walkFiles } from './project.mjs';
import { extractTokenDefinitions } from '../prototype-cli/token-policy.mjs';
import { resolveFieldPath } from './registry-policy.mjs';

export async function loadTokenDefinitions() {
  const lock = await readJson(tokenLockPath);
  const definitions = new Set();
  for (const file of lock.files) {
    const source = await fs.readFile(fromRoot(file.path), 'utf8');
    for (const token of extractTokenDefinitions(source)) definitions.add(token);
  }
  return definitions;
}

export async function loadPatterns() {
  const root = fromRoot(patternsRoot);
  const files = await walkFiles(root, (file) => file.endsWith('.yaml'));
  const patterns = new Map();
  const errors = [];
  for (const file of files) {
    const relative = toPosix(path.relative(fromRoot(), file));
    const pattern = await readYaml(relative);
    if (!pattern?.id) {
      errors.push(relative + ' has no id');
      continue;
    }
    if (pattern.id !== path.basename(file, '.yaml')) errors.push(relative + ' id does not match file name');
    if (patterns.has(pattern.id)) errors.push('Duplicate pattern id ' + pattern.id);
    patterns.set(pattern.id, { ...pattern, file: relative });
  }
  return { patterns, errors };
}

export async function patternsHash() {
  const files = await walkFiles(fromRoot(patternsRoot));
  const hash = createHash('sha256');
  for (const file of files) hash.update(toPosix(path.relative(fromRoot(), file)) + '\0' + (await sha256File(file)) + '\0');
  return hash.digest('hex');
}

function collectTokens(value, out = []) {
  if (typeof value === 'string') {
    if (value.startsWith('--')) out.push(value);
  } else if (value && typeof value === 'object') for (const item of Object.values(value)) collectTokens(item, out);
  return out;
}

export function patternTokens(pattern) {
  return [...new Set(collectTokens(pattern.tokens))];
}

export function patternSemanticErrors(pattern, loadedRegistry, tokenDefinitions) {
  const errors = [];
  const prefix = 'pattern ' + pattern.id + ': ';
  const component = loadedRegistry.components.get(pattern.strapiComponent);
  if (!component) {
    errors.push(prefix + 'strapiComponent is not registered: ' + pattern.strapiComponent);
    return errors;
  }
  for (const [option, spec] of Object.entries(pattern.layoutOptions ?? {})) {
    if (!(component.layoutFields ?? []).includes(option)) {
      errors.push(prefix + 'layout option ' + option + ' is not a layoutField of ' + component.uid);
      continue;
    }
    const field = component.fields[option];
    if (field.type === 'enumeration' && Array.isArray(spec.values)) {
      for (const value of spec.values) {
        if (value !== null && !field.values.includes(value)) errors.push(prefix + 'layout option ' + option + ' value ' + value + ' is not allowed by ' + component.uid);
      }
    }
    if (field.type === 'boolean' && Array.isArray(spec.values)) {
      for (const value of spec.values) if (typeof value !== 'boolean') errors.push(prefix + 'layout option ' + option + ' must be boolean');
    }
  }
  for (const fieldPath of Object.keys(pattern.fieldDefaults ?? {})) {
    if (!resolveFieldPath(component, loadedRegistry.components, fieldPath)) errors.push(prefix + 'fieldDefaults path does not exist on ' + component.uid + ': ' + fieldPath);
  }
  for (const fieldPath of Object.keys(pattern.media ?? {})) {
    const field = resolveFieldPath(component, loadedRegistry.components, fieldPath);
    if (!field) errors.push(prefix + 'media path does not exist on ' + component.uid + ': ' + fieldPath);
    else if (field.type !== 'media') errors.push(prefix + 'media path is not a media field: ' + fieldPath);
  }
  for (const token of patternTokens(pattern)) {
    if (!tokenDefinitions.has(token)) errors.push(prefix + 'unknown design token ' + token);
  }
  return errors;
}

function textLength(value) {
  return stripHtml(value).length;
}

function checkMax(errors, where, value, max) {
  if (max === undefined || max === null || value === undefined || value === null) return;
  const length = textLength(value);
  if (length > max) errors.push(where + ' has ' + length + ' characters; pattern allows ' + max);
}

export function layoutErrors(layout, content, patterns, surfacePack) {
  const errors = [];
  const contentSections = new Map((content.sections ?? []).map((section) => [section.id, section]));
  if (layout.page !== content.page) errors.push('layout.json page does not match content.json');
  const hero = patterns.get(layout.hero?.pattern);
  if (!hero) errors.push('layout.hero.pattern is unknown: ' + layout.hero?.pattern);
  else {
    if (hero.contentRole !== 'hero') errors.push('layout.hero.pattern must have contentRole hero');
    errors.push(...optionErrors(hero, layout.hero.options ?? {}, 'layout.hero'));
    checkMax(errors, 'hero.title', content.hero?.title, hero.copy?.title?.maxChars);
    checkMax(errors, 'hero.description', content.hero?.description, hero.copy?.description?.maxChars);
    checkMax(errors, 'hero.primaryCta.text', content.hero?.primaryCta?.text, hero.copy?.primaryCta?.maxChars);
  }
  const seen = new Set();
  const usedZones = new Set(['feature-hero']);
  let previousPattern = null;
  let previousSide = null;
  (layout.sections ?? []).forEach((entry, index) => {
    const where = 'layout.sections[' + index + ']';
    if (seen.has(entry.contentId)) errors.push(where + ' repeats contentId ' + entry.contentId);
    seen.add(entry.contentId);
    const section = contentSections.get(entry.contentId);
    if (!section) {
      errors.push(where + ' references unknown content section ' + entry.contentId);
      return;
    }
    const pattern = patterns.get(entry.pattern);
    if (!pattern) {
      errors.push(where + ' uses unknown pattern ' + entry.pattern);
      return;
    }
    if (pattern.contentRole !== section.role) errors.push(where + ' pattern ' + pattern.id + ' renders role ' + pattern.contentRole + ' but content section role is ' + section.role);
    usedZones.add(pattern.surfaceZone);
    errors.push(...optionErrors(pattern, entry.options ?? {}, where));
    if (pattern.layoutOptions?.textPosition?.default === 'alternate' && previousPattern === pattern.id) {
      const side = entry.options?.textPosition;
      if (side && previousSide && side === previousSide) errors.push(where + ' must alternate textPosition after the previous ' + pattern.id);
    }
    previousPattern = pattern.id;
    previousSide = entry.options?.textPosition ?? null;
    const copy = pattern.copy ?? {};
    checkMax(errors, entry.contentId + '.title', section.title, copy.title?.maxChars);
    checkMax(errors, entry.contentId + '.body', section.body, copy.description?.maxChars);
    if (copy.bullets && Array.isArray(section.bullets)) {
      if (section.bullets.length < copy.bullets.min || section.bullets.length > copy.bullets.max) errors.push(entry.contentId + ' has ' + section.bullets.length + ' bullets; pattern allows ' + copy.bullets.min + '-' + copy.bullets.max);
      section.bullets.forEach((bullet, i) => {
        checkMax(errors, entry.contentId + '.bullets[' + i + '].title', bullet.title, copy.bullets.titleMaxChars);
        checkMax(errors, entry.contentId + '.bullets[' + i + '].body', bullet.body, copy.bullets.bodyMaxChars);
      });
    }
    if (copy.steps && Array.isArray(section.steps)) {
      if (section.steps.length < copy.steps.min || section.steps.length > copy.steps.max) errors.push(entry.contentId + ' has ' + section.steps.length + ' steps; pattern allows ' + copy.steps.min + '-' + copy.steps.max);
      section.steps.forEach((step, i) => {
        checkMax(errors, entry.contentId + '.steps[' + i + '].title', step.title, copy.steps.titleMaxChars);
        checkMax(errors, entry.contentId + '.steps[' + i + '].body', step.body, copy.steps.bodyMaxChars);
      });
    }
    if (copy.faq && Array.isArray(section.items)) {
      if (section.items.length < copy.faq.min || section.items.length > copy.faq.max) errors.push(entry.contentId + ' has ' + section.items.length + ' FAQ items; pattern allows ' + copy.faq.min + '-' + copy.faq.max);
      section.items.forEach((item, i) => {
        checkMax(errors, entry.contentId + '.items[' + i + '].question', item.question, copy.faq.questionMaxChars);
        checkMax(errors, entry.contentId + '.items[' + i + '].answer', item.answer, copy.faq.answerMaxChars);
      });
    }
    if (copy.cta && Array.isArray(section.cta)) {
      if (section.cta.length < copy.cta.min || section.cta.length > copy.cta.max) errors.push(entry.contentId + ' has ' + section.cta.length + ' CTAs; pattern allows ' + copy.cta.min + '-' + copy.cta.max);
      section.cta.forEach((cta, i) => checkMax(errors, entry.contentId + '.cta[' + i + '].text', cta.text, copy.cta.textMaxChars));
    }
    for (const [fieldPath, spec] of Object.entries(pattern.media ?? {})) {
      if (spec.required && !(section.media ?? []).some((media) => media.slot === fieldPath)) errors.push(entry.contentId + ' is missing required media slot ' + fieldPath);
    }
  });
  for (const section of content.sections ?? []) {
    if (!seen.has(section.id)) errors.push('content section has no layout entry: ' + section.id);
  }
  const shellZones = new Set(layout.shellZones ?? []);
  for (const zone of surfacePack?.zones ?? []) {
    if (zone.required && !usedZones.has(zone.id) && !shellZones.has(zone.id)) errors.push('Surface zone is not covered by any pattern or shell: ' + zone.id);
  }
  const declared = new Set(layout.tokensUsed ?? []);
  const expected = new Set();
  for (const id of [layout.hero?.pattern, ...(layout.sections ?? []).map((entry) => entry.pattern)]) {
    const pattern = patterns.get(id);
    if (pattern) for (const token of patternTokens(pattern)) expected.add(token);
  }
  for (const token of expected) if (!declared.has(token)) errors.push('layout.tokensUsed is missing ' + token);
  for (const token of declared) if (!expected.has(token)) errors.push('layout.tokensUsed lists a token no selected pattern uses: ' + token);
  return errors;
}

function optionErrors(pattern, options, where) {
  const errors = [];
  for (const [key, value] of Object.entries(options)) {
    const spec = pattern.layoutOptions?.[key];
    if (!spec) {
      errors.push(where + ' option ' + key + ' is not allowed by pattern ' + pattern.id);
      continue;
    }
    if (Array.isArray(spec.values) && !spec.values.includes(value)) errors.push(where + ' option ' + key + ' value ' + JSON.stringify(value) + ' is not allowed by pattern ' + pattern.id);
    if (spec.pattern && (typeof value !== 'string' || !new RegExp(spec.pattern).test(value))) errors.push(where + ' option ' + key + ' must match ' + spec.pattern);
  }
  return errors;
}
