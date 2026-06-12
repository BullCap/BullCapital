import { notFound, redirect } from 'next/navigation'
import { getScope } from '@/modules/user'
import { getClient } from '@/modules/portfolio'
import AppShell from '@/components/navigation/AppShell'
import { buildDemoPayload } from '@/components/clients/demo-payload'
import { ClientHero } from '@/components/clients/ClientHero'
import { AllocationSection } from '@/components/clients/AllocationSection'
import { FgcSection } from '@/components/clients/FgcSection'
import { PolicyDeltaSection } from '@/components/clients/PolicyDeltaSection'
import { MaturitySection } from '@/components/clients/MaturitySection'
import { ConcentrationSection } from '@/components/clients/ConcentrationSection'
import { PositionComparator } from '@/components/clients/PositionComparator'
import { NarrationPanel } from '@/components/clients/NarrationPanel'

interface ClientPageProps {
  params: Promise<{ id: string }>
}

export default async function ClientFichaPage({ params }: ClientPageProps) {
  const scope = await getScope()
  if (!scope) redirect('/auth/sign-in')

  const { id } = await params
  const client = await getClient(scope, id)
  if (!client) notFound()

  // Carteira demo conforme o contrato v1 — substituída pelo núcleo
  // determinístico (Bloco 2) quando o domínio de snapshots entrar.
  const payload = buildDemoPayload(
    { id: client.id, name: client.name, cpf: client.cpf },
    { workspaceId: scope.workspaceId, memberId: scope.memberId }
  )

  return (
    <AppShell active="clients" contentClassName="md:max-w-none xl:max-w-[1280px]">
      <div className="space-y-6">
        <p className="bull-chip min-h-7 w-fit px-3 py-1 text-[11px] text-[#ead9ad]">
          Dados de demonstração — o import real entra com o núcleo determinístico
        </p>

        <ClientHero payload={payload} />

        <AllocationSection allocations={payload.allocations} />

        <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
          <FgcSection fgc={payload.fgc} />
          <PolicyDeltaSection policy={payload.policy} clientId={client.id} />
        </div>

        <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
          <MaturitySection calendar={payload.maturityCalendar} />
          <ConcentrationSection concentration={payload.concentration} />
        </div>

        <PositionComparator positions={payload.positions} />

        <NarrationPanel payload={payload} />
      </div>
    </AppShell>
  )
}
