import { Link } from 'react-router-dom';
import Icon from '../Icon.jsx';
import { formatCurrency } from '../../utils/formatCurrency.js';
import useTranslation from '../../i18n/useTranslation.js';

function initialsFor(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function timeLabel(value, locale) {
  if (!value) return '';
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(value));
}

export default function RecentTransactions({ items }) {
  const { language, t } = useTranslation();
  const locale = ({ en: 'en-IN', te: 'te-IN', hi: 'hi-IN' })[language];
  if (!items.length) {
    return (
      <section className="panel transactions-panel">
        <div className="section-heading"><div><h2>{t('transactions.recent')}</h2><p>{t('transactions.subtitle')}</p></div></div>
        <p className="empty-history">{t('transactions.firstVoice')}</p>
      </section>
    );
  }

  return (
    <section className="panel transactions-panel">
      <div className="section-heading">
        <div>
          <h2>{t('transactions.recent')}</h2>
          <p>{t('transactions.subtitle')}</p>
        </div>
        <Link className="text-button" to="/reports">{t('transactions.viewReports')} <Icon name="arrow" size={16} /></Link>
      </div>
      <div className="transaction-list">
        {items.map((transaction) => (
          <div className="transaction-row" key={transaction.id}>
            <div className="avatar avatar-mint">{initialsFor(transaction.customerName)}</div>
            <div className="transaction-person">
              <strong>{transaction.customerName}</strong>
              <span>{transaction.voiceInput || t(transaction.type === 'credit' ? 'customer.creditAdded' : 'customer.paymentReceived')}</span>
            </div>
            <span className={`transaction-type ${transaction.type}`}>
              {t(transaction.type === 'credit' ? 'voice.credit' : 'voice.payment')}
            </span>
            <strong className={`transaction-amount ${transaction.type}`}>
              {transaction.type === 'credit' ? '+' : '−'}{formatCurrency(transaction.amount)}
            </strong>
            <time>{timeLabel(transaction.createdAt || transaction.transactionDate, locale)}</time>
          </div>
        ))}
      </div>
    </section>
  );
}
