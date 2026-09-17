import test from 'node:test';
import assert from 'node:assert/strict';
import { i18nDictionaryErrors } from './handoff-policy.mjs';

function dictionary(keys) {
  return { schemaVersion: 1, feature: 'example', locale: 'en', keys };
}

test('an unused planned key passes the intake gate and fails the full gate', () => {
  const dict = dictionary({
    'example.title': { value: 'Example', origin: 'new', status: 'planned' },
  });

  assert.deepEqual(i18nDictionaryErrors(dict, new Set(), { intakeOnly: true }), []);
  assert.deepEqual(i18nDictionaryErrors(dict, new Set()), [
    'i18n key is still planned after generation; use it or remove it: example.title',
  ]);
});

test('an unused key without a status fails both gates', () => {
  const dict = dictionary({
    'example.title': { value: 'Example', origin: 'new' },
  });

  assert.deepEqual(i18nDictionaryErrors(dict, new Set(), { intakeOnly: true }), [
    'i18n key is declared but never used: example.title',
  ]);
  assert.deepEqual(i18nDictionaryErrors(dict, new Set()), [
    'i18n key is declared but never used: example.title',
  ]);
});

test('a used key is fine whether or not it is still labelled planned', () => {
  const dict = dictionary({
    'example.title': { value: 'Example', origin: 'new', status: 'planned' },
    'example.body': { value: 'Body', origin: 'rd-existing' },
  });
  const used = new Set(['example.title', 'example.body']);

  assert.deepEqual(i18nDictionaryErrors(dict, used), []);
});

test('only planned is an accepted status value', () => {
  const dict = dictionary({
    'example.title': { value: 'Example', origin: 'new', status: 'done' },
  });

  assert.deepEqual(i18nDictionaryErrors(dict, new Set(['example.title'])), [
    'i18n key status must be "planned" when present: example.title',
  ]);
});
