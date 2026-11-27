import { useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import useTranslation from '../i18n/useTranslation.js';
import { getApiError } from '../services/api.js';

export default function Login() {
  const { requestOtp, verifyOtp, error: authError, clearError } = useAuth();
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('9876543210');
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [shopName, setShopName] = useState('');
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('apna-khata-language');
    return ['en', 'te', 'hi'].includes(savedLanguage) ? savedLanguage : 'en';
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { t } = useTranslation(language);

  useEffect(() => {
    localStorage.setItem('apna-khata-language', language);
    document.documentElement.lang = language;
    document.title = t('brand.documentTitle');
  }, [language, t]);

  const sendCode = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    clearError();
    try {
      const result = await requestOtp(phone);
      setDemoOtp(result.demoOtp || '');
      setStep('otp');
    } catch (requestError) {
      setError(getApiError(requestError, language));
    } finally {
      setBusy(false);
    }
  };

  const signIn = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await verifyOtp({ phone, otp, ownerName, shopName, preferredLanguage: language });
    } catch (requestError) {
      setError(getApiError(requestError, language));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-aside">
        <a className="brand auth-brand" href="/" aria-label="Apna Khata">
          <span className="brand-mark"><Icon name="wallet" size={22} /></span>
          <span className="brand-copy"><strong>apna khata<span>.</span></strong><small>{t('brand.tagline')}</small></span>
        </a>
        <div className="auth-story">
          <span className="auth-quote-mark">“</span>
          <h1>{t('brand.loginHeadline')}</h1>
          <p>{t('brand.loginStory')}</p>
          <div className="auth-story-badge"><Icon name="mic" size={17} /> {t('brand.badge')}</div>
        </div>
        <div className="auth-illustration" aria-hidden="true"><div className="auth-illustration-ring" /><div className="auth-illustration-mic"><Icon name="mic" size={42} /></div><div className="auth-illustration-note">✓ &nbsp; {t('brand.updated')}</div></div>
        <span className="auth-aside-footer">{t('brand.footer')}</span>
      </section>

      <section className="auth-form-side">
        <div className="auth-form-wrap">
          <p className="eyebrow">{step === 'phone' ? t('login.welcome') : t('login.oneLastStep')}</p>
          <h2>{step === 'phone' ? t('login.startTitle') : t('login.verifyTitle')}</h2>
          <p className="auth-intro">{step === 'phone' ? t('login.intro') : t('login.phoneSent', { phone })}</p>

          {step === 'phone' ? (
            <form className="auth-form" onSubmit={sendCode}>
              <label htmlFor="phone-number">{t('login.phone')}</label>
              <div className="phone-input"><span>+91</span><input id="phone-number" type="tel" inputMode="tel" autoComplete="tel-national" required minLength={10} maxLength={14} value={phone.replace(/^\+91\s?/, '')} onInvalid={(event) => event.currentTarget.setCustomValidity(t('errors.phone'))} onInput={(event) => event.currentTarget.setCustomValidity('')} onChange={(event) => setPhone(event.target.value)} placeholder={t('login.phonePlaceholder')} /></div>
              <label htmlFor="owner-name">{t('login.ownerName')} <small>{t('common.optional')}</small></label>
              <input id="owner-name" type="text" autoComplete="name" maxLength={70} value={ownerName} onChange={(event) => setOwnerName(event.target.value)} placeholder={t('login.ownerPlaceholder')} />
              <label htmlFor="shop-name">{t('login.shopName')} <small>{t('common.optional')}</small></label>
              <input id="shop-name" type="text" maxLength={100} value={shopName} onChange={(event) => setShopName(event.target.value)} placeholder={t('login.shopPlaceholder')} />
              <label htmlFor="language">{t('login.language')}</label>
              <select id="language" value={language} onChange={(event) => { setLanguage(event.target.value); setError(''); clearError(); }}>
                {['en', 'te', 'hi'].map((code) => <option value={code} key={code}>{t(`language.${code}`)}</option>)}
              </select>
              <button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy ? t('login.sending') : t('login.sendCode')} <Icon name="arrow" size={18} /></button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={signIn}>
              <label htmlFor="otp-code">{t('login.otp')}</label>
              <input className="otp-input" id="otp-code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={otp} onInvalid={(event) => event.currentTarget.setCustomValidity(t('errors.enterPhoneCode'))} onInput={(event) => event.currentTarget.setCustomValidity('')} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} placeholder="· · · · · ·" />
              {demoOtp && <p className="demo-code" role="note">{t('login.demoOtp', { code: demoOtp })}</p>}
              <button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy ? t('login.verifying') : t('login.verify')} <Icon name="arrow" size={18} /></button>
              <button className="auth-back" type="button" onClick={() => { setStep('phone'); setOtp(''); setError(''); clearError(); }}>{t('login.changePhone')}</button>
            </form>
          )}
          {(error || authError) && <p className="auth-error" role="alert">{error || getApiError(authError, language)}</p>}
          <p className="auth-privacy"><Icon name="info" size={15} /> {t('login.privacy')}</p>
        </div>
      </section>
    </main>
  );
}
