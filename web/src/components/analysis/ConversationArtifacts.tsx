import type { ComponentType } from 'react'
import { ArrowRight, GitCompare, Grid3X3, Route, Table2 } from 'lucide-react'
import type {
  ConversationArtifact,
  ConversationFlowArtifact,
  ConversationMetricGridArtifact,
  ConversationTableArtifact,
} from '@/lib/actions/conversation'

interface ConversationArtifactsProps {
  artifacts: ConversationArtifact[]
}

import { PriceChartArtifact } from './artifacts/PriceChartArtifact'
import { RadarChartArtifact } from './artifacts/RadarChartArtifact'
import { BarChartArtifact } from './artifacts/BarChartArtifact'

interface ConversationArtifactsProps {
  artifacts: ConversationArtifact[]
  ticker?: string
}

const TONE_CLASSES = {
  positive: 'border-[#7fb59a]/25 bg-[#7fb59a]/8 text-starlight/85',
  negative: 'border-[#c98c9a]/25 bg-[#c98c9a]/8 text-starlight/85',
  neutral: 'border-white/[0.08] bg-white/[0.04] text-starlight/80',
}

function ArtifactHeader({
  eyebrow,
  icon: Icon,
  title,
}: {
  eyebrow?: string
  icon: ComponentType<{ size?: number; className?: string }>
  title?: string
}) {
  if (!title && !eyebrow) return null

  return (
    <div className="mb-3 flex items-start gap-2.5">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-starlight/55">
        <Icon size={14} />
      </span>
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-starlight/40">
            {eyebrow}
          </p>
        )}
        {title && <h4 className="text-sm font-semibold leading-5 text-starlight">{title}</h4>}
      </div>
    </div>
  )
}

function TableArtifact({ artifact }: { artifact: ConversationTableArtifact }) {
  const Icon = artifact.template === 'comparison' ? GitCompare : Table2

  return (
    <section className="rounded-[1.1rem] border border-white/[0.07] bg-black/20 p-3.5 shadow-[inset_0_1px_16px_rgba(0,0,0,0.22)]">
      <ArtifactHeader eyebrow={artifact.eyebrow} icon={Icon} title={artifact.title} />
      <div className="bull-scroll overflow-x-auto rounded-xl border border-white/[0.06]">
        <table className="min-w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-white/[0.045] text-[#F4F0FF]/62">
              {artifact.columns.map((column, index) => (
                <th
                  key={`${column}-${index}`}
                  className="whitespace-nowrap border-b border-white/[0.06] px-3 py-2.5 font-semibold"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {artifact.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-white/[0.045] last:border-0">
                {artifact.columns.map((column, columnIndex) => (
                  <td
                     key={`${column}-${rowIndex}-${columnIndex}`}
                    className="min-w-[9rem] px-3 py-2.5 align-top leading-5 text-[#F4F0FF]/75 first:font-semibold first:text-[#F4F0FF]/90"
                  >
                    {row[columnIndex] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {artifact.note && <p className="mt-2.5 text-xs leading-5 text-[#F4F0FF]/45">{artifact.note}</p>}
    </section>
  )
}

function FlowArtifact({ artifact }: { artifact: ConversationFlowArtifact }) {
  return (
    <section className="rounded-[1.1rem] border border-white/[0.07] bg-black/20 p-3.5 shadow-[inset_0_1px_16px_rgba(0,0,0,0.22)]">
      <ArtifactHeader eyebrow={artifact.eyebrow} icon={Route} title={artifact.title} />
      <div className="grid gap-2.5">
        {artifact.steps.map((step, index) => (
          <div key={`${step}-${index}`} className="flex items-center gap-2.5">
            <div className="flex min-h-11 flex-1 items-center rounded-2xl border border-white/[0.07] bg-white/[0.035] px-3 py-2 text-xs font-medium leading-5 text-[#F4F0FF]/82">
              <span className="mr-2 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[10px] font-semibold text-starlight/55">
                {index + 1}
              </span>
              {step}
            </div>
            {index < artifact.steps.length - 1 && (
              <ArrowRight size={14} className="hidden shrink-0 text-starlight/35 sm:block" />
            )}
          </div>
        ))}
      </div>
      {artifact.note && <p className="mt-2.5 text-xs leading-5 text-[#F4F0FF]/45">{artifact.note}</p>}
    </section>
  )
}

function MetricGridArtifact({ artifact }: { artifact: ConversationMetricGridArtifact }) {
  return (
    <section className="rounded-[1.1rem] border border-white/[0.07] bg-black/20 p-3.5 shadow-[inset_0_1px_16px_rgba(0,0,0,0.22)]">
      <ArtifactHeader eyebrow={artifact.eyebrow} icon={Grid3X3} title={artifact.title} />
      <div className="grid gap-2 sm:grid-cols-2">
        {artifact.metrics.map((metric, index) => (
          <div
            key={`${metric.label}-${index}`}
            className={`rounded-2xl border px-3 py-2.5 ${TONE_CLASSES[metric.tone ?? 'neutral']}`}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-65">
              {metric.label}
            </p>
            <p className="mt-1 text-sm font-semibold leading-5">{metric.value}</p>
            {metric.detail && <p className="mt-1 text-xs leading-5 opacity-70">{metric.detail}</p>}
          </div>
        ))}
      </div>
      {artifact.note && <p className="mt-2.5 text-xs leading-5 text-[#F4F0FF]/45">{artifact.note}</p>}
    </section>
  )
}

export function ConversationArtifacts({ artifacts, ticker }: ConversationArtifactsProps) {
  if (!artifacts.length) return null

  return (
    <div className="mt-4 grid gap-3">
      {artifacts.map((artifact, index) => {
        if (artifact.template === 'table' || artifact.template === 'comparison') {
          return <TableArtifact key={`${artifact.template}-${index}`} artifact={artifact} />
        }
        if (artifact.template === 'flow') {
          return <FlowArtifact key={`${artifact.template}-${index}`} artifact={artifact} />
        }
        if (artifact.template === 'metric_grid') {
          return <MetricGridArtifact key={`${artifact.template}-${index}`} artifact={artifact} />
        }
        if (artifact.template === 'price_chart') {
          const tickerToUse = ticker ?? 'PETR4'
          return (
            <PriceChartArtifact
              key={`${artifact.template}-${index}`}
              ticker={tickerToUse}
              title={artifact.title}
              range={artifact.range ?? '1mo'}
              chartNote={artifact.chart_note}
            />
          )
        }
        if (artifact.template === 'bar_chart' && artifact.bars?.length) {
          return (
            <BarChartArtifact
              key={`${artifact.template}-${index}`}
              eyebrow={artifact.eyebrow}
              title={artifact.title}
              bars={artifact.bars}
              chartNote={artifact.chart_note}
            />
          )
        }
        if (artifact.template === 'radar_chart' && artifact.radarData) {
          return (
            <RadarChartArtifact
              key={`${artifact.template}-${index}`}
              title={artifact.title}
              chartNote={artifact.chart_note}
              radarData={artifact.radarData}
            />
          )
        }
        return null
      })}
    </div>
  )
}
