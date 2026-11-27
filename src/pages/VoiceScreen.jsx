import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import useApiData from '../hooks/useApiData.js';
import { api, getApiError } from '../services/api.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import { getSpeechLocale, parseTransactionCommand } from '../services/transactionParser.js';
import useTranslation from '../i18n/useTranslation.js';

function todayISO() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
}

export default function VoiceScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const customerHint = searchParams.get('customer') || '';
  const { user } = useAuth();
  const { language, t } = useTranslation();
  const { data: customerData, loading: customersLoading, error: customersError, refetch: refetchCustomers } = useApiData('/customers', { customers: [] });
  const customers = customerData?.customers || [];
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState(null);
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('unknown');
  const [transactionDate, setTransactionDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedTransaction, setSavedTransaction] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const recognitionRef = useRef(null);
  const speechAvailable = Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  const reviewCommand = (spokenText) => {
    setTranscript(spokenText);
    setError('');
    setMessage('');
    setSavedTransaction(null);
    const parsed = parseTransactionCommand(spokenText, customers);
    if (parsed.intent === 'reports') {
      navigate('/reports');
      return;
    }
    if (parsed.intent === 'dues') {
      navigate('/customers?filter=due');
      return;
    }
    if (parsed.intent === 'customer' && parsed.customerId) {
      navigate(`/customers/${parsed.customerId}`);
      return;
    }
    const hintedCustomer = customers.find((customer) => customer.id === customerHint);
    setPreview(parsed);
    setCustomerId(parsed.customerId || hintedCustomer?.id || '');
    setAmount(parsed.amount ? String(parsed.amount) : '');
    setType(parsed.type || 'unknown');
    setTransactionDate(parsed.transactionDate || todayISO());
    setDueDate(parsed.dueDate || '');
    setEditing(false);
  };

  const toggleListening = () => {
    setError('');
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessage(t('errors.voiceUnavailable'));
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = getSpeechLocale(language || user?.preferredLanguage);
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const result = Array.from(event.results).map((entry) => entry[0].transcript).join('');
      setTranscript(result);
      if (event.results[event.results.length - 1].isFinal) {
        setListening(false);
        reviewCommand(result);
      }
    };
    recognition.onerror = (event) => {
      setListening(false);
      setError(event.error === 'not-allowed'
        ? t('errors.micBlocked')
        : t('errors.couldNotHear'));
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setTranscript('');
    setListening(true);
    try {
      recognition.start();
    } catch (recognitionError) {
      setListening(false);
      setError(t('errors.micStart'));
    }
  };

  const saveTransaction = async (event) => {
    event.preventDefault();
    setError('');
    if (!customerId) {
      setError(t('errors.chooseCustomer'));
      return;
    }
    if (!Number.isSafeInteger(Number(amount)) || Number(amount) <= 0) {
      setError(t('errors.validAmount'));
      return;
    }
    if (type !== 'credit' && type !== 'payment') {
      setError(t('errors.chooseType'));
      return;
    }
    if (type === 'payment') {
      const customer = customers.find((record) => record.id === customerId);
      if (customer && Number(amount) > customer.balance) {
        setError(t('errors.paymentTooLarge', { name: customer.name, amount: formatCurrency(customer.balance) }));
        return;
      }
    }
    setSaving(true);
    try {
      const { data } = await api.post('/transactions', {
        customerId,
        amount: Number(amount),
        type,
        transactionDate,
        dueDate: type === 'credit' ? dueDate : null,
        voiceInput: transcript,
        detectedLanguage: preview.detectedLanguage,
        confirmed: true,
      });
      setSavedTransaction(data.transaction);
      setPreview(null);
    } catch (requestError) {
      setError(getApiError(requestError, language));
    } finally {
      setSaving(false);
    }
  };

  const selectedCustomer = customers.find((customer) => customer.id === customerId);

  return (
    <div className="page voice-page">
      <Link className="back-link" to="/"><Icon name="back" size={19} /> {t('voice.back')}</Link>
      <section className="voice-screen-card">
        {!preview && !savedTransaction && (
          <>
            <span className="voice-screen-kicker"><Icon name="sparkles" size={15} /> {t('voice.kicker')}</span>
            <h1>{t('voice.title')}</h1>
            <p>{t('voice.intro')}</p>
            <button className={`big-mic${listening ? ' listening' : ''}`} type="button" onClick={toggleListening} aria-label={listening ? t('voice.stop') : t('voice.start')} disabled={customersLoading || Boolean(customersError)}>
              {listening && <span className="mic-ripple ripple-one" />}
              {listening && <span className="mic-ripple ripple-two" />}
              <Icon name={listening ? 'close' : 'mic'} size={42} />
            </button>
            <strong className="listening-label">{customersLoading ? t('voice.loadingCustomers') : listening ? t('voice.listening') : t('voice.tapMic')}</strong>
            <div className={`voice-wave${listening ? ' wave-active' : ''}`} aria-hidden="true">{Array.from({ length: 25 }, (_, index) => <i key={index} />)}</div>
            {transcript && <div className="recognized-text"><span>{t('voice.heard')}</span><p>“{transcript}”</p></div>}
            <p className="voice-tip"><Icon name="info" size={16} /><span>{t('voice.tryExample')}</span></p>
            <details className="manual-command-details" open={!speechAvailable}>
              <summary>{speechAvailable ? t('voice.manualSummary') : t('voice.manualSummaryUnsupported')}</summary>
              <form className="manual-command" onSubmit={(event) => { event.preventDefault(); reviewCommand(manualInput); }}>
                <label htmlFor="manual-voice-command">{t('voice.command')}</label>
                <input id="manual-voice-command" value={manualInput} onInvalid={(event) => event.currentTarget.setCustomValidity(t('errors.couldNotHear'))} onInput={(event) => event.currentTarget.setCustomValidity('')} onChange={(event) => setManualInput(event.target.value)} placeholder={t('voice.commandPlaceholder')} required />
                <button className="button button-outline" type="submit">{t('voice.prepare')} <Icon name="arrow" size={16} /></button>
              </form>
            </details>
            {customersError && <div className="voice-message error-notice" role="alert">{customersError}<button className="text-button" type="button" onClick={refetchCustomers}>Try again</button></div>}
            {message && <div className="voice-message" role="status">{message}</div>}
            {error && <div className="voice-message error-notice" role="alert">{error}</div>}
            <p className="voice-safety">{t('voice.noSaveYet')}</p>
          </>
        )}

        {preview && (
          <form
            className="confirmation-form"
            onSubmit={saveTransaction}
            onInvalid={(event) => {
              const keys = {
                'voice-customer': 'errors.chooseCustomer',
                'voice-amount': 'errors.validAmount',
                'voice-date': 'errors.dateInvalid',
                'voice-due-date': 'errors.dueDateInvalid',
              };
              event.target.setCustomValidity(t(keys[event.target.id] || 'errors.generic'));
            }}
            onInput={(event) => event.target.setCustomValidity('')}
          >
            <span className="voice-screen-kicker"><Icon name="check" size={15} /> {t('voice.reviewKicker')}</span>
            <h1>{t('voice.reviewTitle')}</h1>
            <p>{t('voice.reviewIntro')}</p>
            <div className="confidence-line">
              <Icon name="info" size={16} />
              {preview.needsReview ? t('voice.lowConfidence') : t('voice.confidence', { percent: Math.round(preview.confidence * 100) })}
            </div>
            <div className="confirmation-original"><span>{t('voice.original')}</span><p>“{transcript}”</p></div>
            <div className="confirmation-fields">
              <label htmlFor="voice-customer">{t('voice.customer')}</label>
              <select id="voice-customer" value={customerId} disabled={!editing} required onChange={(event) => setCustomerId(event.target.value)}>
                <option value="">{t('voice.chooseCustomer')}</option>
                {customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name} · {customer.phone}</option>)}
              </select>

              <label htmlFor="voice-amount">{t('voice.amount')}</label>
              <div className="amount-input"><span>₹</span><input id="voice-amount" type="number" inputMode="numeric" min="1" step="1" required disabled={!editing} value={amount} onChange={(event) => setAmount(event.target.value)} placeholder={t('voice.amountPlaceholder')} /></div>

              <span className="field-label">{t('voice.transactionType')}</span>
              <div className="type-choices" role="group" aria-label={t('voice.transactionType')}>
                <button className={type === 'credit' ? 'selected credit-choice' : 'credit-choice'} type="button" disabled={!editing && type !== 'unknown'} aria-pressed={type === 'credit'} onClick={() => setType('credit')}>{t('voice.credit')}</button>
                <button className={type === 'payment' ? 'selected payment-choice' : 'payment-choice'} type="button" disabled={!editing && type !== 'unknown'} aria-pressed={type === 'payment'} onClick={() => setType('payment')}>{t('voice.payment')}</button>
                {type === 'unknown' && <span className="not-sure">{t('voice.notSure')}</span>}
              </div>

              <label htmlFor="voice-date">{t('voice.khataDate')}</label>
              <input id="voice-date" type="date" required disabled={!editing} value={transactionDate} onChange={(event) => setTransactionDate(event.target.value)} />

              {type === 'credit' && (
                <>
                  <label htmlFor="voice-due-date">{t('voice.dueDate')}</label>
                  <input id="voice-due-date" type="date" required disabled={!editing} value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
                </>
              )}
            </div>
            {type === 'payment' && selectedCustomer && <p className="balance-hint">{t('voice.outstanding', { amount: formatCurrency(selectedCustomer.balance) })}</p>}
            {error && <p className="auth-error" role="alert">{error}</p>}
            <div className="confirmation-actions">
              <button className="button button-outline" type="button" onClick={() => { setPreview(null); setError(''); setTranscript(''); }}>{t('voice.cancel')}</button>
              {editing
                ? <button className="button button-outline" type="button" onClick={() => setEditing(false)}>{t('voice.doneEditing')}</button>
                : <button className="button button-outline" type="button" onClick={() => setEditing(true)}>{t('voice.editDetails')}</button>}
              <button className="button button-primary" type="submit" disabled={saving}>{saving ? t('voice.saving') : t('voice.confirmSave')} <Icon name="check" size={17} /></button>
            </div>
          </form>
        )}

        {savedTransaction && (
          <div className="voice-success" role="status">
            <span className="success-check"><Icon name="check" size={35} /></span>
            <span className="voice-screen-kicker">{t('voice.successKicker')}</span>
            <h1>{t('voice.savedTitle')}</h1>
            <p>{t(savedTransaction.type === 'credit' ? 'voice.creditSaved' : 'voice.paymentSaved', { name: savedTransaction.customerName })}</p>
            <strong className="success-amount">{formatCurrency(savedTransaction.amount)}</strong>
            <div className="success-actions">
              <Link className="button button-outline" to={`/customers/${savedTransaction.customerId}`}>{t('voice.viewKhata')} <Icon name="arrow" size={16} /></Link>
              <button className="button button-primary" type="button" onClick={() => { setSavedTransaction(null); setTranscript(''); setMessage(t('voice.ready')); }}>{t('voice.addAnother')}</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
