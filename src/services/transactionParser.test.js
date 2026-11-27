import test from 'node:test';
import assert from 'node:assert/strict';
import { getSpeechLocale, parseTransactionCommand } from './transactionParser.js';

const customers = [{ id: 'ravi-id', name: 'Ravi Kumar' }];
const baseDate = new Date(2026, 10, 27, 12);

test('parses a customer credit and defaults the due date to 30 days', () => {
  const result = parseTransactionCommand('Ravi took groceries worth ₹850 today', customers, baseDate);
  assert.equal(result.customerId, 'ravi-id');
  assert.equal(result.amount, 850);
  assert.equal(result.type, 'credit');
  assert.equal(result.dueDate, '2026-12-27');
  assert.equal(result.needsReview, false);
});

test('parses payment intent and does not invent a due date', () => {
  const result = parseTransactionCommand('Ravi paid 500 yesterday', customers, baseDate);
  assert.equal(result.amount, 500);
  assert.equal(result.type, 'payment');
  assert.equal(result.transactionDate, '2026-11-26');
  assert.equal(result.dueDate, null);
});

test('recognizes Telugu input and leaves ambiguous transaction types for confirmation', () => {
  const result = parseTransactionCommand('రవి 500 ఇచ్చాడు', customers, baseDate);
  assert.equal(result.detectedLanguage, 'te');
  assert.equal(result.type, 'payment');
  assert.equal(result.customerId, 'ravi-id');
  const uncertain = parseTransactionCommand('Ravi 500', customers, baseDate);
  assert.equal(uncertain.type, 'unknown');
  assert.equal(uncertain.needsReview, true);
});

test('recognizes Hindi and mixed-language input and requests review for conflicting intents', () => {
  const hindi = parseTransactionCommand('रवि ने 500 दिया', customers, baseDate);
  assert.equal(hindi.detectedLanguage, 'hi');
  assert.equal(hindi.type, 'payment');
  assert.equal(hindi.customerId, 'ravi-id');
  const teluguPayment = parseTransactionCommand('రవి సరుకులు 500 ఇచ్చాడు', customers, baseDate);
  assert.equal(teluguPayment.type, 'payment');
  const mixed = parseTransactionCommand('Ravi ने 500 दिया', customers, baseDate);
  assert.equal(mixed.detectedLanguage, 'mixed');
  const conflicting = parseTransactionCommand('Ravi paid 500 and took 200', customers, baseDate);
  assert.equal(conflicting.type, 'unknown');
  assert.equal(conflicting.needsReview, true);
});

test('recognizes a spoken due date without mistaking it for the amount', () => {
  const result = parseTransactionCommand('Ravi took groceries, due after 10 days, worth 850', customers, baseDate);
  assert.equal(result.amount, 850);
  assert.equal(result.dueDate, '2026-12-07');
});

test('keeps khata date separate from a spoken due date', () => {
  const transaction = parseTransactionCommand('Ravi took groceries worth 850 on 15 November', customers, baseDate);
  assert.equal(transaction.transactionDate, '2026-11-15');
  const due = parseTransactionCommand('Ravi took groceries worth 850 due 15 December', customers, baseDate);
  assert.equal(due.transactionDate, '2026-11-27');
  assert.equal(due.dueDate, '2026-12-15');
});

test('routes report and dues queries without creating transaction drafts', () => {
  assert.equal(parseTransactionCommand('Show today report', customers, baseDate).intent, 'reports');
  assert.equal(parseTransactionCommand('ఈ రోజు నివేదిక చూపించు', customers, baseDate).intent, 'reports');
  assert.equal(parseTransactionCommand('Who has pending dues?', customers, baseDate).intent, 'dues');
  assert.equal(getSpeechLocale('te'), 'te-IN');
});
