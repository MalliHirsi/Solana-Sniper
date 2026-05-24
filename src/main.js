import { loadTokens } from './api.js';
import { screenHalal } from './halal.js';
import { scoreRisk } from './risk.js';
import { scoreAlpha } from './score.js';
import { renderRow, renderDetail, renderStats } from './ui.js';

// ─── State ────────────────────────────────────────────────────────────────────

let allTokens = [];
let selectedId = null;
let filters = {
  halal: 'all',
  risk: 'all',
  search: '',
  sortBy: 'alpha',
  hideExcluded: false,
};

// ─── Boot ─────────────────────────────────────────────────────────────────────

async function init() {
  showLoading(true);
  try {
    const raw = await loadTokens();
    allTokens = enrichTokens(raw);
    renderAll();
    bindControls();
  } catch (err) {
    showError(err.message);
  } finally {
    showLoading(false);
  }
}

// ─── Enrichment pipeline ──────────────────────────────────────────────────────

function enrichTokens(rawTokens) {
  return rawTokens.map(token => {
    const halal = screenHalal(token);
    const risk = scoreRisk(token);
    const alpha = scoreAlpha(token, halal, risk);
    return { token, halal, risk, alpha };
  });
}

// ─── Filtering & sorting ──────────────────────────────────────────────────────

function applyFilters(tokens) {
  let out = [...tokens];

  if (filters.hideExcluded) {
    out = out.filter(t => t.halal.status !== 'REJECT');
  }

  if (filters.halal !== 'all') {
    out = out.filter(t => t.halal.status === filters.halal);
  }

  if (filters.risk !== 'all') {
    const map = {
      low: t => t.risk.label === 'Low Risk',
      medium: t => t.risk.label === 'Medium Risk',
      high: t => ['High Risk', 'Extreme Risk'].includes(t.risk.label),
    };
    if (map[filters.risk]) out = out.filter(map[filters.risk]);
  }

  if (filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    out = out.filter(t =>
      t.token.name.toLowerCase().includes(q) ||
      t.token.symbol.toLowerCase().includes(q) ||
      t.token.address.toLowerCase().includes(q) ||
      (t.token.narrative || []).some(n => n.toLowerCase().includes(q))
    );
  }

  // Sort
  out.sort((a, b) => {
    switch (filters.sortBy) {
      case 'alpha':     return b.alpha.score - a.alpha.score;
      case 'risk':      return a.risk.score - b.risk.score;
      case 'liquidity': return b.token.liquidity - a.token.liquidity;
      case 'mcap':      return b.token.marketCap - a.token.marketCap;
      case 'volume':    return b.token.volume24h - a.token.volume24h;
      case 'age':       return a.token.ageHours - b.token.ageHours;
      case 'change1h':  return b.token.priceChange1h - a.token.priceChange1h;
      default:          return b.alpha.score - a.alpha.score;
    }
  });

  return out;
}

// ─── Render ───────────────────────────────────────────────────────────────────

function renderAll() {
  const filtered = applyFilters(allTokens);

  // Stats bar
  document.getElementById('stats-bar').innerHTML = renderStats(allTokens);

  // Table
  const tbody = document.getElementById('token-tbody');
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="12" class="empty-state">No tokens match your filters.</td></tr>`;
  } else {
    tbody.innerHTML = filtered.map((t, i) => renderRow(t, i)).join('');
  }

  // Result count
  const countEl = document.getElementById('result-count');
  if (countEl) {
    countEl.textContent = `${filtered.length} token${filtered.length !== 1 ? 's' : ''}`;
  }

  // Re-bind row click events
  tbody.querySelectorAll('tr[data-id]').forEach(row => {
    row.addEventListener('click', () => openDetail(row.dataset.id));
    row.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') openDetail(row.dataset.id);
    });
  });

  // Restore selection highlight
  if (selectedId) {
    const sel = tbody.querySelector(`tr[data-id="${selectedId}"]`);
    if (sel) sel.classList.add('row-selected');
  }
}

function openDetail(id) {
  selectedId = id;

  // Highlight row
  document.querySelectorAll('#token-tbody tr').forEach(r => r.classList.remove('row-selected'));
  const row = document.querySelector(`tr[data-id="${id}"]`);
  if (row) row.classList.add('row-selected');

  const enriched = allTokens.find(t => t.token.id === id);
  if (!enriched) return;

  const panel = document.getElementById('detail-panel');
  const content = document.getElementById('detail-content');
  content.innerHTML = renderDetail(enriched);
  panel.classList.add('panel-open');
  panel.setAttribute('aria-hidden', 'false');
}

function closeDetail() {
  selectedId = null;
  const panel = document.getElementById('detail-panel');
  panel.classList.remove('panel-open');
  panel.setAttribute('aria-hidden', 'true');
  document.querySelectorAll('#token-tbody tr').forEach(r => r.classList.remove('row-selected'));
}

// ─── Controls ─────────────────────────────────────────────────────────────────

function bindControls() {
  // Halal filter
  document.getElementById('filter-halal').addEventListener('change', e => {
    filters.halal = e.target.value;
    renderAll();
  });

  // Risk filter
  document.getElementById('filter-risk').addEventListener('change', e => {
    filters.risk = e.target.value;
    renderAll();
  });

  // Sort
  document.getElementById('filter-sort').addEventListener('change', e => {
    filters.sortBy = e.target.value;
    renderAll();
  });

  // Search
  let searchTimer;
  document.getElementById('search-input').addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      filters.search = e.target.value;
      renderAll();
    }, 200);
  });

  // Hide excluded toggle
  document.getElementById('toggle-excluded').addEventListener('change', e => {
    filters.hideExcluded = e.target.checked;
    renderAll();
  });

  // Close panel
  document.getElementById('panel-close').addEventListener('click', closeDetail);

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDetail();
  });

  // Close panel on backdrop click (mobile)
  document.getElementById('detail-panel').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeDetail();
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function showLoading(show) {
  const el = document.getElementById('loading-state');
  if (el) el.style.display = show ? 'flex' : 'none';
}

function showError(msg) {
  const tbody = document.getElementById('token-tbody');
  tbody.innerHTML = `<tr><td colspan="12" class="error-state">Failed to load token data. Check browser console for details.</td></tr>`;

  const banner = document.getElementById('error-banner');
  if (banner) {
    banner.textContent = `Data load error: ${msg}`;
    banner.style.display = 'block';
  }

  console.error('[solana-sniper] Data load error:', msg);
}

// ─── Start ────────────────────────────────────────────────────────────────────

init();
