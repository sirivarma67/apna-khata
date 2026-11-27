import useTranslation from '../i18n/useTranslation.js';

export default function LoadingScreen({ message }) {
  const { t } = useTranslation();
  return (
    <main className="loading-screen" role="status">
      <span className="loading-mark">a.</span>
      <span>{message || t('voice.loadingCustomers')}</span>
      <i />
    </main>
  );
}
