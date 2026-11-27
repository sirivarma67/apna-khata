import { Link } from 'react-router-dom';
import Icon from '../Icon.jsx';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { daysRemaining, formatKhataDate } from '../../utils/khataDates.js';
import useTranslation from '../../i18n/useTranslation.js';

function initialsFor(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function colorFor(name) {
  const colors = ['mint', 'peach', 'lavender', 'yellow', 'blue', 'rose'];
  return colors[name.split('').reduce((sum, character) => sum + character.charCodeAt(0), 0) % colors.length];
}

function dueLabel(date, t, locale) {
  const remaining = daysRemaining(date);
  if (remaining === null) return t('common.notSet');
  if (remaining === 0) return t('common.today');
  if (remaining === 1) return t('common.tomorrow');
  return formatKhataDate(date, 'short', locale);
}

export default function CustomerCard({ customer }) {
  const { language, t } = useTranslation();
  const locale = ({ en: 'en-IN', te: 'te-IN', hi: 'hi-IN' })[language];
  const color = customer.color || colorFor(customer.name);
  return (
    <article className="customer-card">
      <div className="customer-card-top">
        <div className={`avatar avatar-${color}`}>{initialsFor(customer.name)}</div>
        <div className="customer-card-name">
          <h3>{customer.name}</h3>
          <span>{customer.phone}</span>
        </div>
        <Link className="customer-card-arrow" to={`/customers/${customer.id}`} aria-label={t('customer.viewName', { name: customer.name })}>
          <Icon name="arrow" size={18} />
        </Link>
      </div>
      <div className="customer-balance">
        <span>{t('customer.balance')}</span>
        <strong>{formatCurrency(customer.balance)}</strong>
      </div>
      <div className="customer-card-bottom">
        <span><Icon name="calendar" size={14} /> {t('customer.dueLabel', { date: dueLabel(customer.dueDate, t, locale) })}</span>
        <span>{customer.lastTransactionAt ? t('customer.recentActivity') : t('customer.emptyHistory')}</span>
      </div>
      <Link className="customer-details-link" to={`/customers/${customer.id}`}>
        {t('customer.viewDetails')} <Icon name="arrow" size={15} />
      </Link>
    </article>
  );
}
