import { NavLink } from 'react-router-dom';
import Icon from '../Icon.jsx';
import useTranslation from '../../i18n/useTranslation.js';

const links = [
  { to: '/', key: 'nav.dashboard', icon: 'home', end: true },
  { to: '/customers', key: 'nav.customers', icon: 'users' },
  { to: '/voice', key: 'nav.voice', icon: 'mic', voice: true },
  { to: '/reports', key: 'nav.reports', icon: 'chart' },
  { to: '/settings', key: 'nav.settings', icon: 'settings' },
];

export default function BottomNavigation() {
  const { t } = useTranslation();
  return (
    <nav className="bottom-nav" aria-label={t('nav.main')}>
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}${link.voice ? ' nav-voice' : ''}`}
        >
          <span className="nav-icon"><Icon name={link.icon} size={20} /></span>
          <span>{t(link.key)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
