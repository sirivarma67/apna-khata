import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import useTranslation from '../i18n/useTranslation.js';
import { getApiError } from '../services/api.js';

export default function Settings() {
  const { user, updateProfile, logout } = useAuth();
  const { language, t } = useTranslation();
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [ownerName, setOwnerName] = useState(user?.ownerName || '');
  const [shopName, setShopName] = useState(user?.shopName || '');

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await updateProfile({ ownerName, shopName });
      setEditingProfile(false);
      setNotice('settings.profileUpdated');
    } catch (requestError) {
      setError(getApiError(requestError, language));
    } finally {
      setSaving(false);
    }
  };

  const changeLanguage = async (event) => {
    setSaving(true);
    setError('');
    try {
      await updateProfile({ preferredLanguage: event.target.value });
      setNotice('settings.languageUpdated');
    } catch (requestError) {
      setError(getApiError(requestError, language));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page settings-page">
      <section className="page-heading-row"><div><p className="eyebrow">{t('settings.eyebrow')}</p><h1>{t('settings.title')}</h1><p className="welcome-subtitle">{t('settings.subtitle')}</p></div></section>
      <section className="settings-profile panel">
        <div className="shop-avatar shop-avatar-large">{(user?.shopName || user?.ownerName || 'S').charAt(0).toUpperCase()}</div>
        <div><strong>{user?.shopName || t('settings.yourShop')}</strong><span>{user?.ownerName || t('settings.shopOwner')} · {user?.phone}</span></div>
        <button className="text-button" type="button" onClick={() => setEditingProfile((value) => !value)}>{t('settings.editProfile')} <Icon name="arrow" size={16} /></button>
      </section>
      {editingProfile && (
        <form className="profile-edit-form panel" onSubmit={saveProfile}>
          <label htmlFor="settings-owner">{t('login.ownerName')}</label>
          <input id="settings-owner" maxLength={70} value={ownerName} onChange={(event) => setOwnerName(event.target.value)} />
          <label htmlFor="settings-shop">{t('login.shopName')}</label>
          <input id="settings-shop" maxLength={100} value={shopName} onChange={(event) => setShopName(event.target.value)} />
          <button className="button button-primary" type="submit" disabled={saving}>{saving ? t('common.saving') : t('settings.saveProfile')}</button>
        </form>
      )}
      {notice && <div className="inline-notice" role="status">{t(notice)}<button type="button" onClick={() => setNotice('')} aria-label={t('common.dismiss')}><Icon name="close" size={17} /></button></div>}
      {error && <div className="inline-notice error-notice" role="alert">{error}</div>}
      <div className="settings-groups">
        <section className="settings-group panel">
          <h2>{t('settings.preferences')}</h2>
          <div className="setting-row language-row">
            <span className="setting-icon"><Icon name="globe" size={20} /></span>
            <span className="setting-copy"><strong>{t('settings.voiceLanguage')}</strong><small>{t('settings.voiceLanguageHelp')}</small></span>
            <select aria-label={t('settings.voiceLanguage')} value={user?.preferredLanguage || 'en'} onChange={changeLanguage} disabled={saving}>
              {['en', 'te', 'hi'].map((code) => <option value={code} key={code}>{t(`language.${code}`)}</option>)}
            </select>
          </div>
          <div className="setting-row disabled-setting" aria-disabled="true">
            <span className="setting-icon"><Icon name="moon" size={20} /></span>
            <span className="setting-copy"><strong>{t('settings.appearance')}</strong><small>{t('settings.appearanceHelp')}</small></span>
          </div>
        </section>
        <section className="settings-group panel">
          <h2>{t('settings.yourData')}</h2>
          <button className="setting-row" type="button" onClick={() => setNotice('settings.dataNotice')}>
            <span className="setting-icon"><Icon name="backup" size={20} /></span>
            <span className="setting-copy"><strong>{t('settings.backup')}</strong><small>{t('settings.backupHelp')}</small></span>
            <Icon name="arrow" size={17} className="setting-arrow" />
          </button>
        </section>
        <section className="settings-group panel">
          <h2>{t('settings.helpTitle')}</h2>
          <button className="setting-row" type="button" onClick={() => setNotice('settings.helpNotice')}>
            <span className="setting-icon"><Icon name="help" size={20} /></span>
            <span className="setting-copy"><strong>{t('settings.help')}</strong><small>{t('settings.helpText')}</small></span>
            <Icon name="arrow" size={17} className="setting-arrow" />
          </button>
          <button className="setting-row" type="button" onClick={() => setNotice('settings.aboutNotice')}>
            <span className="setting-icon"><Icon name="info" size={20} /></span>
            <span className="setting-copy"><strong>{t('settings.about')}</strong><small>{t('settings.aboutText')}</small></span>
            <Icon name="arrow" size={17} className="setting-arrow" />
          </button>
        </section>
      </div>
      <button className="logout-button" type="button" onClick={logout}><Icon name="logout" size={19} /> {t('settings.logout')}</button>
      <p className="settings-footer">{t('settings.footer')} <span>♥</span></p>
    </div>
  );
}
