import { notFound, redirect } from 'next/navigation'
import { getScope } from '@/modules/user'
import { getClient } from '@/modules/portfolio'
import AppShell from '@/components/navigation/AppShell'
import { PolicyEditor } from '@/components/clients/PolicyEditor'

interface PolicyPageProps {
  params: Promise<{ id: string }>
}

export default async function ClientPolicyPage({ params }: PolicyPageProps) {
  const scope = await getScope()
  if (!scope) redirect('/auth/sign-in')

  const { id } = await params
  const client = await getClient(scope, id)
  if (!client) notFound()

  return (
    <AppShell active="clients" contentClassName="md:max-w-none xl:max-w-[860px]">
      <header className="bull-page-header">
        <div>
          <p className="bull-eyebrow">Política-alvo</p>
          <h1 className="bull-page-title mt-2">{client.name}</h1>
          <p className="bull-page-subtitle mt-1">
            Defina a alocação planejada — o delta na ficha é calculado contra estes alvos.
          </p>
        </div>
      </header>

      <PolicyEditor clientId={client.id} clientName={client.name} />
    </AppShell>
  )
}
