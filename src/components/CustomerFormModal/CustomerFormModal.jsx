import { useState } from 'react';
import Icon from '../Icon.jsx';
import useTranslation from '../../i18n/useTranslation.js';

export default function CustomerFormModal({ onClose, onSubmit, initialCustomer, suggestedName = '', saving = false, error = '' }) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialCustomer?.name || suggestedName);
  const [phone, setPhone] = useState(initialCustomer?.phone || '');
  const [address, setAddress] = useState(initialCustomer?.address || '');

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ name, phone, address });
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="customer-modal" role="dialog" aria-modal="true" aria-labelledby="add-customer-title">
        <button className="modal-close" type="button" onClick={onClose} aria-label={t('customer.closeForm')}><Icon name="close" size={20} /></button>
        <span className="modal-icon"><Icon name="users" size={22} /></span>
        <h2 id="add-customer-title">{t(initialCustomer ? 'customer.editTitle' : 'customer.addTitle')}</h2>
        <p>{t(initialCustomer ? 'customer.editIntro' : 'customer.addIntro')}</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="customer-name">{t('customer.name')}</label>
          <input id="customer-name" autoFocus autoComplete="name" required maxLength={70} value={name} onInvalid={(event) => event.currentTarget.setCustomValidity(t('errors.nameRequired'))} onInput={(event) => event.currentTarget.setCustomValidity('')} onChange={(event) => setName(event.target.value)} placeholder={t('customer.namePlaceholder')} />
          <label htmlFor="customer-phone">{t('customer.phone')}</label>
          <input id="customer-phone" type="tel" autoComplete="tel" required maxLength={20} value={phone} onInvalid={(event) => event.currentTarget.setCustomValidity(t('errors.phoneInvalid'))} onInput={(event) => event.currentTarget.setCustomValidity('')} onChange={(event) => setPhone(event.target.value)} placeholder={t('customer.phonePlaceholder')} />
          <label htmlFor="customer-address">{t('customer.address')} <small>{t('common.optional')}</small></label>
          <input id="customer-address" autoComplete="street-address" maxLength={200} value={address} onChange={(event) => setAddress(event.target.value)} placeholder={t('customer.addressPlaceholder')} />
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button className="button button-outline" type="button" onClick={onClose} disabled={saving}>{t('common.cancel')}</button>
            <button className="button button-primary" type="submit" disabled={saving}><Icon name={initialCustomer ? 'check' : 'plus'} size={17} /> {saving ? t('customer.saving') : initialCustomer ? t('customer.saveChanges') : t('customer.addButton')}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
