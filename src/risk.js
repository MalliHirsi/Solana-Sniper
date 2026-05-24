// Rug/scam risk engine
// Returns: { score: 0-10, label, reasons[] }
// Higher score = higher risk

export function scoreRisk(token) {
  let score = 0;
  const reasons = [];

  // --- Liquidity risk ---
  if (token.liquidity < 10000) {
    score += 3;
    reasons.push(`Critically low liquidity ($${formatNum(token.liquidity)}) — exit may be impossible`);
  } else if (token.liquidity < 50000) {
    score += 2;
    reasons.push(`Very low liquidity ($${formatNum(token.liquidity)}) — high slippage and exit risk`);
  } else if (token.liquidity < 200000) {
    score += 1;
    reasons.push(`Low liquidity ($${formatNum(token.liquidity)}) — limited depth`);
  }

  // --- Mint authority ---
  if (token.mintAuthority === true) {
    score += 2;
    reasons.push('Mint authority is active — team can print unlimited tokens');
  }

  // --- Freeze authority ---
  if (token.freezeAuthority === true) {
    score += 2;
    reasons.push('Freeze authority is active — team can freeze your wallet');
  }

  // --- LP not locked ---
  if (!token.lpLocked) {
    score += 2;
    reasons.push('Liquidity not locked — team can pull liquidity at any time');
  } else if (token.lpLockPct < 50) {
    score += 1.5;
    reasons.push(`Only ${token.lpLockPct}% of LP locked — significant unlocked liquidity`);
  } else if (token.lpLockPct < 80) {
    score += 0.5;
    reasons.push(`LP lock at ${token.lpLockPct}% — some liquidity remains unlocked`);
  }

  // --- Holder concentration ---
  if (token.topHolderPct > 50) {
    score += 3;
    reasons.push(`Top holder controls ${token.topHolderPct}% — extreme concentration, likely rug`);
  } else if (token.topHolderPct > 25) {
    score += 2;
    reasons.push(`Top holder controls ${token.topHolderPct}% — very high concentration risk`);
  } else if (token.topHolderPct > 15) {
    score += 1;
    reasons.push(`Top holder controls ${token.topHolderPct}% — elevated concentration`);
  } else if (token.topHolderPct > 10) {
    score += 0.5;
    reasons.push(`Top holder controls ${token.topHolderPct}% — moderate concentration`);
  }

  // --- Token age ---
  if (token.ageHours < 1) {
    score += 2;
    reasons.push('Token is under 1 hour old — extreme early risk, no track record');
  } else if (token.ageHours < 24) {
    score += 1.5;
    reasons.push(`Token is only ${token.ageHours}h old — very early, no track record`);
  } else if (token.ageHours < 72) {
    score += 0.5;
    reasons.push(`Token is ${token.ageHours}h old — still early stage`);
  }

  // --- No socials ---
  if (!token.hasSocials) {
    score += 1.5;
    reasons.push('No social presence — anonymous project with no community accountability');
  } else {
    if (!token.twitter) score += 0.5, reasons.push('No Twitter/X account found');
    if (!token.website) score += 0.3, reasons.push('No website found');
  }

  // --- Extreme pump pattern ---
  if (token.priceChange1h > 100) {
    score += 1.5;
    reasons.push(`${token.priceChange1h}% gain in 1h — extreme pump pattern, possible manipulation`);
  } else if (token.priceChange1h > 50) {
    score += 1;
    reasons.push(`${token.priceChange1h}% gain in 1h — aggressive pump, high dump risk`);
  }

  if (token.priceChange24h > 300) {
    score += 1;
    reasons.push(`${token.priceChange24h}% gain in 24h — likely coordinated pump`);
  }

  // --- Volume to market cap anomaly (fake volume signal) ---
  if (token.marketCap > 0) {
    const volMcapRatio = token.volume24h / token.marketCap;
    if (volMcapRatio > 5) {
      score += 1;
      reasons.push(`24h volume is ${(volMcapRatio * 100).toFixed(0)}% of market cap — possible wash trading`);
    }
  }

  // Cap at 10
  score = Math.min(10, Math.round(score * 10) / 10);

  let label;
  if (score <= 2) label = 'Low Risk';
  else if (score <= 4) label = 'Medium Risk';
  else if (score <= 6) label = 'High Risk';
  else label = 'Extreme Risk';

  if (reasons.length === 0) {
    reasons.push('No major risk flags detected — standard due diligence still required');
  }

  return { score, label, reasons };
}

function formatNum(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toString();
}
