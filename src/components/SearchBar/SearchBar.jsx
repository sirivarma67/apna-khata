import Icon from '../Icon.jsx';
import useTranslation from '../../i18n/useTranslation.js';

export default function SearchBar({ value, onChange, placeholder }) {
  const { t } = useTranslation();
  const label = placeholder || t('customers.search');
  return (
    <label className="search-field">
      <Icon name="search" size={20} />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={label}
        aria-label={label}
      />
      {value && <button type="button" onClick={() => onChange('')} aria-label={t('customers.clearSearch')}><Icon name="close" size={17} /></button>}
    </label>
  );
}
