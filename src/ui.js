// UI rendering module

const SOLSCAN_BASE = 'https://solscan.io/token/';
const DEXSCREENER_BASE = 'https://dexscreener.com/solana/';

// ─── Formatters ──────────────────────────────────────────────────────────────

export function fmt(n, decimals = 2) {
  if (n === null || n === undefined) return '—';
  if (n >= 1_000_000_000) return '$' + (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(0) + 'K';
  if (n >= 1) return '$' + n.toFixed(decimals);
  return '$' + n.toFixed(6);
}

export function fmtPrice(n) {
  if (!n) return '—';
  if (n >= 1) return '$' + n.toFixed(3);
  if (n >= 0.0001) return '$' + n.toFixed(6);
  return '$' + n.toExponential(3);
}

export function fmtPct(n) {
  if (n === null || n === undefined) return '—';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}

export function fmtAge(hours) {
  if (hours === null || hours === undefined) return '—';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  if (hours < 720) return `${Math.round(hours / 24)}d`;
  return `${Math.round(hours / 720)}mo`;
}

// ─── Badge builders ───────────────────────────────────────────────────────────

export function halalBadge(halal) {
  const map = {
    PASS: { cls: 'badge-halal-pass', text: 'Halal Likely' },
    CAUTION: { cls: 'badge-halal-caution', text: 'Halal Caution' },
    REJECT: { cls: 'badge-halal-reject', text: 'Haram / Excluded' },
  };
  const b = map[halal.status] || map.CAUTION;
  return `<span class="badge ${b.cls}">${b.text}</span>`;
}

export function riskBadge(risk) {
  const map = {
    'Low Risk': 'badge-risk-low',
    'Medium Risk': 'badge-risk-medium',
    'High Risk': 'badge-risk-high',
    'Extreme Risk': 'badge-risk-extreme',
  };
  const cls = map[risk.label] || 'badge-risk-medium';
  return `<span class="badge ${cls}">${risk.label} (${risk.score}/10)</span>`;
}

export function gradeBadge(alpha) {
  if (alpha.grade === 'Excluded' || alpha.grade === 'Rejected') {
    return `<span class="badge badge-excluded">${alpha.grade}</span>`;
  }
  return `<span class="badge badge-grade badge-grade-${alpha.grade}">${alpha.grade} (${alpha.score})</span>`;
}

export function pctCell(val) {
  if (val === null || val === undefined) return `<span class="neutral">—</span>`;
  const cls = val > 0 ? 'positive' : val < 0 ? 'negative' : 'neutral';
  return `<span class="${cls}">${fmtPct(val)}</span>`;
}

// ─── Table row ────────────────────────────────────────────────────────────────

export function renderRow(enriched, index) {
  const { token, halal, risk, alpha } = enriched;
  const isExcluded = halal.status === 'REJECT';
  const rowCls = isExcluded ? 'row-excluded' : risk.score >= 7 ? 'row-danger' : '';

  return `
    <tr class="${rowCls}" data-id="${token.id}" role="button" tabindex="0" aria-label="View details for ${token.symbol}">
      <td class="rank-cell">${index + 1}</td>
      <td class="token-cell">
        <span class="token-symbol">${escHtml(token.symbol)}</span>
        <span class="token-name">${escHtml(token.name)}</span>
        <span class="token-dex">${escHtml(token.dex)}</span>
      </td>
      <td>${halalBadge(halal)}</td>
      <td>${riskBadge(risk)}</td>
      <td class="alpha-cell">${gradeBadge(alpha)}</td>
      <td class="price-cell">${fmtPrice(token.price)}</td>
      <td>${fmt(token.marketCap)}</td>
      <td>${fmt(token.liquidity)}</td>
      <td>${pctCell(token.priceChange1h)}</td>
      <td>${pctCell(token.priceChange24h)}</td>
      <td class="age-cell">${fmtAge(token.ageHours)}</td>
      <td class="links-cell">
        <a href="${DEXSCREENER_BASE}${token.pairAddress}" target="_blank" rel="noopener" class="link-btn" title="Chart">Chart</a>
        <a href="${SOLSCAN_BASE}${token.address}" target="_blank" rel="noopener" class="link-btn" title="Explorer">Scan</a>
      </td>
    </tr>
  `;
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

export function renderDetail(enriched) {
  const { token, halal, risk, alpha } = enriched;

  const socialLinks = [
    token.twitter ? `<a href="${token.twitter}" target="_blank" rel="noopener" class="social-link">Twitter / X</a>` : null,
    token.website ? `<a href="${token.website}" target="_blank" rel="noopener" class="social-link">Website</a>` : null,
    token.telegram ? `<a href="${token.telegram}" target="_blank" rel="noopener" class="social-link">Telegram</a>` : null,
  ].filter(Boolean).join('');

  const reasonList = (items) => items
    .map(r => `<li>${escHtml(r)}</li>`)
    .join('');

  return `
    <div class="detail-header">
      <div class="detail-title">
        <span class="detail-symbol">${escHtml(token.symbol)}</span>
        <span class="detail-name">${escHtml(token.name)}</span>
      </div>
      <div class="detail-badges">
        ${halalBadge(halal)}
        ${riskBadge(risk)}
        ${gradeBadge(alpha)}
      </div>
    </div>

    <div class="detail-grid">
      <div class="detail-stat">
        <span class="stat-label">Price</span>
        <span class="stat-value">${fmtPrice(token.price)}</span>
      </div>
      <div class="detail-stat">
        <span class="stat-label">Market Cap</span>
        <span class="stat-value">${fmt(token.marketCap)}</span>
      </div>
      <div class="detail-stat">
        <span class="stat-label">Liquidity</span>
        <span class="stat-value">${fmt(token.liquidity)}</span>
      </div>
      <div class="detail-stat">
        <span class="stat-label">Age</span>
        <span class="stat-value">${fmtAge(token.ageHours)}</span>
      </div>
      <div class="detail-stat">
        <span class="stat-label">DEX</span>
        <span class="stat-value">${escHtml(token.dex)}</span>
      </div>
      <div class="detail-stat">
        <span class="stat-label">Holders</span>
        <span class="stat-value">${token.holders ? token.holders.toLocaleString() : '—'}</span>
      </div>
    </div>

    <div class="detail-volume">
      <div class="vol-item">
        <span class="stat-label">5m</span>
        <span>${pctCell(token.priceChange5m)}</span>
      </div>
      <div class="vol-item">
        <span class="stat-label">1h</span>
        <span>${pctCell(token.priceChange1h)}</span>
      </div>
      <div class="vol-item">
        <span class="stat-label">24h</span>
        <span>${pctCell(token.priceChange24h)}</span>
      </div>
      <div class="vol-item">
        <span class="stat-label">Vol 24h</span>
        <span>${fmt(token.volume24h)}</span>
      </div>
    </div>

    <div class="detail-flags">
      <span class="flag ${token.mintAuthority ? 'flag-danger' : 'flag-safe'}">
        Mint Auth: ${token.mintAuthority ? 'ACTIVE' : token.mintAuthority === false ? 'Revoked' : '—'}
      </span>
      <span class="flag ${token.freezeAuthority ? 'flag-danger' : 'flag-safe'}">
        Freeze Auth: ${token.freezeAuthority ? 'ACTIVE' : token.freezeAuthority === false ? 'Revoked' : '—'}
      </span>
      <span class="flag ${token.lpLocked ? 'flag-safe' : 'flag-danger'}">
        LP Lock: ${token.lpLocked ? token.lpLockPct + '%' : 'UNLOCKED'}
      </span>
      <span class="flag ${(token.topHolderPct || 0) > 20 ? 'flag-danger' : (token.topHolderPct || 0) > 10 ? 'flag-warn' : 'flag-safe'}">
        Top Holder: ${token.topHolderPct != null ? token.topHolderPct + '%' : '—'}
      </span>
    </div>

    <div class="detail-section">
      <h4 class="section-title">Halal Analysis</h4>
      <ul class="reason-list">${reasonList(halal.reasons)}</ul>
    </div>

    <div class="detail-section">
      <h4 class="section-title">Risk Analysis</h4>
      <ul class="reason-list">${reasonList(risk.reasons)}</ul>
    </div>

    <div class="detail-section">
      <h4 class="section-title">Alpha Score Breakdown</h4>
      <ul class="reason-list">${reasonList(alpha.reasons)}</ul>
    </div>

    ${token.notes ? `
    <div class="detail-section">
      <h4 class="section-title">Notes</h4>
      <p class="token-notes">${escHtml(token.notes)}</p>
    </div>
    ` : ''}

    ${token.narrative?.length ? `
    <div class="detail-section">
      <h4 class="section-title">Narratives</h4>
      <div class="narrative-tags">
        ${token.narrative.map(n => `<span class="narrative-tag">${escHtml(n)}</span>`).join('')}
      </div>
    </div>
    ` : ''}

    <div class="detail-section">
      <h4 class="section-title">Research Links</h4>
      <div class="research-links">
        <a href="${DEXSCREENER_BASE}${token.pairAddress}" target="_blank" rel="noopener" class="link-btn link-btn-lg">DEX Screener Chart</a>
        <a href="${SOLSCAN_BASE}${token.address}" target="_blank" rel="noopener" class="link-btn link-btn-lg">Solscan Explorer</a>
        ${socialLinks}
      </div>
    </div>

    <div class="detail-address">
      <span class="stat-label">Contract</span>
      <code class="address-code">${escHtml(token.address)}</code>
    </div>
  `;
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

export function renderStats(tokens) {
  const total = tokens.length;
  const halal = tokens.filter(t => t.halal.status === 'PASS').length;
  const caution = tokens.filter(t => t.halal.status === 'CAUTION').length;
  const rejected = tokens.filter(t => t.halal.status === 'REJECT').length;
  const lowRisk = tokens.filter(t => t.risk.label === 'Low Risk').length;
  const highRisk = tokens.filter(t => ['High Risk', 'Extreme Risk'].includes(t.risk.label)).length;

  return `
    <div class="stat-item">
      <span class="stat-num">${total}</span>
      <span class="stat-label">Total Tokens</span>
    </div>
    <div class="stat-item">
      <span class="stat-num stat-green">${halal}</span>
      <span class="stat-label">Halal Likely</span>
    </div>
    <div class="stat-item">
      <span class="stat-num stat-yellow">${caution}</span>
      <span class="stat-label">Caution</span>
    </div>
    <div class="stat-item">
      <span class="stat-num stat-red">${rejected}</span>
      <span class="stat-label">Excluded</span>
    </div>
    <div class="stat-item">
      <span class="stat-num stat-green">${lowRisk}</span>
      <span class="stat-label">Low Risk</span>
    </div>
    <div class="stat-item">
      <span class="stat-num stat-red">${highRisk}</span>
      <span class="stat-label">High/Extreme Risk</span>
    </div>
  `;
}

// Sanitize HTML output
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
