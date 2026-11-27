import Icon from '../Icon.jsx';
import useTranslation from '../../i18n/useTranslation.js';

export default function EmptyState({ title, message }) {
  const { t } = useTranslation();
  return (
    <div className="empty-state">
      <div className="empty-illustration"><Icon name="users" size={34} /></div>
      <h2>{title || t('customers.empty')}</h2>
      <p>{message || t('customers.emptyMessage')}</p>
    </div>
  );
}
