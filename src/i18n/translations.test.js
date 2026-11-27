import assert from 'node:assert/strict';
import test from 'node:test';
import { localizeApiError, translate, translations } from './translations.js';

test('provides complete, parallel translation resources for the supported languages', () => {
  assert.deepEqual(Object.keys(translations).sort(), ['en', 'hi', 'te']);
  const keys = Object.keys(translations.en).sort();
  for (const language of ['te', 'hi']) {
    assert.deepEqual(Object.keys(translations[language]).sort(), keys);
    assert.ok(Object.values(translations[language]).every((value) => value.length > 0));
  }
});

test('localizes a supported-language validation error and interpolation values', () => {
  assert.equal(translate('te', 'customers.matchQuestion', { name: 'పవన్' }).includes('పవన్'), true);
  assert.equal(localizeApiError({ response: { data: { error: 'Choose a supported language.' } } }, 'hi'), translate('hi', 'errors.languageInvalid'));
});
