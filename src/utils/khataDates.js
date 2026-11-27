const indiaDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function indiaTodayISO() {
  return indiaDateFormatter.format(new Date());
}

export function daysRemaining(dueDate, today = indiaTodayISO()) {
  if (!dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || !/^\d{4}-\d{2}-\d{2}$/.test(today)) return null;
  const dueTime = Date.parse(`${dueDate}T00:00:00Z`);
  const todayTime = Date.parse(`${today}T00:00:00Z`);
  if (Number.isNaN(dueTime) || Number.isNaN(todayTime)) return null;
  return Math.round((dueTime - todayTime) / 86400000);
}

export function dueStatusLabel(dueDate, today) {
  const remaining = daysRemaining(dueDate, today);
  if (remaining === null) return 'No due date';
  if (remaining < 0) {
    const overdue = Math.abs(remaining);
    return `Overdue by ${overdue} ${overdue === 1 ? 'day' : 'days'}`;
  }
  if (remaining === 0) return 'Due today';
  return `Days remaining: ${remaining}`;
}

export function formatKhataDate(value, month = 'short', locale = 'en-IN') {
  if (!value) return 'Not set';
  const isoDate = typeof value === 'string' ? value.slice(0, 10) : value.toISOString().slice(0, 10);
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month,
    timeZone: 'UTC',
  }).format(new Date(`${isoDate}T00:00:00Z`));
}
