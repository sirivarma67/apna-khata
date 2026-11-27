import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import QuickActions from '../components/QuickActions/QuickActions.jsx';
import RecentTransactions from '../components/RecentTransactions/RecentTransactions.jsx';
import ReminderBanner from '../components/ReminderBanner/ReminderBanner.jsx';
import SummaryCards from '../components/SummaryCards/SummaryCards.jsx';
import VoiceButton from '../components/VoiceButton/VoiceButton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import useApiData from '../hooks/useApiData.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import useTranslation from '../i18n/useTranslation.js';

export default function Dashboard() {
  const { user } = useAuth();
  const { language, t } = useTranslation();
  const { data, loading, error, refetch } = useApiData('/dashboard', null);
  const hour = new Date().getHours();
  const greeting = t(hour < 12 ? 'dashboard.greeting.morning' : hour < 17 ? 'dashboard.greeting.afternoon' : 'dashboard.greeting.evening');
  const ownerName = user?.ownerName || user?.shopName || t('settings.shopOwner');
  const summary = data?.summary;
  const summaryItems = summary ? [
    { label: t('summary.outstanding'), value: formatCurrency(summary.outstandingAmount), icon: 'wallet', tone: 'green', change: t('summary.pendingCount', { count: summary.pendingCustomers }) },
    { label: t('summary.collectionToday'), value: formatCurrency(summary.collectionToday), icon: 'cash', tone: 'blue', change: t('summary.paymentsReceived') },
    { label: t('summary.creditToday'), value: formatCurrency(summary.creditToday), icon: 'cart', tone: 'orange', change: t('summary.creditAdded') },
    { label: t('summary.totalCustomers'), value: String(summary.totalCustomers), icon: 'users', tone: 'purple', change: t('summary.dueToday', { count: summary.dueToday }) },
  ] : [];
  const date = data?.date
    ? new Intl.DateTimeFormat(({ en: 'en-IN', te: 'te-IN', hi: 'hi-IN' })[language], { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${data.date}T00:00:00Z`))
    : '';

  return (
    <div className="page dashboard-page">
      <section className="welcome-row">
        <div>
          <p className="eyebrow">{date || t('dashboard.shopToday')} <span>☀</span></p>
          <h1>{t('dashboard.welcome', { greeting, name: ownerName })}</h1>
          <p className="welcome-subtitle">{t('dashboard.subtitle')}</p>
        </div>
        <Link to="/customers" className="button button-outline desktop-add">
          <Icon name="plus" size={18} /> {t('dashboard.addCustomer')}
        </Link>
      </section>

      <section className="hero-panel">
        <div className="hero-copy">
          <span className="hero-kicker"><Icon name="sparkles" size={15} /> {t('dashboard.heroKicker')}</span>
          <h2>{t('dashboard.heroTitle')}</h2>
          <p>{t('dashboard.heroBody')}</p>
          <VoiceButton />
          <div className="voice-example"><span>{t('dashboard.trySaying')}</span> “{t('dashboard.voiceExample')}”</div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-halo" />
          <div className="art-card art-card-back"><span>{t('dashboard.collectionArt')}</span><strong>{summary ? formatCurrency(summary.collectionToday) : '₹—'}</strong><i>{t('dashboard.khataTotal')}</i></div>
          <div className="art-mic"><Icon name="mic" size={44} /></div>
          <div className="art-card art-card-front"><span><i /> {t('dashboard.voiceReady')}</span><strong>{t('dashboard.speakNaturally')}</strong><small>{t('dashboard.reviewBeforeSaving')}</small></div>
          <div className="art-sparkle">✦</div>
        </div>
      </section>

      {error && <div className="inline-notice error-notice" role="alert">{error}<button className="text-button" type="button" onClick={refetch}>{t('common.tryAgain')}</button></div>}
      {loading ? <div className="loading-inline" role="status">{t('dashboard.loading')}</div> : data && (
        <>
          <ReminderBanner dueToday={data.dueToday} dueTomorrow={data.dueTomorrow} overdue={data.overdue} />
          <section className="content-section">
            <div className="section-heading">
              <div><h2>{t('dashboard.glance')}</h2><p>{t('dashboard.glanceBody')}</p></div>
              <span className="updated-note"><i /> {t('dashboard.liveKhata')}</span>
            </div>
            <SummaryCards items={summaryItems} />
          </section>
          <div className="dashboard-lower-grid">
            <RecentTransactions items={data.recentTransactions} />
            <QuickActions />
          </div>
        </>
      )}
    </div>
  );
}
