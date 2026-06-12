// Demo fixture of the deterministic payload (contract v1). The real numbers
// will come from modules/portfolio when the deterministic core (Bloco 2 of the
// backend V1 handoff) lands via Spec Kit — this file feeds the ficha until
// then and must conform to docs/contracts/deterministic-payload.md exactly.
// Aggregates are COMPUTED from the position list below, never hand-written,
// so the screen is internally consistent by construction.
import type {
  ConcentrationAlert,
  FgcAnalysis,
  MaturityCalendarBucket,
  PortfolioAllocationBucket,
  PortfolioAssetClass,
  PortfolioDeterministicPayload,
  PortfolioPolicyTarget,
  PortfolioPosition,
} from '@/modules/portfolio'
import { ASSET_CLASS_LABELS } from './format'

export interface DemoClientRef {
  id: string
  name: string
  cpf?: string | null
}

const SNAPSHOT_AGE_DAYS = 6
const STALE_AFTER_DAYS = 30

/** FGC demo defaults — parameterized in workspace config when Bloco 2 lands. */
export const DEMO_FGC_PER_INSTITUTION_LIMIT_CENTS = 250_000_00
export const DEMO_FGC_GLOBAL_LIMIT_CENTS = 1_000_000_00

/** Conservative demo thresholds — final numbers come from the EQI onboarding. */
export const DEMO_THRESHOLDS = {
  issuerMaxWeight: 0.2,
  assetClassMaxWeight: 0.5,
  institutionMaxWeight: 0.4,
}

const DEMO_POLICY_TARGETS: Array<{ assetClass: PortfolioAssetClass; targetWeight: number }> = [
  { assetClass: 'FIXED_INCOME', targetWeight: 0.35 },
  { assetClass: 'TREASURY', targetWeight: 0.25 },
  { assetClass: 'FUND', targetWeight: 0.15 },
  { assetClass: 'EQUITY', targetWeight: 0.15 },
  { assetClass: 'FII', targetWeight: 0.05 },
  { assetClass: 'CASH', targetWeight: 0.05 },
]

type RawPosition = Omit<PortfolioPosition, 'id' | 'weight' | 'grossValueCents'> & {
  grossValueK: number
}

const RAW_POSITIONS: RawPosition[] = [
  {
    institution: 'Banco Horizonte',
    assetClass: 'FIXED_INCOME',
    issuer: 'Banco Horizonte',
    assetLabel: 'CDB Banco Horizonte 110% CDI',
    grossValueK: 320,
    maturityDate: '2027-03-15',
    indexer: 'CDI',
    rate: '110% do CDI',
  },
  {
    institution: 'Banco Horizonte',
    assetClass: 'FIXED_INCOME',
    issuer: 'Banco Horizonte',
    assetLabel: 'CDB Banco Horizonte IPCA+',
    grossValueK: 150,
    maturityDate: '2028-09-20',
    indexer: 'IPCA',
    rate: 'IPCA + 6,20% a.a.',
  },
  {
    institution: 'Banco Daycoval',
    assetClass: 'FIXED_INCOME',
    issuer: 'Banco Daycoval',
    assetLabel: 'CDB Daycoval 104% CDI',
    grossValueK: 180,
    maturityDate: '2026-11-10',
    indexer: 'CDI',
    rate: '104% do CDI',
  },
  {
    institution: 'Banco Inter',
    assetClass: 'FIXED_INCOME',
    issuer: 'Banco Inter',
    assetLabel: 'LCI Inter 96% CDI',
    grossValueK: 120,
    maturityDate: '2027-06-18',
    indexer: 'CDI',
    rate: '96% do CDI',
  },
  {
    institution: 'XP Investimentos',
    assetClass: 'TREASURY',
    issuer: 'Tesouro Nacional',
    assetLabel: 'Tesouro IPCA+ 2029',
    grossValueK: 210,
    maturityDate: '2029-05-15',
    indexer: 'IPCA',
    rate: 'IPCA + 6,05% a.a.',
  },
  {
    institution: 'XP Investimentos',
    assetClass: 'TREASURY',
    issuer: 'Tesouro Nacional',
    assetLabel: 'Tesouro Selic 2027',
    grossValueK: 140,
    maturityDate: '2027-03-01',
    indexer: 'SELIC',
    rate: 'Selic + 0,10% a.a.',
  },
  {
    institution: 'Itaú',
    assetClass: 'FUND',
    issuer: 'Itaú Asset',
    assetLabel: 'Itaú Multimercado Global',
    grossValueK: 160,
  },
  {
    institution: 'Itaú',
    assetClass: 'FUND',
    issuer: 'Itaú Asset',
    assetLabel: 'Itaú Renda Fixa DI',
    grossValueK: 90,
  },
  {
    institution: 'XP Investimentos',
    assetClass: 'EQUITY',
    ticker: 'PETR4',
    issuer: 'Petrobras',
    assetLabel: 'Petrobras PN',
    grossValueK: 85,
    quantity: 2200,
  },
  {
    institution: 'XP Investimentos',
    assetClass: 'EQUITY',
    ticker: 'VALE3',
    issuer: 'Vale',
    assetLabel: 'Vale ON',
    grossValueK: 75,
    quantity: 1240,
  },
  {
    institution: 'XP Investimentos',
    assetClass: 'EQUITY',
    ticker: 'ITUB4',
    issuer: 'Itaú Unibanco',
    assetLabel: 'Itaú Unibanco PN',
    grossValueK: 60,
    quantity: 1650,
  },
  {
    institution: 'XP Investimentos',
    assetClass: 'FII',
    ticker: 'HGLG11',
    issuer: 'CSHG Logística',
    assetLabel: 'CSHG Logística FII',
    grossValueK: 70,
    quantity: 430,
  },
  {
    institution: 'Itaú',
    assetClass: 'CASH',
    issuer: 'Itaú Unibanco',
    assetLabel: 'Saldo em conta',
    grossValueK: 25,
  },
]

function slug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function groupBuckets(
  positions: PortfolioPosition[],
  totalCents: number,
  key: (p: PortfolioPosition) => string,
  metricPrefix: string,
  label: (p: PortfolioPosition) => string
): PortfolioAllocationBucket[] {
  const groups = new Map<string, { label: string; valueCents: number; count: number }>()
  for (const position of positions) {
    const k = key(position)
    const group = groups.get(k) ?? { label: label(position), valueCents: 0, count: 0 }
    group.valueCents += position.grossValueCents
    group.count += 1
    groups.set(k, group)
  }
  return Array.from(groups.entries())
    .map(([k, group]) => ({
      metricId: `${metricPrefix}.${slug(k)}`,
      label: group.label,
      valueCents: group.valueCents,
      weight: group.valueCents / totalCents,
      count: group.count,
    }))
    .sort((a, b) => b.valueCents - a.valueCents)
}

/** FGC-eligible = banking fixed income (CDB/LCI/LCA) held at the issuing bank. */
function isFgcEligible(position: PortfolioPosition): boolean {
  return position.assetClass === 'FIXED_INCOME'
}

function computeFgc(positions: PortfolioPosition[], effectiveDate: string): FgcAnalysis {
  const eligible = positions.filter(isFgcEligible)
  const byBank = new Map<string, number>()
  for (const position of eligible) {
    byBank.set(position.institution, (byBank.get(position.institution) ?? 0) + position.grossValueCents)
  }
  const byInstitution = Array.from(byBank.entries())
    .map(([institution, exposureCents]) => {
      const coveredCents = Math.min(exposureCents, DEMO_FGC_PER_INSTITUTION_LIMIT_CENTS)
      return {
        metricId: `fgc.inst.${slug(institution)}`,
        institution,
        exposureCents,
        coveredCents,
        uncoveredCents: exposureCents - coveredCents,
        utilization: exposureCents / DEMO_FGC_PER_INSTITUTION_LIMIT_CENTS,
      }
    })
    .sort((a, b) => b.exposureCents - a.exposureCents)

  return {
    config: {
      perInstitutionLimitCents: DEMO_FGC_PER_INSTITUTION_LIMIT_CENTS,
      globalLimitCents: DEMO_FGC_GLOBAL_LIMIT_CENTS,
      effectiveDate,
      source: 'demo_default',
    },
    byInstitution,
    totals: byInstitution.reduce(
      (acc, item) => ({
        exposureCents: acc.exposureCents + item.exposureCents,
        coveredCents: acc.coveredCents + item.coveredCents,
        uncoveredCents: acc.uncoveredCents + item.uncoveredCents,
      }),
      { exposureCents: 0, coveredCents: 0, uncoveredCents: 0 }
    ),
  }
}

function concentrationLevel(weight: number, threshold: number): ConcentrationAlert['level'] {
  if (weight > threshold * 1.25) return 'critical'
  if (weight > threshold) return 'attention'
  return 'info'
}

function computeConcentration(
  allocations: {
    byAssetClass: PortfolioAllocationBucket[]
    byInstitution: PortfolioAllocationBucket[]
    byIssuer: PortfolioAllocationBucket[]
  },
  totalCents: number,
  sovereignIssuers: Set<string>
): ConcentrationAlert[] {
  const alerts: ConcentrationAlert[] = []
  const check = (
    buckets: PortfolioAllocationBucket[],
    kind: ConcentrationAlert['kind'],
    threshold: number
  ) => {
    for (const bucket of buckets) {
      // Sovereign risk is outside the issuer-concentration ruler (CDB/LCI logic).
      if (kind === 'issuer' && sovereignIssuers.has(bucket.label)) continue
      // Surface anything above 90% of the threshold so "almost there" is visible.
      if (bucket.weight <= threshold * 0.9) continue
      const breached = bucket.weight > threshold
      alerts.push({
        metricId: `conc.${kind}.${slug(bucket.label)}`,
        level: breached ? concentrationLevel(bucket.weight, threshold) : 'info',
        kind,
        label: bucket.label,
        weight: bucket.weight,
        threshold,
        ...(breached && {
          excessValueCents: Math.round((bucket.weight - threshold) * totalCents),
        }),
      })
    }
  }
  check(allocations.byIssuer, 'issuer', DEMO_THRESHOLDS.issuerMaxWeight)
  check(allocations.byInstitution, 'institution', DEMO_THRESHOLDS.institutionMaxWeight)
  check(allocations.byAssetClass, 'asset_class', DEMO_THRESHOLDS.assetClassMaxWeight)
  const order = { critical: 0, attention: 1, info: 2 }
  return alerts.sort((a, b) => order[a.level] - order[b.level])
}

function computePolicy(
  positions: PortfolioPosition[],
  totalCents: number
): PortfolioPolicyTarget[] {
  const currentByClass = new Map<PortfolioAssetClass, number>()
  for (const position of positions) {
    currentByClass.set(
      position.assetClass,
      (currentByClass.get(position.assetClass) ?? 0) + position.grossValueCents
    )
  }
  return DEMO_POLICY_TARGETS.map(({ assetClass, targetWeight }) => {
    const currentCents = currentByClass.get(assetClass) ?? 0
    const currentWeight = currentCents / totalCents
    // Positive delta = above target; the UI labels direction, the number is arithmetic.
    const deltaWeight = currentWeight - targetWeight
    return {
      metricId: `policy.${slug(assetClass)}`,
      assetClass,
      targetWeight,
      currentWeight,
      deltaWeight,
      deltaValueCents: Math.round(deltaWeight * totalCents),
    }
  })
}

function computeMaturityCalendar(positions: PortfolioPosition[]): MaturityCalendarBucket[] {
  const byMonth = new Map<string, { valueCents: number; count: number }>()
  for (const position of positions) {
    if (!position.maturityDate) continue
    const month = position.maturityDate.slice(0, 7)
    const bucket = byMonth.get(month) ?? { valueCents: 0, count: 0 }
    bucket.valueCents += position.grossValueCents
    bucket.count += 1
    byMonth.set(month, bucket)
  }
  return Array.from(byMonth.entries())
    .map(([month, bucket]) => ({ metricId: `maturity.${month}`, month, ...bucket }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

function maskCpf(cpf: string | null | undefined): string | undefined {
  if (!cpf || cpf.length !== 11) return undefined
  return `•••.•••.•${cpf.slice(7, 9)}-${cpf.slice(9)}`
}

export function buildDemoPayload(client: DemoClientRef, scope: { workspaceId: string; memberId: string }): PortfolioDeterministicPayload {
  const now = new Date()
  const importedAt = new Date(now.getTime() - SNAPSHOT_AGE_DAYS * 24 * 60 * 60 * 1000)
  const valuationDate = importedAt.toISOString().slice(0, 10)

  const totalCents = RAW_POSITIONS.reduce((sum, raw) => sum + raw.grossValueK * 100_000, 0)
  const positions: PortfolioPosition[] = RAW_POSITIONS.map((raw, index) => {
    const { grossValueK, ...rest } = raw
    const grossValueCents = grossValueK * 100_000
    return {
      id: `pos-demo-${index + 1}`,
      ...rest,
      grossValueCents,
      weight: grossValueCents / totalCents,
    }
  })

  const allocations = {
    byAssetClass: groupBuckets(
      positions,
      totalCents,
      (p) => p.assetClass,
      'alloc.class',
      (p) => ASSET_CLASS_LABELS[p.assetClass]
    ),
    byInstitution: groupBuckets(
      positions,
      totalCents,
      (p) => p.institution,
      'alloc.inst',
      (p) => p.institution
    ),
    byIssuer: groupBuckets(
      positions,
      totalCents,
      (p) => p.issuer ?? p.assetLabel,
      'alloc.issuer',
      (p) => p.issuer ?? p.assetLabel
    ),
  }

  const fgc = computeFgc(positions, valuationDate)
  const policyTargets = computePolicy(positions, totalCents)
  const maturityCalendar = computeMaturityCalendar(positions)
  const sovereignIssuers = new Set(
    positions
      .filter((position) => position.assetClass === 'TREASURY' && position.issuer)
      .map((position) => position.issuer as string)
  )
  const concentrationAlerts = computeConcentration(allocations, totalCents, sovereignIssuers)

  const allowedMetricIds = [
    ...allocations.byAssetClass,
    ...allocations.byInstitution,
    ...allocations.byIssuer,
  ]
    .map((bucket) => bucket.metricId)
    .concat(fgc.byInstitution.map((item) => item.metricId))
    .concat(policyTargets.map((target) => target.metricId))
    .concat(maturityCalendar.map((bucket) => bucket.metricId))
    .concat(concentrationAlerts.map((alert) => alert.metricId))

  return {
    schemaVersion: 'portfolio-deterministic-payload.v1',
    payloadId: `demo-${client.id}`,
    generatedAt: now.toISOString(),
    locale: 'pt-BR',
    scope,
    client: {
      id: client.id,
      label: client.name,
      cpfMasked: maskCpf(client.cpf),
    },
    snapshot: {
      id: `snap-demo-${client.id}`,
      importedAt: importedAt.toISOString(),
      valuationDate,
      ageDays: SNAPSHOT_AGE_DAYS,
      stale: SNAPSHOT_AGE_DAYS > STALE_AFTER_DAYS,
      sourceFile: {
        name: 'carteira-padrao-bull.xlsx',
        sha256: 'd3m0f1x7ur3000000000000000000000000000000000000000000000000cafe',
      },
    },
    provenance: {
      source: 'snapshot',
      ts: importedAt.toISOString(),
      stale: SNAPSHOT_AGE_DAYS > STALE_AFTER_DAYS,
    },
    totals: {
      grossValueCents: totalCents,
      netValueCents: totalCents,
      positionCount: positions.length,
      institutionCount: allocations.byInstitution.length,
    },
    positions,
    allocations,
    fgc,
    policy: { scope: 'client', targets: policyTargets },
    maturityCalendar,
    concentration: {
      thresholds: DEMO_THRESHOLDS,
      alerts: concentrationAlerts,
    },
    narrativeGuardrails: {
      forbidRecommendation: true,
      requireDisclaimer: true,
      allowedMetricIds,
    },
  }
}
