import { Link } from 'react-router-dom';
import Icon from '../Icon.jsx';
import useTranslation from '../../i18n/useTranslation.js';

export default function VoiceButton() {
  const { t } = useTranslation();
  return (
    <Link className="voice-cta" to="/voice">
      <span className="voice-cta-icon"><Icon name="mic" size={29} /></span>
      <span className="voice-cta-copy">
        <strong>{t('customers.startVoice')}</strong>
        <small>{t('dashboard.heroBody')}</small>
      </span>
      <span className="voice-cta-arrow"><Icon name="arrow" size={19} /></span>
    </Link>
  );
}
