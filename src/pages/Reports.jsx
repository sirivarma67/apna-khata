import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import SummaryCards from '../components/SummaryCards/SummaryCards.jsx';
import LoadingScreen from '../components/LoadingScreen.jsx';
import useApiData from '../hooks/useApiData.js';
import { daysRemaining, formatKhataDate } from '../utils/khataDates.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import useTranslation from '../i18n/useTranslation.js';

function dueDescription(date, t) {
  const remaining = daysRemaining(date);
  if (remaining === null) return t('common.notSet');
  if (remaining < 0) return t('customer.overdue', { count: Math.abs(remaining) });
  if (remaining === 0) return t('customer.dueToday');
  return t('customer.daysRemaining', { count: remaining });
}

function DueGroup({ title, customers, emptyText, overdue = false, t, locale }) {
  return (
    <section className="panel due-report-group">
      <div className="section-heading">
        <div><h2>{title}</h2><p>{customers.length === 1 ? t('reports.customerCount') : t('reports.customersCount', { count: customers.length })}</p></div>
        <span className={`due-count${overdue ? ' overdue-count' : ''}`}>{customers.length}</span>
      </div>
      {customers.length ? customers.map((customer) => (
        <Link className="due-report-row" to={`/customers/${customer.id}`} key={customer.id}>
          <span className="due-avatar">{customer.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</span>
          <span className="due-report-name">
            <strong>{customer.name}</strong>
            <small>{customer.phone}</small>
            <small>{t('customer.dueLabel', { date: customer.dueDate ? formatKhataDate(customer.dueDate, 'short', locale) : t('common.notSet') })} · {dueDescription(customer.dueDate, t)}</small>
          </span>
          <strong>{formatCurrency(customer.balance)}</strong>
          <Icon name="arrow" size={16} />
        </Link>
      )) : <p className="empty-report">{emptyText}</p>}
    </section>
  );
}

export default function Reports() {
  const { language, t } = useTranslation();
  const locale = ({ en: 'en-IN', te: 'te-IN', hi: 'hi-IN' })[language];
  const { data, loading, error, refetch } = useApiData('/reports', null);

  if (loading) return <LoadingScreen message={t('reports.loading')} />;
  if (!data) {
    return <div className="page"><div className="inline-notice error-notice" role="alert">{error || t('errors.reportLoad')}<button className="text-button" type="button" onClick={refetch}>{t('common.tryAgain')}</button></div></div>;
  }

  const summaryItems = [
    { label: t('reports.creditToday'), value: formatCurrency(data.daily.credit), icon: 'cart', tone: 'orange', change: t('reports.creditEntries', { count: data.daily.creditTransactions.length }) },
    { label: t('reports.paymentsToday'), value: formatCurrency(data.daily.collection), icon: 'cash', tone: 'blue', change: t('reports.paymentNote') },
    { label: t('summary.outstanding'), value: formatCurrency(data.outstanding.total), icon: 'wallet', tone: 'green', change: t('summary.pendingCount', { count: data.outstanding.pendingCustomers }) },
    { label: t('reports.pending'), value: String(data.outstanding.pendingCustomers), icon: 'users', tone: 'purple', change: t('reports.pendingNote') },
  ];
  const todayTransactions = data.transactions.filter((transaction) => transaction.transactionDate?.slice(0, 10) === data.date);

  return (
    <div className="page reports-page">
      <section className="page-heading-row">
        <div><p className="eyebrow">{t('reports.eyebrow')}</p><h1>{t('reports.title')}</h1><p className="welcome-subtitle">{t('reports.subtitle')}</p></div>
        <span className="date-filter"><Icon name="calendar" size={17} /> {new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${data.date}T00:00:00Z`))}</span>
      </section>
      {error && <div className="inline-notice error-notice" role="alert">{error}</div>}
      <SummaryCards items={summaryItems} />
      <div className="due-report-grid">
        <DueGroup title={t('reports.dueToday')} customers={data.dues.today} emptyText={t('reports.noDueToday')} t={t} locale={locale} />
        <DueGroup title={t('reports.dueTomorrow')} customers={data.dues.tomorrow} emptyText={t('reports.noDueTomorrow')} t={t} locale={locale} />
        <DueGroup title={t('reports.overdue')} customers={data.dues.overdue} emptyText={t('reports.noOverdue')} overdue t={t} locale={locale} />
      </div>
      <section className="panel transactions-panel report-transactions">
        <div className="section-heading"><div><h2>{t('reports.todayEntries')}</h2><p>{t('reports.todayEntriesSub')}</p></div></div>
        {todayTransactions.length
          ? todayTransactions.map((transaction) => (
            <div className="report-transaction-row" key={transaction.id}>
              <span className={`timeline-marker ${transaction.type}`}><Icon name={transaction.type === 'credit' ? 'cart' : 'check'} size={16} /></span>
              <div><strong>{transaction.customerName}</strong><small>{t(transaction.type === 'credit' ? 'customer.creditAdded' : 'customer.paymentReceived')} · {t('customer.khataDate', { date: formatKhataDate(transaction.transactionDate, 'short', locale) })}</small></div>
              <strong className={`timeline-amount ${transaction.type}`}>{transaction.type === 'credit' ? '+' : '−'}{formatCurrency(transaction.amount)}</strong>
            </div>
          ))
          : <p className="empty-report">{t('reports.noEntries')}</p>}
      </section>
      <div className="report-footnote"><Icon name="info" size={16} /> {t('reports.footnote')}</div>
    </div>
  );
}
