'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { Building2, Globe, Users, Briefcase, ChevronDown, ChevronUp } from 'lucide-react'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'

interface AssetProfileCardProps {
  ticker: string
  profile: {
    longBusinessSummary?: string | null
    sector?: string | null
    industry?: string | null
    website?: string | null
    fullTimeEmployees?: number | null
  } | null
}

// Local high-fidelity Portuguese descriptions for major B3 stocks to ensure native-like pt-BR feel
const LOCAL_SUMMARIES: Record<string, string> = {
  PETR4: 'A Petróleo Brasileiro S.A. (Petrobras) é uma das maiores empresas de energia de controle estatal do mundo. Atua na exploração e produção de petróleo e gás natural, refino, transporte e comercialização no Brasil e no exterior. Destaca-se por sua liderança tecnológica na exploração de águas ultraprofundas e no Pré-sal.',
  PETR3: 'A Petróleo Brasileiro S.A. (Petrobras) é uma das maiores empresas de energia de controle estatal do mundo. Atua na exploração e produção de petróleo e gás natural, refino, transporte e comercialização no Brasil e no exterior. Destaca-se por sua liderança tecnológica na exploração de águas ultraprofundas e no Pré-sal.',
  VALE3: 'A Vale S.A. é uma das maiores mineradoras do mundo e a maior produtora global de minério de ferro e pelotas de alta qualidade. A companhia também atua na exploração de metais básicos como níquel e cobre, além de operar uma complexa e integrada rede de logística no Brasil e no mundo, abrangendo ferrovias e portos corporativos.',
  ITUB4: 'O Itaú Unibanco Holding S.A. é o maior banco privado do Brasil e um dos maiores conglomerados financeiros do Hemisfério Sul. Oferece serviços de conta corrente, investimentos, cartões, seguros e crédito para milhões de clientes individuais e corporativos em diversos países das Américas e Europa.',
  ABEV3: 'A Ambev S.A. é a maior cervejaria da América Latina e parte da gigante global Anheuser-Busch InBev. Produz e distribui cervejas (como Skol, Brahma, Antarctica, Stella Artois e Corona), refrigerantes e bebidas não alcoólicas, operando com forte escala de distribuição comercial e liderança de mercado.',
  BBAS3: 'O Banco do Brasil S.A. é a instituição financeira mais antiga do Brasil, com controle acionário estatal. Destaca-se como o maior parceiro de crédito agrícola e financiamento de agronegócio do país, além de oferecer serviços de varejo bancário, corporativo e investimento completos.',
  WEGE3: 'A WEG S.A. é uma multinacional brasileira líder global na fabricação de motores elétricos, geradores, transformadores, tintas industriais e soluções de automação e energia renovável. Destaca-se por sua altíssima eficiência operacional e penetração comercial em mais de 100 países.',
  SBSP3: 'A Companhia de Saneamento Básico do Estado de São Paulo (Sabesp) é a maior empresa de saneamento ambiental das Américas em população atendida. Presta serviços de abastecimento de água e tratamento de esgoto para centenas de municípios paulistas, atendendo cerca de 30 milhões de pessoas.',
  B3SA3: 'A B3 S.A. (Brasil, Bolsa, Balcão) é a bolsa de valores oficial do Brasil, com sede em São Paulo. É uma das maiores empresas de infraestrutura de mercado financeiro do mundo, atuando na negociação, custódia e liquidação de ações, derivativos, títulos públicos e privados.'
}

export default function AssetProfileCard({ ticker, profile }: AssetProfileCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Determine description with local fallback first, then yfinance profile, then general notice
  const uppercaseTicker = ticker.toUpperCase()
  const customSummary = LOCAL_SUMMARIES[uppercaseTicker]
  const summaryText = customSummary || profile?.longBusinessSummary || 'Sem descrição institucional detalhada disponível para este ativo no momento.'

  const sector = profile?.sector || 'n/d'
  const industry = profile?.industry || 'n/d'
  const website = profile?.website || null
  const employees = profile?.fullTimeEmployees || null

  const isLongDescription = summaryText.length > 280

  return (
    <section className="bull-panel p-5 relative overflow-hidden">
      <GlassHighlight widthPercent={60} />

      <p className="bull-eyebrow mb-4">Sobre a empresa</p>

      {/* Grid structure for corporate metadata */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Setor */}
        <div className="flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3">
          <Briefcase size={16} className="text-[#8B5CF6]/60 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-[#F4F0FF]/35">Setor</p>
            <p className="mt-0.5 truncate text-xs font-semibold text-[#F4F0FF]/85">{sector}</p>
          </div>
        </div>

        {/* Indústria */}
        <div className="flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3">
          <Building2 size={16} className="text-[#8B5CF6]/60 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-[#F4F0FF]/35">Indústria</p>
            <p className="mt-0.5 truncate text-xs font-semibold text-[#F4F0FF]/85">{industry}</p>
          </div>
        </div>

        {/* Funcionários */}
        <div className="flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3">
          <Users size={16} className="text-[#8B5CF6]/60 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-[#F4F0FF]/35">Funcionários</p>
            <p className="mt-0.5 truncate text-xs font-semibold text-[#F4F0FF]/85">
              {employees ? employees.toLocaleString('pt-BR') : 'n/d'}
            </p>
          </div>
        </div>

        {/* Website Link */}
        <div className="flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3">
          <Globe size={16} className="text-[#8B5CF6]/60 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-[#F4F0FF]/35">Website</p>
            {website ? (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 block truncate text-xs font-semibold text-[#8B5CF6] hover:underline"
              >
                {website.replace(/^https?:\/\/(www\.)?/, '')}
              </a>
            ) : (
              <p className="mt-0.5 truncate text-xs font-semibold text-[#F4F0FF]/50">n/d</p>
            )}
          </div>
        </div>
      </div>

      {/* Description text area */}
      <div className="relative">
        <motion.div
          animate={{ height: isLongDescription && !isExpanded ? '4.5rem' : 'auto' }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <p className="text-sm leading-relaxed text-[#F4F0FF]/70 whitespace-pre-line">
            {summaryText}
          </p>
        </motion.div>

        {/* Shading/Fade layer for collapsed state */}
        {isLongDescription && !isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#1A1625] to-transparent pointer-events-none" />
        )}
      </div>

      {/* Accordion Toggle trigger */}
      {isLongDescription && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#C4B5FD] hover:text-white transition duration-300"
          >
            {isExpanded ? (
              <>
                Recolher descrição
                <ChevronUp size={13} />
              </>
            ) : (
              <>
                Expandir descrição
                <ChevronDown size={13} />
              </>
            )}
          </button>
        </div>
      )}
    </section>
  )
}
