import { notFound, redirect } from 'next/navigation'
import { getScope } from '@/modules/user'
import { getClient } from '@/modules/portfolio'
import AppShell from '@/components/navigation/AppShell'
import { ImportFlow } from '@/components/clients/ImportFlow'

interface ImportPageProps {
  params: Promise<{ id: string }>
}

export default async function ClientImportPage({ params }: ImportPageProps) {
  const scope = await getScope()
  if (!scope) redirect('/auth/sign-in')

  const { id } = await params
  const client = await getClient(scope, id)
  if (!client) notFound()

  return (
    <AppShell active="clients" contentClassName="md:max-w-none xl:max-w-[860px]">
      <header className="bull-page-header">
        <div>
          <p className="bull-eyebrow">Import de carteira</p>
          <h1 className="bull-page-title mt-2">{client.name}</h1>
          <p className="bull-page-subtitle mt-1">
            Planilha padrão Bull → validação estrutural → snapshot imutável.
          </p>
        </div>
      </header>

      <ImportFlow clientId={client.id} clientName={client.name} />
    </AppShell>
  )
}
