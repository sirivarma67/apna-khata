import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import LoadingScreen from '../components/LoadingScreen.jsx';
import useApiData from '../hooks/useApiData.js';
import { api, getApiError } from '../services/api.js';
import { daysRemaining, formatKhataDate, indiaTodayISO } from '../utils/khataDates.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import useTranslation from '../i18n/useTranslation.js';
import { useAuth } from '../context/AuthContext.jsx';

function initialsFor(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function transactionDateLabel(date, t, locale) {
  const isoDate = typeof date === 'string' ? date.slice(0, 10) : new Date(date).toISOString().slice(0, 10);
  const today = indiaTodayISO();
  if (isoDate === today) return t('common.today');
  const yesterday = new Date(`${today}T00:00:00Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  if (isoDate === yesterday.toISOString().slice(0, 10)) return t('common.yesterday');
  return formatKhataDate(isoDate, 'short', locale);
}

function dueDescription(date, t) {
  const remaining = daysRemaining(date);
  if (remaining === null) return t('common.notSet');
  if (remaining < 0) return t('customer.overdue', { count: Math.abs(remaining) });
  if (remaining === 0) return t('customer.dueToday');
  return t('customer.daysRemaining', { count: remaining });
}

export default function CustomerDetails() {
  const { language, t } = useTranslation();
  const { user } = useAuth();
  const locale = ({ en: 'en-IN', te: 'te-IN', hi: 'hi-IN' })[language];
  const { customerId } = useParams();
  const { data, loading, error, refetch } = useApiData(`/customers/${customerId}`, null);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reminder, setReminder] = useState(null);
  const customer = data?.customer;
  const transactions = data?.transactions || [];

  const receivePayment = async (event) => {
    event.preventDefault();
    setSaving(true);
    setActionError('');
    try {
      await api.post('/transactions', {
        customerId,
        type: 'payment',
        amount: Number(paymentAmount),
        transactionDate: indiaTodayISO(),
        confirmed: true,
        detectedLanguage: 'unknown',
      });
      setPaymentAmount('');
      setShowPaymentForm(false);
      setNotice(t('customer.paymentRecorded'));
      await refetch();
    } catch (requestError) {
      setActionError(getApiError(requestError, language));
    } finally {
      setSaving(false);
    }
  };

  const prepareReminder = async () => {
    setActionError('');
    try {
      const { data: result } = await api.get(`/reminders/${customerId}`);
      setReminder({
        ...result.reminder,
        message: t('customer.reminderMessage', {
          name: customer.name,
          shop: user?.shopName || t('settings.yourShop'),
          amount: formatCurrency(customer.balance),
          due: customer.dueDate ? formatKhataDate(customer.dueDate, 'long', locale) : t('common.notSet'),
        }),
      });
    } catch (requestError) {
      setActionError(getApiError(requestError, language));
    }
  };

  if (loading) return <LoadingScreen message={t('customer.loading')} />;
  if (!customer) {
    return (
      <div className="page not-found">
        <div className="inline-notice" role="alert">{error || t('customer.notFound')}</div>
        <Link className="button button-primary" to="/customers">{t('common.backCustomers')}</Link>
      </div>
    );
  }

  const whatsappNumber = customer.phone.replace(/\D/g, '');

  return (
    <div className="page customer-details-page">
      <Link className="back-link" to="/customers"><Icon name="back" size={19} /> {t('customer.allCustomers')}</Link>
      {notice && <div className="inline-notice" role="status">{notice}<button type="button" onClick={() => setNotice('')} aria-label={t('common.dismiss')}><Icon name="close" size={17} /></button></div>}
      {actionError && <div className="inline-notice error-notice" role="alert">{actionError}</div>}
      <section className="customer-profile panel">
        <div className="avatar avatar-large avatar-mint">{initialsFor(customer.name)}</div>
        <div className="profile-info">
          <p className="eyebrow">{t('customer.profileKicker')}</p>
          <h1>{customer.name}</h1>
          <span><Icon name="phone" size={15} />{customer.phone}</span>
          {customer.address && <span><Icon name="home" size={15} />{customer.address}</span>}
        </div>
        <div className="profile-balance">
          <span>{t('customer.balance')}</span>
          <strong>{formatCurrency(customer.balance)}</strong>
          <small><Icon name="calendar" size={14} /> {t('customer.dueLabel', { date: customer.dueDate ? formatKhataDate(customer.dueDate, 'short', locale) : t('common.notSet') })} · {dueDescription(customer.dueDate, t)}</small>
        </div>
      </section>
      <div className="customer-totals">
        <span>{t('customer.totalCredit')} <strong>{formatCurrency(customer.totalCredit)}</strong></span>
        <span>{t('customer.totalPaid')} <strong>{formatCurrency(customer.totalPaid)}</strong></span>
      </div>
      <div className="detail-actions">
        <button className="button button-primary" type="button" onClick={() => { setShowPaymentForm((isOpen) => !isOpen); setActionError(''); }} disabled={customer.balance === 0 || saving}><Icon name="cash" size={18} /> {t('customer.receivePayment')}</button>
        <Link className="button button-outline" to={`/voice?customer=${customerId}`}><Icon name="mic" size={18} /> {t('customer.voiceUpdate')}</Link>
        <button className="button button-outline" type="button" onClick={prepareReminder} disabled={customer.balance === 0}><Icon name="message" size={18} /> {t('customer.prepareReminder')}</button>
        <Link className="button button-outline" to="/customers"><Icon name="settings" size={18} /> {t('customers.editByVoice')}</Link>
        <Link className="button button-danger-outline" to="/customers"><Icon name="close" size={18} /> {t('customers.deleteByVoice')}</Link>
      </div>
      {showPaymentForm && (
        <form className="payment-form panel" onSubmit={receivePayment}>
          <label htmlFor="payment-amount">{t('customer.paymentAmount')}</label>
          <div>
            <span>₹</span>
            <input id="payment-amount" type="number" inputMode="numeric" min="1" max={customer.balance} step="1" required value={paymentAmount} onInvalid={(event) => event.currentTarget.setCustomValidity(t('errors.validAmount'))} onInput={(event) => event.currentTarget.setCustomValidity('')} onChange={(event) => setPaymentAmount(event.target.value)} placeholder={t('customer.amountPlaceholder')} />
            <button className="button button-primary" type="submit" disabled={saving}>{saving ? t('common.saving') : t('customer.reviewPayment')}</button>
            <button className="payment-cancel" type="button" onClick={() => setShowPaymentForm(false)}>{t('common.cancel')}</button>
          </div>
        </form>
      )}
      {reminder && (
        <section className="reminder-preview panel">
          <div><Icon name="message" size={18} /><strong>{t('customer.reminderPreview')}</strong></div>
          <p>{reminder.message}</p>
          <small>{t('customer.reminderReview')}</small>
          <a className="button button-outline" href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(reminder.message)}`} target="_blank" rel="noreferrer">{t('customer.openWhatsapp')} <Icon name="arrow" size={16} /></a>
        </section>
      )}
      <section className="panel history-panel">
        <div className="section-heading"><div><h2>{t('customer.history')}</h2><p>{t('customer.historySubtitle')}</p></div></div>
        <div className="timeline">
          {transactions.map((transaction) => (
            <article className="timeline-item" key={transaction.id}>
              <div className={`timeline-marker ${transaction.type}`}><Icon name={transaction.type === 'credit' ? 'cart' : 'check'} size={16} /></div>
              <div className="timeline-copy">
                <strong>{t(transaction.type === 'credit' ? 'customer.creditAdded' : 'customer.paymentReceived')}</strong>
                <span>{transaction.voiceInput || t('customer.addedFromKhata')} · {t('customer.khataDate', { date: transactionDateLabel(transaction.transactionDate, t, locale) })}</span>
                {transaction.dueDate && <small>{t('customer.dueLabel', { date: formatKhataDate(transaction.dueDate, 'short', locale) })}</small>}
              </div>
              <strong className={`timeline-amount ${transaction.type}`}>{transaction.type === 'credit' ? '+' : '−'}{formatCurrency(transaction.amount)}</strong>
            </article>
          ))}
          {!transactions.length && <p className="empty-history">{t('customer.emptyHistory')}</p>}
        </div>
      </section>
    </div>
  );
}
