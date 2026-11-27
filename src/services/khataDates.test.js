import test from 'node:test';
import assert from 'node:assert/strict';
import { daysRemaining, dueStatusLabel, formatKhataDate } from '../utils/khataDates.js';

test('calculates remaining and overdue days without timezone drift', () => {
  assert.equal(daysRemaining('2026-11-28', '2026-11-27'), 1);
  assert.equal(daysRemaining('2026-11-27', '2026-11-27'), 0);
  assert.equal(daysRemaining('2026-11-26', '2026-11-27'), -1);
});

test('formats due statuses and khata dates for shopkeepers', () => {
  assert.equal(dueStatusLabel('2026-11-28', '2026-11-27'), 'Days remaining: 1');
  assert.equal(dueStatusLabel('2026-11-27', '2026-11-27'), 'Due today');
  assert.equal(dueStatusLabel('2026-11-26', '2026-11-27'), 'Overdue by 1 day');
  assert.equal(formatKhataDate('2026-11-27'), '27 Nov');
});
