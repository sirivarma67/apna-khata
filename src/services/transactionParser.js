const languageMarkers = {
  hi: /[\u0900-\u097f]/,
  te: /[\u0c00-\u0c7f]/,
};

const languageLocales = { en: 'en-IN', te: 'te-IN', hi: 'hi-IN' };
const nameAliases = {
  anjali: ['anjali', 'అంజలి', 'अंजलि'],
  kiran: ['kiran', 'కిరణ్', 'किरण'],
  lakshmi: ['lakshmi', 'లక్ష్మి', 'లక్ష్మీ', 'लक्ष्मी'],
  pavan: ['pavan', 'pawan', 'పవన్', 'पवन'],
  priya: ['priya', 'ప్రియా', 'प्रिया'],
  ramesh: ['ramesh', 'రమేష్', 'रमेश'],
  ravi: ['ravi', 'రవి', 'रवि'],
  suresh: ['suresh', 'సురేష్', 'सुरేష్'],
};

function isoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function shiftDate(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return isoDate(result);
}

function normalizeText(text) {
  return text.toLocaleLowerCase().replace(/[’']s\b/g, ' ').replace(/[’']/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function detectLanguage(text) {
  const scripts = Object.entries(languageMarkers).filter(([, marker]) => marker.test(text)).map(([language]) => language);
  const hasLatin = /[a-z]/i.test(text);
  if (scripts.length && (hasLatin || scripts.length > 1)) return 'mixed';
  if (scripts.length) return scripts[0];
  return hasLatin ? 'en' : 'unknown';
}

function matchCustomer(text, customers) {
  const normalized = normalizeText(text);
  const words = new Set(normalized.split(/\s+/));
  return [...customers]
    .sort((left, right) => right.name.length - left.name.length)
    .find((customer) => {
      const name = normalizeText(customer.name);
      if (name && normalized.includes(name)) return true;
      const firstName = name.split(' ')[0];
      const aliases = nameAliases[firstName] || [firstName];
      return aliases.some((alias) => {
        const normalizedAlias = normalizeText(alias);
        return normalizedAlias.length > 1 && (
          normalized.includes(normalizedAlias)
          || words.has(normalizedAlias)
        );
      });
    }) || null;
}

function extractAmount(text) {
  const amountSource = text
    .replace(/\b\d{1,2}\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/gi, '')
    .replace(/\b\d{1,3}\s+days?\b/gi, '')
    .replace(/\b\d{1,3}\s+రోజుల్లో/gi, '');
  const amountMatch = amountSource.match(/(?:₹\s*|rs\.?\s*|rupees?\s*)?(\d[\d,]*(?:\.\d{1,2})?)/i);
  if (!amountMatch) return null;
  const amount = Number(amountMatch[1].replace(/,/g, ''));
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}

function transactionType(text) {
  const payment = /\b(paid|payment|received|gave|sent|transferred|settled|cleared|diya|de diya)\b|दिया|चुकाया|भुगतान|ఇచ్చాడు|ఇచ్చింది|చెల్లించాడు|చెల్లించింది/i;
  const credit = /\b(took|bought|add|added|credit|borrowed|udhaar|liya|le liya)\b|उधार|लिया|खरीदा|తీసుకున్నాడు|తీసుకుంది/i;
  if (payment.test(text) && credit.test(text)) return 'unknown';
  if (payment.test(text)) return 'payment';
  if (credit.test(text)) return 'credit';
  return 'unknown';
}

function monthDate(text, baseDate, rollPastDateForward = true) {
  const match = text.match(/\b(\d{1,2})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i);
  if (!match) return null;
  const month = new Date(`${match[2]} 1, 2020`).getMonth();
  if (month < 0 || Number.isNaN(month)) return null;
  let year = baseDate.getFullYear();
  let date = new Date(year, month, Number(match[1]));
  if (date.getMonth() !== month || date.getDate() !== Number(match[1])) return null;
  if (rollPastDateForward && date < new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate())) {
    year += 1;
    date = new Date(year, month, Number(match[1]));
  }
  return isoDate(date);
}

function parseDueDate(text, transactionDate, now) {
  const normalized = normalizeText(text);
  const offsetMatch = normalized.match(/(?:in|after|due after)\s+(\d{1,3})\s+days?|(\d{1,3})\s+రోజుల్లో/);
  if (offsetMatch) {
    const days = Number(offsetMatch[1] || offsetMatch[2]);
    if (days <= 365) return shiftDate(new Date(`${transactionDate}T12:00:00`), days);
  }
  if (/\b(tomorrow|due tomorrow)\b|రేపు|कल तक/i.test(text)) return shiftDate(new Date(`${transactionDate}T12:00:00`), 1);
  const explicitDate = text.match(/\b(?:due(?:\s+date)?|payment\s+due|pay(?:ment)?\s+by|by)\s+(?:on\s+)?(\d{1,2}\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?))\b/i);
  if (explicitDate) return monthDate(explicitDate[1], now);
  const weekdayMatch = normalized.match(/\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
  if (weekdayMatch) {
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const target = weekdays.indexOf(weekdayMatch[1]);
    const current = new Date(`${transactionDate}T12:00:00`).getDay();
    return shiftDate(new Date(`${transactionDate}T12:00:00`), ((target - current + 7) % 7) || 7);
  }
  return monthDate(text, now) || shiftDate(new Date(`${transactionDate}T12:00:00`), 30);
}

function parseTransactionDate(text, now) {
  if (/\byesterday\b|నిన్న|कल\s+(?:दिया|भुगतान)/i.test(text)) return shiftDate(now, -1);
  if (/\btomorrow\b|రేపు/i.test(text)) return shiftDate(now, 1);
  const transactionText = text.replace(/\b(?:due(?:\s+date)?|payment\s+due|pay(?:ment)?\s+by|by)\s+(?:on\s+)?\d{1,2}\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/gi, ' ');
  const dated = monthDate(transactionText, now, false);
  return dated || isoDate(now);
}

export function getSpeechLocale(language = 'en') {
  return languageLocales[language] || languageLocales.en;
}

export function parseTransactionCommand(transcript, customers = [], now = new Date()) {
  const normalized = normalizeText(transcript);
  const customer = matchCustomer(transcript, customers);
  if (/\b(report|summary)\b|రిపోర్ట్|నివేదిక|रिपोर्ट/i.test(transcript)) {
    return { intent: 'reports', detectedLanguage: detectLanguage(transcript) };
  }
  if (/\b(who|show|list).*\b(due|dues|pending|overdue)\b|బాకీ|బాకీలు|बकाया|बाकी/i.test(transcript)) {
    return { intent: 'dues', detectedLanguage: detectLanguage(transcript) };
  }
  if (customer && /\b(account|khata|balance)\b|ఖాతా|खाता/i.test(transcript)) {
    return { intent: 'customer', customerId: customer.id, detectedLanguage: detectLanguage(transcript) };
  }

  const amount = extractAmount(transcript);
  const type = transactionType(transcript);
  const transactionDate = parseTransactionDate(transcript, now);
  const dueDate = type === 'credit' ? parseDueDate(transcript, transactionDate, now) : null;
  const confidence = customer && amount && type !== 'unknown' ? 0.96 : customer && amount ? 0.62 : 0.28;
  return {
    intent: 'transaction',
    customerId: customer?.id || '',
    customerName: customer?.name || '',
    amount,
    type,
    transactionDate,
    dueDate,
    detectedLanguage: detectLanguage(transcript),
    confidence,
    originalVoiceInput: transcript,
    needsReview: confidence < 0.8,
  };
}
