import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CustomerCard from '../components/CustomerCard/CustomerCard.jsx';
import CustomerFormModal from '../components/CustomerFormModal/CustomerFormModal.jsx';
import EmptyState from '../components/EmptyState/EmptyState.jsx';
import Icon from '../components/Icon.jsx';
import SearchBar from '../components/SearchBar/SearchBar.jsx';
import useApiData from '../hooks/useApiData.js';
import { api, getApiError } from '../services/api.js';
import { daysRemaining, indiaTodayISO } from '../utils/khataDates.js';
import { getSpeechLocale } from '../services/transactionParser.js';
import { findCustomerCandidate, parseCustomerCommand } from '../services/customerVoiceParser.js';
import useTranslation from '../i18n/useTranslation.js';

export default function Customers() {
  const { language, t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [suggestedName, setSuggestedName] = useState('');
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [listening, setListening] = useState(false);
  const [manualCommand, setManualCommand] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const [candidate, setCandidate] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, loading, error, refetch } = useApiData('/customers', { customers: [] });
  const customers = data?.customers || [];
  const recognitionRef = useRef(null);
  const speechAvailable = Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => () => recognitionRef.current?.stop(), []);
  const dueOnly = searchParams.get('filter') === 'due';
  const today = indiaTodayISO();
  const filtered = useMemo(
    () => customers.filter((customer) => {
      const matchesQuery = `${customer.name} ${customer.phone}`.toLowerCase().includes(query.trim().toLowerCase());
      const remaining = daysRemaining(customer.dueDate, today);
      const isDue = customer.balance > 0 && remaining !== null && remaining <= 1;
      return matchesQuery && (!dueOnly || isDue);
    }),
    [customers, query, dueOnly, today],
  );

  const saveCustomer = async (customer) => {
    setSaving(true);
    setSaveError('');
    try {
      if (editingCustomer) await api.patch(`/customers/${editingCustomer.id}`, customer);
      else await api.post('/customers', customer);
      setIsAdding(false);
      setEditingCustomer(null);
      setSuggestedName('');
      await refetch();
    } catch (requestError) {
      setSaveError(getApiError(requestError, language));
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (action, customer) => {
    setCandidate(null);
    setPendingAction(null);
    setVoiceError('');
    if (action.intent === 'find') {
      setQuery('');
      setSearchParams({});
      navigate(`/customers/${customer.id}`);
      return;
    }
    if (action.intent === 'edit') {
      setEditingCustomer(customer);
      setSuggestedName('');
      setIsAdding(true);
      return;
    }
    if (action.intent === 'delete') {
      if (!window.confirm(t('customers.deleteConfirm', { name: customer.name }))) return;
      try {
        await api.delete(`/customers/${customer.id}`);
        await refetch();
      } catch (requestError) {
        setVoiceError(getApiError(requestError, language));
      }
    }
  };

  const handleCustomerCommand = (transcript) => {
    setVoiceError('');
    const action = parseCustomerCommand(transcript);
    if (!action) {
      setVoiceError(t('customers.commandUnclear'));
      return;
    }
    const match = findCustomerCandidate(action.name, customers);
    if (match) {
      setCandidate(match.customer);
      setPendingAction(action);
      return;
    }
    if (action.intent === 'add') {
      setEditingCustomer(null);
      setSuggestedName(action.name);
      setSaveError('');
      setIsAdding(true);
      return;
    }
    setVoiceError(t('customers.noMatch'));
  };

  const startListening = () => {
    setVoiceError('');
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError(t('customers.voiceUnsupported'));
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = getSpeechLocale(language);
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const last = event.results[event.results.length - 1];
      if (last?.isFinal) {
        setListening(false);
        const text = Array.from(event.results).map((result) => result[0].transcript).join('');
        setManualCommand(text);
        handleCustomerCommand(text);
      }
    };
    recognition.onerror = (event) => {
      setListening(false);
      setVoiceError(event.error === 'not-allowed' ? t('errors.micBlocked') : t('errors.couldNotHear'));
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    try {
      recognition.start();
    } catch {
      setListening(false);
      setVoiceError(t('errors.micStart'));
    }
  };

  return (
    <div className="page">
      <section className="page-heading-row">
        <div>
          <p className="eyebrow">{t('customers.eyebrow')}</p>
          <h1>{t('nav.customers')} <span className="count-pill">{loading ? '…' : customers.length}</span></h1>
          <p className="welcome-subtitle">{t('customers.subtitle')}</p>
        </div>
        <button className="button button-primary desktop-add" type="button" onClick={startListening}>
          <Icon name="mic" size={18} /> {t('customers.startVoice')}
        </button>
      </section>
      <section className="panel customers-voice-panel">
        <div>
          <h2>{t('customers.voiceTitle')}</h2>
          <p>{t('customers.voiceHelp')}</p>
        </div>
        <button className={`voice-cta customer-voice-cta${listening ? ' listening' : ''}`} type="button" onClick={startListening} aria-label={listening ? t('customers.stopVoice') : t('customers.startVoice')} aria-pressed={listening}>
          <span className="voice-cta-icon"><Icon name={listening ? 'close' : 'mic'} size={29} /></span>
          <span className="voice-cta-copy"><strong>{listening ? t('customers.listening') : t('customers.startVoice')}</strong><small>{t('customers.voiceHelp')}</small></span>
        </button>
        {voiceError && <p className="form-error" role="alert">{voiceError}</p>}
        {candidate && pendingAction && (
          <div className="customer-match-confirmation" role="group" aria-label={t('voice.confirmMatch')}>
            <p>{t('customers.matchQuestion', { name: candidate.name })}</p>
            <div className="modal-actions">
              <button className="button button-primary" type="button" onClick={() => runAction(pendingAction, candidate)}>{t('customers.matchYes')}</button>
              <button className="button button-outline" type="button" onClick={() => {
                const action = pendingAction;
                const name = action.name;
                setCandidate(null);
                setPendingAction(null);
                if (action.intent === 'add') {
                  setEditingCustomer(null);
                  setSuggestedName(name);
                  setIsAdding(true);
                } else setVoiceError(t('customers.noMatch'));
              }}>{t('customers.matchNo')}</button>
            </div>
          </div>
        )}
        <details className="manual-command-details">
          <summary>{speechAvailable ? t('customers.voiceFallback') : t('customers.voiceUnsupported')}</summary>
          <form className="manual-command" onSubmit={(event) => { event.preventDefault(); handleCustomerCommand(manualCommand); }}>
            <label htmlFor="customer-voice-command">{t('voice.command')}</label>
            <input id="customer-voice-command" value={manualCommand} onInvalid={(event) => event.currentTarget.setCustomValidity(t('customers.commandUnclear'))} onInput={(event) => event.currentTarget.setCustomValidity('')} onChange={(event) => setManualCommand(event.target.value)} placeholder={t('customers.commandPlaceholder')} required />
            <button className="button button-outline" type="submit">{t('customers.runCommand')} <Icon name="arrow" size={16} /></button>
          </form>
        </details>
      </section>
      <div className="customers-toolbar">
        <details className="manual-search-details">
          <summary>{t('customers.searchManual')}</summary>
          <SearchBar value={query} onChange={setQuery} placeholder={t('customers.search')} />
        </details>
        <button className={`filter-button${dueOnly ? ' filter-active' : ''}`} type="button" aria-label={dueOnly ? t('customers.showAll') : t('customers.showDues')} aria-pressed={dueOnly} onClick={() => setSearchParams(dueOnly ? {} : { filter: 'due' })}><Icon name="calendar" size={18} /></button>
        <span className="customer-count">{t('customers.count', { count: filtered.length })}</span>
      </div>
      {error && <div className="inline-notice" role="alert">{error}<button className="text-button" type="button" onClick={refetch}>{t('common.tryAgain')}</button></div>}
      {loading ? (
        <div className="loading-inline" role="status">{t('customers.loading')}</div>
      ) : filtered.length ? (
        <div className="customer-grid">{filtered.map((customer) => <CustomerCard key={customer.id} customer={customer} />)}</div>
      ) : (
        <EmptyState title={query || dueOnly ? t('customers.noResults') : t('customers.empty')} message={query || dueOnly ? t('customers.noResultsMessage') : t('customers.emptyMessage')} />
      )}
      <button className="floating-add" type="button" aria-label={t('customers.startVoice')} onClick={startListening}>
        <Icon name="mic" size={24} /><span>{t('customers.startVoice')}</span>
      </button>
      {isAdding && <CustomerFormModal initialCustomer={editingCustomer} suggestedName={suggestedName} onClose={() => { setIsAdding(false); setEditingCustomer(null); }} onSubmit={saveCustomer} saving={saving} error={saveError} />}
    </div>
  );
}
