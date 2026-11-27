import test from 'node:test';
import assert from 'node:assert/strict';
import { addDaysToISODate, indiaDate, isValidISODate } from '../utils/dates.js';

test('validates real ISO dates and rejects rolled-over dates', () => {
  assert.equal(isValidISODate('2026-11-27'), true);
  assert.equal(isValidISODate('2026-02-30'), false);
  assert.equal(isValidISODate('27-11-2026'), false);
});

test('adds due-date offsets without depending on server timezone', () => {
  assert.equal(addDaysToISODate('2026-11-27', 30), '2026-12-27');
  assert.match(indiaDate(new Date('2026-11-27T12:00:00Z')), /^\d{4}-\d{2}-\d{2}$/);
});
