import { Link } from 'react-router-dom';
import Icon from '../Icon.jsx';
import { formatCurrency } from '../../utils/formatCurrency.js';
import useTranslation from '../../i18n/useTranslation.js';

export default function ReminderBanner({ dueToday, dueTomorrow, overdue }) {
  const { t } = useTranslation();
  const totalDue = dueToday.length + dueTomorrow.length + overdue.length;
  if (!totalDue) return null;
  const shown = [
    ...overdue.map((customer) => ({ customer, status: t('reports.overdue') })),
    ...dueToday.map((customer) => ({ customer, status: t('reports.dueToday') })),
    ...dueTomorrow.map((customer) => ({ customer, status: t('reports.dueTomorrow') })),
  ].slice(0, 2);
  const heading = [
    overdue.length && `${overdue.length} ${t('reports.overdue')}`,
    dueToday.length && `${dueToday.length} ${t('reports.dueToday')}`,
    dueTomorrow.length && `${dueTomorrow.length} ${t('reports.dueTomorrow')}`,
  ].filter(Boolean).join(' · ');

  return (
    <section className="reminder-banner" aria-label={t('reminders.title')}>
      <div className="reminder-banner-icon"><Icon name="bell" size={19} /></div>
      <div className="reminder-banner-copy">
        <strong>{heading}</strong>
        <span>{shown.map(({ customer, status }) => `${customer.name} · ${formatCurrency(customer.balance)} · ${status}`).join('  ·  ')}</span>
      </div>
      <Link to="/customers?filter=due" aria-label={t('reminders.view')}><Icon name="arrow" size={18} /></Link>
    </section>
  );
}
