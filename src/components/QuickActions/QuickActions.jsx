import { Link } from 'react-router-dom';
import Icon from '../Icon.jsx';
import useTranslation from '../../i18n/useTranslation.js';

const actions = [
  { to: '/voice', key: 'quick.speak', icon: 'mic', tone: 'green' },
  { to: '/customers', key: 'quick.addCustomer', icon: 'plus', tone: 'orange' },
  { to: '/customers?filter=due', key: 'quick.dues', icon: 'clock', tone: 'blue' },
];

export default function QuickActions() {
  const { t } = useTranslation();
  return (
    <section className="quick-actions">
      <h2>{t('quick.title')}</h2>
      <div>
        {actions.map((action) => (
          <Link className="quick-action" to={action.to} key={action.key}>
            <span className={`quick-action-icon tone-${action.tone}`}><Icon name={action.icon} size={19} /></span>
            <span>{t(action.key)}</span>
            <Icon name="arrow" size={16} />
          </Link>
        ))}
      </div>
    </section>
  );
}
