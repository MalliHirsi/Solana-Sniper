# Solana Sniper — Research Terminal

A halal-first Solana token intelligence dashboard for identifying early-stage opportunities while filtering scams, rugs, and unethical projects.

**This is a research tool. Not financial advice. Not a trading bot.**

## Features

- **Halal Filter** — auto-screens tokens for gambling, alcohol, adult content, riba, and other haram categories
- **Rug Risk Engine** — scores mint authority, freeze authority, LP lock, holder concentration, token age, social presence
- **Alpha Score** — ranks tokens 0–100 based on liquidity, volume, market cap, age, socials, and risk profile
- **Explainable** — every badge shows the reasons behind the score
- **Filters** — filter by halal status, risk level, or search by name/symbol/narrative
- **Detail Panel** — click any token for full breakdown

## Philosophy

> Safety first. Halal first. Evidence first. Hype last.

Scores are heuristic estimates, not guarantees. Always do your own research. Halal classification is automated and not a fatwa — consult a qualified scholar for religious rulings.

## Project Structure

```
solana-sniper/
├── index.html              # Main dashboard
├── styles.css              # Dark mode UI
├── data/
│   └── sample-tokens.json  # Sample Solana token data
└── src/
    ├── main.js             # App bootstrap, state, filtering, rendering
    ├── api.js              # Data loading + DEX Screener normalizer
    ├── halal.js            # Halal screening engine
    ├── risk.js             # Rug/scam risk scoring engine
    ├── score.js            # Alpha score engine
    └── ui.js               # Badge/table/panel renderers
```

## Running Locally

No build step required. Serve the project folder over HTTP (required for ES module imports):

```bash
# Option 1 — Node serve
npx serve .

# Option 2 — Python
python -m http.server 3000

# Option 3 — VS Code Live Server extension
# Right-click index.html → Open with Live Server
```

Then open `http://localhost:3000`.

> Do not open `index.html` directly as a file:// URL — ES modules require HTTP.

## Deploying to GitHub Pages

1. Push this folder to a GitHub repository
2. Go to **Settings → Pages**
3. Set source to **Deploy from a branch** → `main` → `/ (root)`
4. GitHub Pages will serve `index.html` automatically

The `.nojekyll` file in this directory disables Jekyll processing so asset paths work correctly.

## Connecting Live Solana Data (Future — Task 10)

Edit `src/api.js` — swap `loadTokens()` to fetch from DEX Screener:

```js
export async function loadTokens() {
  const res = await fetch(
    'https://api.dexscreener.com/latest/dex/search?q=SOL&chainIds=solana'
  );
  const data = await res.json();
  return data.pairs
    .filter(p => p.chainId === 'solana')
    .map(normalizeDexScreenerPair);
}
```

The `normalizeDexScreenerPair()` function is already written and ready.

## Scoring Reference

### Halal Status
| Label | Meaning |
|---|---|
| Halal Likely | No haram keywords or narratives detected |
| Halal Caution | DeFi mechanics, leverage, or yield — verify |
| Haram / Excluded | Gambling, alcohol, adult, fraud — auto-excluded |

### Risk Score (0–10)
| Range | Label |
|---|---|
| 0–2 | Low Risk |
| 2.1–4 | Medium Risk |
| 4.1–6 | High Risk |
| 6.1–10 | Extreme Risk |

### Alpha Grade
| Score | Grade |
|---|---|
| 75–100 | A |
| 60–74 | B |
| 45–59 | C |
| 30–44 | D |
| 0–29 | F |

## Disclaimer

This tool is for research and educational purposes only. Nothing displayed constitutes financial, investment, or religious advice. Crypto assets are highly speculative. Always verify on-chain data independently. The halal classification system is automated pattern-matching and does not replace scholarly opinion.
