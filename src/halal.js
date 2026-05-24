// Halal screening engine
// Returns: { status: 'PASS'|'CAUTION'|'REJECT', label, reasons[] }

const HARAM_KEYWORDS = [
  'casino', 'gambling', 'gamble', 'bet', 'betting', 'lottery', 'poker', 'slot',
  'alcohol', 'beer', 'wine', 'whiskey', 'vodka', 'rum', 'liquor', 'brewery',
  'pork', 'pig', 'bacon', 'ham',
  'adult', 'xxx', 'porn', 'onlyfans', 'nsfw',
  'riba', 'interest', 'usury',
  'fraud', 'scam', 'ponzi',
];

const CAUTION_NARRATIVES = [
  'perps',       // perpetual futures — involves leverage, possible riba
  'lending',     // yield/interest lending protocols
  'yield',       // may involve interest-bearing mechanisms
  'options',     // derivatives
  'leverage',    // leveraged instruments
  'futures',     // futures trading
];

const CAUTION_KEYWORDS = [
  'yield', 'lend', 'borrow', 'leverage', 'margin', 'futures', 'options',
  'derivative', 'perpetual', 'perp',
];

export function screenHalal(token) {
  const reasons = [];
  const nameAndSymbol = `${token.name} ${token.symbol}`.toLowerCase();
  const narratives = (token.narrative || []).map(n => n.toLowerCase());

  // Check haram keywords in name/symbol
  for (const kw of HARAM_KEYWORDS) {
    if (nameAndSymbol.includes(kw)) {
      reasons.push(`Name/symbol contains "${kw}" — haram category`);
    }
  }

  // Check narrative tags for haram
  const haramNarratives = ['gambling', 'casino', 'alcohol', 'adult', 'pork', 'betting'];
  for (const n of narratives) {
    if (haramNarratives.includes(n)) {
      reasons.push(`Narrative tag "${n}" is a haram category`);
    }
  }

  if (reasons.length > 0) {
    return {
      status: 'REJECT',
      label: 'Haram / Excluded',
      reasons,
    };
  }

  // Check caution keywords in name/symbol
  for (const kw of CAUTION_KEYWORDS) {
    if (nameAndSymbol.includes(kw)) {
      reasons.push(`Name/symbol contains "${kw}" — may involve interest or derivatives`);
    }
  }

  // Check caution narratives
  for (const n of narratives) {
    if (CAUTION_NARRATIVES.includes(n)) {
      reasons.push(`Narrative tag "${n}" may involve leverage or interest-based mechanics`);
    }
  }

  // DeFi infrastructure — flag for manual review
  const defiNarratives = ['defi', 'lending', 'yield', 'perps'];
  const hasDefi = narratives.some(n => defiNarratives.includes(n));
  if (hasDefi) {
    reasons.push('DeFi project — verify mechanics do not involve riba (interest) or haram instruments');
  }

  if (reasons.length > 0) {
    return {
      status: 'CAUTION',
      label: 'Halal Caution',
      reasons,
    };
  }

  return {
    status: 'PASS',
    label: 'Halal Likely',
    reasons: ['No haram keywords or narratives detected — manual verification still recommended'],
  };
}
