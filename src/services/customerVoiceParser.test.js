import assert from 'node:assert/strict';
import test from 'node:test';
import { findCustomerCandidate, parseCustomerCommand } from './customerVoiceParser.js';
import { getSpeechLocale } from './transactionParser.js';

const customers = [
  { id: 'pavan-id', name: 'Pavan' },
  { id: 'ravi-id', name: 'Ravi Kumar' },
];

test('parses add commands and preserves Unicode customer names', () => {
  assert.deepEqual(parseCustomerCommand('add customer పవన్'), { intent: 'add', name: 'పవన్' });
  assert.deepEqual(parseCustomerCommand('ग्राहक जोड़ें रवि'), { intent: 'add', name: 'रवि' });
  assert.deepEqual(parseCustomerCommand('పవన్ ని వెతుకు'), { intent: 'find', name: 'పవన్' });
});

test('returns a local candidate for close and cross-script name matches', () => {
  assert.equal(findCustomerCandidate('Pavan', customers)?.customer.id, 'pavan-id');
  assert.equal(findCustomerCandidate('పవన్', customers)?.customer.id, 'pavan-id');
  assert.equal(findCustomerCandidate('Ravi Kumr', customers)?.customer.id, 'ravi-id');
});

test('does not match unrelated names and only exposes supported speech locales', () => {
  assert.equal(findCustomerCandidate('Lakshmi', customers), null);
  assert.equal(getSpeechLocale('te'), 'te-IN');
  assert.equal(getSpeechLocale('hi'), 'hi-IN');
  assert.equal(getSpeechLocale('unsupported'), 'en-IN');
});
