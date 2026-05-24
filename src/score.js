// Alpha scoring engine
// Returns: { score: 0-100, grade, reasons[] }
// Higher = stronger opportunity signal

export function scoreAlpha(token, halalResult, riskResult) {
  let score = 0;
  const reasons = [];

  // --- Halal gate (hard filter) ---
  if (halalResult.status === 'REJECT') {
    return { score: 0, grade: 'Excluded', reasons: ['Token excluded on halal grounds — not scored'] };
  }

  const halalPenalty = halalResult.status === 'CAUTION' ? 10 : 0;

  // --- Risk gate (hard filter for extreme risk) ---
  if (riskResult.score >= 8) {
    return { score: 0, grade: 'Rejected', reasons: [`Risk score ${riskResult.score}/10 — too dangerous to rank`] };
  }

  // --- Liquidity score (0-20 pts) ---
  let liqScore = 0;
  if (token.liquidity >= 10_000_000) {
    liqScore = 20;
    reasons.push('Excellent liquidity (>$10M)');
  } else if (token.liquidity >= 2_000_000) {
    liqScore = 16;
    reasons.push('Strong liquidity (>$2M)');
  } else if (token.liquidity >= 500_000) {
    liqScore = 12;
    reasons.push('Good liquidity (>$500K)');
  } else if (token.liquidity >= 100_000) {
    liqScore = 7;
    reasons.push('Moderate liquidity ($100K–$500K)');
  } else if (token.liquidity >= 50_000) {
    liqScore = 3;
    reasons.push('Low liquidity ($50K–$100K) — caution');
  } else {
    liqScore = 0;
    reasons.push('Very low liquidity — high exit risk');
  }
  score += liqScore;

  // --- Volume momentum (0-20 pts) ---
  let volScore = 0;
  const volMcapRatio = token.marketCap > 0 ? token.volume24h / token.marketCap : 0;
  if (volMcapRatio >= 0.5 && volMcapRatio <= 3) {
    volScore = 20;
    reasons.push('Strong healthy volume relative to market cap');
  } else if (volMcapRatio >= 0.2) {
    volScore = 14;
    reasons.push('Good volume momentum');
  } else if (volMcapRatio >= 0.05) {
    volScore = 8;
    reasons.push('Moderate volume activity');
  } else if (volMcapRatio > 3) {
    volScore = 8;
    reasons.push('High volume but may indicate wash trading — flagged');
  } else {
    volScore = 2;
    reasons.push('Low volume relative to market cap');
  }
  score += volScore;

  // --- Market cap opportunity (0-15 pts) ---
  // Sweet spot: small-mid cap has more upside, but not micro-cap rug risk
  let mcapScore = 0;
  if (token.marketCap >= 1_000_000 && token.marketCap < 10_000_000) {
    mcapScore = 15;
    reasons.push('Small cap ($1M–$10M) — high upside potential if fundamentals hold');
  } else if (token.marketCap >= 10_000_000 && token.marketCap < 100_000_000) {
    mcapScore = 12;
    reasons.push('Mid-small cap ($10M–$100M) — growth stage');
  } else if (token.marketCap >= 100_000_000 && token.marketCap < 1_000_000_000) {
    mcapScore = 8;
    reasons.push('Mid cap ($100M–$1B) — more stable, less upside');
  } else if (token.marketCap >= 1_000_000_000) {
    mcapScore = 4;
    reasons.push('Large cap (>$1B) — limited upside in bull cycle');
  } else {
    mcapScore = 3;
    reasons.push('Micro cap (<$1M) — extreme risk, limited score');
  }
  score += mcapScore;

  // --- Age / track record (0-10 pts) ---
  let ageScore = 0;
  if (token.ageHours >= 8760) {       // 1 year+
    ageScore = 10;
    reasons.push('Established token (1+ year) — survived multiple cycles');
  } else if (token.ageHours >= 2160) { // 90 days+
    ageScore = 8;
    reasons.push('Mature token (90+ days) — some track record');
  } else if (token.ageHours >= 720) {  // 30 days+
    ageScore = 6;
    reasons.push('Token is 30+ days old — early but not brand new');
  } else if (token.ageHours >= 168) {  // 7 days+
    ageScore = 4;
    reasons.push('Token is 7+ days old — very early stage');
  } else if (token.ageHours >= 24) {
    ageScore = 2;
    reasons.push('Token under 7 days old — high uncertainty');
  } else {
    ageScore = 0;
    reasons.push('Token under 24 hours — no track record');
  }
  score += ageScore;

  // --- Social presence (0-10 pts) ---
  let socialScore = 0;
  if (token.hasSocials) {
    socialScore += 4;
    if (token.twitter) socialScore += 3;
    if (token.website) socialScore += 2;
    if (token.telegram) socialScore += 1;
    reasons.push(`Social presence: ${[token.twitter ? 'Twitter' : null, token.website ? 'Website' : null, token.telegram ? 'Telegram' : null].filter(Boolean).join(', ')}`);
  } else {
    reasons.push('No social presence — anonymous project');
  }
  score += socialScore;

  // --- Verified status (0-5 pts) ---
  if (token.verified) {
    score += 5;
    reasons.push('Token verified on explorer');
  }

  // --- Risk deduction (0-20 pts deducted) ---
  const riskDeduction = Math.round(riskResult.score * 2);
  score -= riskDeduction;
  if (riskDeduction > 0) {
    reasons.push(`Risk deduction: -${riskDeduction} pts (risk score: ${riskResult.score}/10)`);
  }

  // --- Halal caution deduction ---
  if (halalPenalty > 0) {
    score -= halalPenalty;
    reasons.push(`Halal caution deduction: -${halalPenalty} pts`);
  }

  // Clamp 0-100
  score = Math.max(0, Math.min(100, Math.round(score)));

  let grade;
  if (score >= 75) grade = 'A';
  else if (score >= 60) grade = 'B';
  else if (score >= 45) grade = 'C';
  else if (score >= 30) grade = 'D';
  else grade = 'F';

  return { score, grade, reasons };
}
