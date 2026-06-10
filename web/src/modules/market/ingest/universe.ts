import { prisma } from '@/lib/db'

// Fixed ingestion baseline (D8): the derived universe must never mirror an
// individual client portfolio (D11 privacy), so the baseline is always merged in.
// Ported from api/app/services/yfinance_market.py B3_UNIVERSE.
export const B3_BASELINE: readonly string[] = [
  // Ibovespa core (large caps)
  'PETR4', 'PETR3', 'VALE3', 'ITUB4', 'BBDC4', 'BBAS3', 'B3SA3', 'ABEV3',
  'WEGE3', 'RENT3', 'SUZB3', 'PRIO3', 'GGBR4', 'CSNA3', 'USIM5', 'MGLU3',
  'LREN3', 'RAIL3', 'RADL3', 'TIMS3', 'HAPV3', 'EQTL3', 'CMIG4', 'TAEE11',
  'SBSP3', 'TOTS3', 'BPAC11', 'SANB11', 'BBSE3', 'IRBR3', 'YDUQ3', 'COGN3',
  'MRVE3', 'CYRE3', 'MULT3', 'BRAP4', 'KLBN11', 'RAIZ4', 'UGPA3', 'VBBR3',
  'CSAN3', 'GOAU4', 'SLCE3', 'SMTO3', 'ALOS3', 'ASAI3', 'PCAR3',
  'AXIA3', 'ITSA4', 'EMBJ3', 'ENEVE3', 'CPLE3', 'RDOR3',
  // Additional Ibovespa / large-mid caps
  'CCRO3', 'JBSS3', 'BEEF3', 'BRFS3', 'CMIN3', 'ELET3', 'ELET6', 'FLRY3',
  'HYPE3', 'VIVT3', 'NTCO3', 'BRKM5', 'CPFE3', 'EGIE3', 'ENGI11', 'ENBR3',
  'CRFB3', 'AZUL4', 'GOLL4', 'EMBR3', 'DXCO3', 'ODPV3', 'CIEL3', 'QUAL3',
  'STBP3', 'GMAT3', 'RECV3', 'RRRP3', 'SAPR11', 'CGAS5', 'SIMH3', 'TUPY3',
  'INTB3', 'IGTI11', 'SBFG3', 'ALPA4', 'PORTO3', 'CAML3', 'PETZ3', 'LWSA3',
  'MDIA3', 'JHSF3', 'CEAB3', 'ZAMP3', 'GRND3', 'RAPT4', 'FESA4', 'SMFT3',
  'EZTC3', 'POMO4',
  // FIIs
  'MXRF11', 'XPML11', 'KNRI11', 'HGBS11', 'BCFF11', 'VISC11', 'BTLG11',
  'HSML11', 'HGCR11', 'KNCR11', 'IRDM11', 'VILG11', 'XPCI11', 'BRCO11',
  'HGRU11', 'PVBI11', 'RZTR11', 'TRXF11', 'JSRE11', 'AFHI11',
  // ETFs listados na B3
  'BOVA11', 'IVVB11', 'SMAL11', 'HASH11', 'GOLD11', 'NASD11', 'DIVO11',
  'SPXI11', 'TECK11',
]

export const INDEX_TICKERS: readonly string[] = ['^BVSP', '^GSPC', '^VIX']

export function cleanTicker(ticker: string): string {
  const upper = ticker.trim().toUpperCase()
  return upper.endsWith('.SA') ? upper.slice(0, -3) : upper
}

/**
 * Deduplicated, global ticker universe for ingestion (D8): fixed baseline ∪
 * followed tickers. Returns plain ticker strings only — never client/user
 * identifiers (D11). When the portfolio schema lands, its distinct tickers
 * join this union the same way.
 */
export async function getIngestUniverse(): Promise<string[]> {
  const universe = new Set<string>(B3_BASELINE)
  try {
    const rows = await prisma.watchlistItem.findMany({
      select: { ticker: true },
      distinct: ['ticker'],
    })
    for (const row of rows) {
      const ticker = cleanTicker(row.ticker)
      if (ticker) universe.add(ticker)
    }
  } catch (err) {
    console.warn('Failed to read watchlist tickers for ingest universe:', err)
  }
  return [...universe]
}

/** B3 trading session check (Mon-Fri, 10:00-17:00 BRT). Ported from market_db.py. */
export function isB3Session(now: Date = new Date()): boolean {
  const brt = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const hour = brt.getHours() + brt.getMinutes() / 60
  const weekday = brt.getDay()
  return weekday >= 1 && weekday <= 5 && hour >= 10 && hour < 17
}
