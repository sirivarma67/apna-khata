const actionPatterns = [
  ['add', /\b(add|create|new)\b|చేర్చ|జోడించ|జోడించు|చేర్చు|जोड़ें|जोड़ो|जोड़ना/i],
  ['find', /\b(find|search|show|open|look up)\b|వెతుకు|చూపించు|చూడి|खोजें|ढूँढें|दिखाएँ|खोलें/i],
  ['edit', /\b(edit|update|change)\b|మార్చు|సవరించు|మార్చండి|बदलें|बदलना|संपादित/i],
  ['delete', /\b(delete|remove)\b|తొలగించు|తీసివేయి|తొలగించండి|हटाएँ|हटाओ|मिटाएँ/i],
];

const commandWords = /\b(customer|customers|please|the|for|a|an|name|account|khata|my|from|list)\b/giu;
const indicCommandWords = /(^|\s)(?:వినియోగదారు|వినియోగదారుని|పేరు|దయచేసి|ఖాతా|ని|ను|కు|తో|ग्राहक|कृपया|नाम|खाता|को|का|की)(?=\s|$)/gu;
const aliases = {
  anjali: ['anjali', 'అంజలి', 'अंजलि'],
  kiran: ['kiran', 'కిరణ్', 'किरण'],
  lakshmi: ['lakshmi', 'లక్ష్మి', 'లక్ష్మీ', 'लक्ष्मी'],
  pavan: ['pavan', 'pawan', 'పవన్', 'पवन'],
  priya: ['priya', 'ప్రియా', 'प्रिया'],
  ramesh: ['ramesh', 'రమేష్', 'रमेश'],
  ravi: ['ravi', 'రవి', 'रवि'],
  suresh: ['suresh', 'సురేష్', 'सुरేష్'],
};

function normalize(value) {
  return value.normalize('NFC').toLocaleLowerCase().replace(/[’']/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function editDistance(left, right) {
  const a = Array.from(left);
  const b = Array.from(right);
  const row = Array.from({ length: b.length + 1 }, (_value, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const current = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[b.length];
}

export function parseCustomerCommand(transcript) {
  const match = actionPatterns.find(([, pattern]) => pattern.test(transcript));
  if (!match) return null;
  const [intent, pattern] = match;
  let name = transcript.replace(pattern, ' ').replace(commandWords, ' ').replace(indicCommandWords, '$1 ');
  name = name.replace(/^[\s,.:;!?-]+|[\s,.:;!?-]+$/g, '').replace(/\s+/g, ' ');
  return name ? { intent, name } : null;
}

export function findCustomerCandidate(name, customers) {
  const normalized = normalize(name);
  if (!normalized) return null;
  const queryVariants = new Set([normalized]);
  const queryFirst = normalized.split(' ')[0];
  for (const [canonical, values] of Object.entries(aliases)) {
    if (values.some((value) => normalize(value) === queryFirst)) {
      values.forEach((value) => queryVariants.add(normalize(value)));
      queryVariants.add(canonical);
    }
  }

  const matches = customers.map((customer) => {
    const customerName = normalize(customer.name);
    const variants = new Set([customerName]);
    const first = customerName.split(' ')[0];
    for (const [canonical, values] of Object.entries(aliases)) {
      if (values.some((value) => normalize(value) === first)) {
        values.forEach((value) => variants.add(normalize(value)));
        variants.add(canonical);
      }
    }
    let score = 0;
    for (const queryVariant of queryVariants) {
      for (const customerVariant of variants) {
        if (queryVariant === customerVariant) score = Math.max(score, 1);
        else {
          const length = Math.max(Array.from(queryVariant).length, Array.from(customerVariant).length);
          const similarity = length ? 1 - editDistance(queryVariant, customerVariant) / length : 0;
          score = Math.max(score, similarity);
        }
      }
    }
    return { customer, score };
  }).sort((left, right) => right.score - left.score);
  return matches[0]?.score >= 0.62 ? matches[0] : null;
}
