export const DETERMINISTIC_PAYLOAD_VERSION = 'portfolio-deterministic-payload.v1' as const

export type DeterministicPayloadVersion = typeof DETERMINISTIC_PAYLOAD_VERSION

export type PortfolioDataSource = 'brapi' | 'bcb_sgs' | 'cache' | 'snapshot'

export type PortfolioAssetClass =
  | 'CASH'
  | 'FIXED_INCOME'
  | 'TREASURY'
  | 'FUND'
  | 'EQUITY'
  | 'FII'
  | 'ETF'
  | 'PENSION'
  | 'COE'
  | 'OTHER'

export interface PortfolioDataProvenance {
  source: PortfolioDataSource
  /** ISO 8601 UTC timestamp from the source/snapshot used in the response. */
  ts: string
  stale: boolean
}

export interface PortfolioDeterministicScope {
  workspaceId: string
  memberId: string
}

export interface PortfolioDeterministicClient {
  id: string
  /** Non-sensitive display label. Raw CPF must never be sent to the AI Service. */
  label: string
  cpfHash?: string
  cpfMasked?: string
}

export interface PortfolioSnapshotReference {
  id: string
  importedAt: string
  /** Date represented by the imported positions, formatted as YYYY-MM-DD. */
  valuationDate: string
  expiresAt?: string
  ageDays: number
  stale: boolean
  sourceFile?: {
    name: string
    sha256: string
  }
}

export interface PortfolioTotals {
  grossValueCents: number
  netValueCents: number
  positionCount: number
  institutionCount: number
}

export interface PortfolioPosition {
  id: string
  institution: string
  assetClass: PortfolioAssetClass
  ticker?: string
  issuer?: string
  assetLabel: string
  grossValueCents: number
  netValueCents?: number
  weight: number
  quantity?: number
  maturityDate?: string
  indexer?: string
  rate?: string
}

export interface PortfolioAllocationBucket {
  metricId: string
  label: string
  valueCents: number
  weight: number
  count?: number
}

export interface PortfolioAllocations {
  byAssetClass: PortfolioAllocationBucket[]
  byInstitution: PortfolioAllocationBucket[]
  byIssuer: PortfolioAllocationBucket[]
}

export type FgcConfigSource = 'workspace_config' | 'system_default' | 'demo_default'

export interface FgcConfig {
  perInstitutionLimitCents: number
  globalLimitCents: number
  effectiveDate: string
  source: FgcConfigSource
}

export interface FgcInstitutionExposure {
  metricId: string
  institution: string
  exposureCents: number
  coveredCents: number
  uncoveredCents: number
  utilization: number
}

export interface FgcTotals {
  exposureCents: number
  coveredCents: number
  uncoveredCents: number
}

export interface FgcAnalysis {
  config: FgcConfig
  byInstitution: FgcInstitutionExposure[]
  totals: FgcTotals
}

export interface PortfolioPolicyTarget {
  metricId: string
  assetClass: PortfolioAssetClass
  targetWeight: number
  currentWeight: number
  deltaWeight: number
  deltaValueCents: number
}

export interface PortfolioPolicyDelta {
  scope: 'workspace' | 'client'
  targets: PortfolioPolicyTarget[]
}

export interface MaturityCalendarBucket {
  metricId: string
  /** Month formatted as YYYY-MM. */
  month: string
  valueCents: number
  count: number
}

export type ConcentrationAlertLevel = 'info' | 'attention' | 'critical'
export type ConcentrationAlertKind = 'issuer' | 'asset_class' | 'institution'

export interface ConcentrationThresholds {
  issuerMaxWeight: number
  assetClassMaxWeight: number
  institutionMaxWeight: number
}

export interface ConcentrationAlert {
  metricId: string
  level: ConcentrationAlertLevel
  kind: ConcentrationAlertKind
  label: string
  weight: number
  threshold: number
  excessValueCents?: number
}

export interface ConcentrationAnalysis {
  thresholds: ConcentrationThresholds
  alerts: ConcentrationAlert[]
}

export interface PortfolioNarrativeGuardrails {
  forbidRecommendation: true
  requireDisclaimer: true
  allowedMetricIds: string[]
}

export interface PortfolioDeterministicPayload {
  schemaVersion: DeterministicPayloadVersion
  payloadId: string
  generatedAt: string
  locale: 'pt-BR'
  scope: PortfolioDeterministicScope
  client: PortfolioDeterministicClient
  snapshot: PortfolioSnapshotReference
  provenance: PortfolioDataProvenance
  totals: PortfolioTotals
  positions: PortfolioPosition[]
  allocations: PortfolioAllocations
  fgc: FgcAnalysis
  policy: PortfolioPolicyDelta | null
  maturityCalendar: MaturityCalendarBucket[]
  concentration: ConcentrationAnalysis
  narrativeGuardrails: PortfolioNarrativeGuardrails
}
