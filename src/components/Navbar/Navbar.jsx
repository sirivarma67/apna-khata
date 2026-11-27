import { Link } from 'react-router-dom';
import Icon from '../Icon.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import useTranslation from '../../i18n/useTranslation.js';

export default function Navbar() {
  const { user } = useAuth();
  const { language, t } = useTranslation();
  const date = new Intl.DateTimeFormat(({ en: 'en-IN', te: 'te-IN', hi: 'hi-IN' })[language], {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(new Date());

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link className="brand" to="/" aria-label={t('nav.home')}>
          <span className="brand-mark"><Icon name="wallet" size={22} /></span>
          <span className="brand-copy">
            <strong>apna khata<span>.</span></strong>
            <small>{t('brand.tagline')}</small>
          </span>
        </Link>
        <div className="topbar-right">
          <span className="topbar-date"><Icon name="calendar" size={16} />{date}</span>
          <Link className="icon-button notification-button" to="/customers?filter=due" aria-label={t('nav.dues')}>
            <Icon name="bell" size={20} />
            <span className="notification-dot" />
          </Link>
          <div className="shop-avatar" aria-label={t('settings.profile')}>{(user?.shopName || user?.ownerName || 'S').charAt(0).toUpperCase()}</div>
        </div>
      </div>
    </header>
  );
}
