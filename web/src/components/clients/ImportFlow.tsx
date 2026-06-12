'use client'

// Fluxo de import da planilha padrão Bull — UI completa do contrato do parser
// (A1 do Bloco 2): upload → validação estrutural → relatório de erros linha a
// linha → confirmação. A validação real roda no servidor quando o parser
// entrar; aqui o resultado é simulado para fechar o fluxo de produto.
import { useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, FileSpreadsheet, FileUp, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DisclaimerNote } from './atoms'

type ImportStep = 'upload' | 'validating' | 'report' | 'done'

interface RowIssue {
  line: number
  column: string
  problem: string
  fix: string
}

const MOCK_ISSUES: RowIssue[] = [
  {
    line: 7,
    column: 'CPF',
    problem: 'CPF com 10 dígitos ("123.456.789-0")',
    fix: 'Complete o dígito verificador — o CPF é a chave do cálculo de FGC.',
  },
  {
    line: 12,
    column: 'Classe',
    problem: 'Classe "CRIPTO" não faz parte da taxonomia da V1',
    fix: 'Produtos fora do escopo (cripto, COE, derivativos) devem ficar fora da planilha.',
  },
  {
    line: 18,
    column: 'Valor',
    problem: 'Valor não numérico ("R$ 12.500,00 aprox")',
    fix: 'Use apenas o número na coluna Valor; remova texto livre.',
  },
]

const MOCK_VALID_ROWS = 23

interface ImportFlowProps {
  clientId: string
  clientName: string
}

export function ImportFlow({ clientId, clientName }: ImportFlowProps) {
  const [step, setStep] = useState<ImportStep>('upload')
  const [fileName, setFileName] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File | undefined) => {
    if (!file) return
    setFileName(file.name)
    setStep('validating')
    setTimeout(() => setStep('report'), 1400)
  }

  const reset = () => {
    setFileName(null)
    setStep('upload')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-5">
      <Link
        href={`/clients/${clientId}`}
        className="inline-flex items-center gap-1.5 text-[12px] text-starlight/45 transition-colors hover:text-starlight/75"
      >
        <ArrowLeft size={13} />
        Voltar para a ficha de {clientName}
      </Link>

      {step === 'upload' && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            handleFile(event.dataTransfer.files[0])
          }}
          className={cn(
            'bull-card-calm flex w-full flex-col items-center px-6 py-16 text-center transition-colors duration-300',
            dragging && 'border-amethyst/40 bg-amethyst/[0.05]'
          )}
        >
          <span className="flex size-14 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03] text-starlight/45">
            <FileSpreadsheet size={24} />
          </span>
          <p className="mt-5 font-serif text-xl text-starlight/85">
            Solte a planilha padrão Bull aqui
          </p>
          <p className="mt-2 max-w-md text-[13px] leading-6 text-starlight/45">
            Formato .xlsx com as posições por instituição. Cada import gera um snapshot imutável —
            a carteira corrente é sempre o snapshot mais recente.
          </p>
          <span className="bull-action-primary mt-6">
            <FileUp size={15} />
            Selecionar arquivo
          </span>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
        </button>
      )}

      {step === 'validating' && (
        <div className="bull-card-calm flex flex-col items-center px-6 py-16 text-center">
          <span className="size-2 animate-pulse rounded-full bg-amethyst-light" />
          <p className="mt-5 font-serif text-xl text-starlight/85">Validando {fileName}</p>
          <p className="mt-2 text-[13px] text-starlight/45">
            Conferindo colunas obrigatórias, tipos e normalização (ticker, classe, emissor, CPF,
            datas, valores).
          </p>
        </div>
      )}

      {step === 'report' && (
        <div className="bull-card-calm p-6 md:p-8">
          <p className="bull-eyebrow">Relatório de validação</p>
          <h2 className="mt-1.5 font-serif text-xl text-starlight md:text-2xl">
            {MOCK_VALID_ROWS} linhas válidas · {MOCK_ISSUES.length} para corrigir
          </h2>
          <p className="mt-1.5 text-[13px] leading-6 text-starlight/45">
            {fileName} — linhas com erro ficam fora do snapshot; corrija na planilha e re-importe
            quando quiser.
          </p>

          <ul className="mt-6 space-y-3">
            {MOCK_ISSUES.map((issue) => (
              <li
                key={issue.line}
                className="rounded-xl border border-[#d0b982]/15 bg-[#d0b982]/[0.05] px-4 py-3.5"
              >
                <p className="text-[13px] text-starlight/80">
                  <span className="font-medium text-[#ead9ad]">Linha {issue.line}</span>
                  <span className="mx-2 text-starlight/25">·</span>
                  <span className="text-[11px] uppercase tracking-[0.1em] text-starlight/40">
                    {issue.column}
                  </span>
                </p>
                <p className="mt-1 text-[13px] text-starlight/65">{issue.problem}</p>
                <p className="mt-1 text-[12px] text-starlight/40">{issue.fix}</p>
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-white/[0.05] pt-5">
            <button type="button" onClick={() => setStep('done')} className="bull-action-primary">
              <CheckCircle2 size={15} />
              Importar {MOCK_VALID_ROWS} posições válidas
            </button>
            <button type="button" onClick={reset} className="bull-action">
              <RotateCcw size={14} />
              Trocar arquivo
            </button>
            <p className="ml-auto text-[11px] text-starlight/35">
              Prévia do contrato do parser — persistência entra com o núcleo determinístico
            </p>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="bull-card-calm flex flex-col items-center px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl border border-[#7fb59a]/20 bg-[#7fb59a]/[0.08] text-[#b6dcc7]">
            <CheckCircle2 size={22} />
          </span>
          <p className="mt-5 font-serif text-xl text-starlight/85">Snapshot criado</p>
          <p className="mt-2 max-w-md text-[13px] leading-6 text-starlight/45">
            {MOCK_VALID_ROWS} posições consolidadas para {clientName}. A ficha já reflete o novo
            snapshot, com a idade do dado rotulada em cada leitura.
          </p>
          <Link href={`/clients/${clientId}`} className="bull-action-primary mt-6">
            Abrir ficha consolidada
          </Link>
        </div>
      )}

      <DisclaimerNote />
    </div>
  )
}
