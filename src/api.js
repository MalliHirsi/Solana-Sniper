// Data loading module
// V1: imports token data as a JS module (no fetch — works reliably on GitHub Pages)
// Future: swap loadTokens() body to fetch from DEX Screener / Jupiter APIs

import { SAMPLE_TOKENS } from '../data/tokens.js';

export async function loadTokens() {
  return SAMPLE_TOKENS;
}

// Normalizer — converts raw DEX Screener pair data to our internal token schema
// Kept here for when live API is connected (Task 10-11)
export function normalizeDexScreenerPair(pair) {
  return {
    id: pair.pairAddress,
    name: pair.baseToken?.name || 'Unknown',
    symbol: pair.baseToken?.symbol || '???',
    address: pair.baseToken?.address || '',
    pairAddress: pair.pairAddress || '',
    dex: pair.dexId || 'Unknown',
    price: parseFloat(pair.priceUsd || 0),
    marketCap: pair.fdv || 0,
    liquidity: pair.liquidity?.usd || 0,
    volume5m: pair.volume?.m5 || 0,
    volume1h: pair.volume?.h1 || 0,
    volume24h: pair.volume?.h24 || 0,
    priceChange5m: pair.priceChange?.m5 || 0,
    priceChange1h: pair.priceChange?.h1 || 0,
    priceChange24h: pair.priceChange?.h24 || 0,
    ageHours: pair.pairCreatedAt
      ? (Date.now() - pair.pairCreatedAt) / 3_600_000
      : null,
    holders: null,
    topHolderPct: null,
    mintAuthority: null,
    freezeAuthority: null,
    lpLocked: null,
    lpLockPct: null,
    hasSocials: !!(pair.info?.socials?.length),
    twitter: pair.info?.socials?.find(s => s.type === 'twitter')?.url || null,
    website: pair.info?.websites?.[0]?.url || null,
    telegram: pair.info?.socials?.find(s => s.type === 'telegram')?.url || null,
    narrative: [],
    verified: false,
    notes: '',
  };
}
