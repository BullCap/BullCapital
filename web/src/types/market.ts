export interface MarketRadarDataPoint {
  metric: string // e.g., 'Volatilidade', 'Momentum', 'Liquidez', 'Valuation', 'Tendência'
  value: number // e.g., 0 to 100 percentile
  fullMark: number // typically 100 for normalization
}

export interface MarketSummaryProfile {
  longBusinessSummary?: string
  sector?: string
  industry?: string
  website?: string
  fullTimeEmployees?: number
}

export interface MarketQuoteSnapshot {
  regularMarketPrice: number
  regularMarketChangePercent: number
  fiftyTwoWeekHigh: number
  fiftyTwoWeekLow: number
  marketCap?: number
  longName?: string
}

export interface MarketRadarData {
  ticker?: string // Optional, if it's for a specific asset like 'PETR4' or index 'IBOV'
  timestamp: string
  data: MarketRadarDataPoint[]
  profile?: MarketSummaryProfile
  quote?: MarketQuoteSnapshot
}

export interface MarketListingItem {
  stock: string
  name: string
  close: number
  change: number
  volume: number
  marketCap: number | null
  logo: string | null
  sector: string | null
  type: 'stock' | 'fund' | 'bdr' | 'etf' | string
}

export interface MarketListingsData {
  stocks: MarketListingItem[]
  indexes: Array<{ stock: string; name: string }>
  currentPage: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
}

export interface AssetQuote {
  symbol: string
  shortName: string
  longName?: string
  regularMarketPrice: number
  regularMarketChangePercent: number
  regularMarketVolume: number
  marketCap: number
  logourl: string
  sector?: string | null
  trailingPE?: number
  dividendYield?: number
  evEbitda?: number | null
  roe?: number | null
  roic?: number | null
  pBook?: number | null
  averageVolume?: number | null
}

export interface PrimeRateEntry {
  date: string
  value: string
  epochDate: number
}

export interface InflationEntry {
  date: string
  value: string
  epochDate: number
}

export interface MarketIndicatorsData {
  selic: PrimeRateEntry[]
  inflation: InflationEntry[]
}

export interface AssetSearchResult {
  symbol: string
  name: string
  logo: string | null
  type: 'stock' | 'fund' | 'bdr' | 'etf' | string
  sector: string | null
}

export interface AssetSearchData {
  results: AssetSearchResult[]
  currentPage: number
  totalPages: number
  itemsPerPage: number
  totalCount: number
  hasNextPage: boolean
}

export interface MarketStatusIndex {
  name: string
  symbol: string
  regularMarketPrice: number
  regularMarketChangePercent: number
}

export interface MarketStatusData {
  indices: MarketStatusIndex[]
  error?: string
}

export interface AssetHistoryData {
  results: AssetHistoryResult[]
  error?: string
}

export interface AssetHistoryResult {
  symbol: string
  history: AssetHistoricalPrice[]
}

export interface AssetHistoricalPrice {
  timestamp: number
  open?: number
  close: number
  high?: number
  low?: number
  volume?: number
}

export interface AssetNewsItem {
  title: string
  originalTitle?: string | null
  publisher: string
  link: string
  publishedAt: number
  relatedTickers: string[]
  imageUrl?: string | null
}

export interface CurrencyData {
  currencies: CurrencyRate[]
  error?: string
}

export interface CurrencyRate {
  fromCurrency: string
  toCurrency: string
  name: string
  bidPrice: number
  askPrice: number
  highPrice: number
  lowPrice: number
  updatedAtTimestamp: number
}
