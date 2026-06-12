import { redirect } from 'next/navigation'
import { getScope } from '@/modules/user'
import AppShell from '@/components/navigation/AppShell'
import { WorkspaceSettings } from '@/components/clients/WorkspaceSettings'

export default async function SettingsPage() {
  const scope = await getScope()
  if (!scope) redirect('/auth/sign-in')

  return (
    <AppShell active="clients" contentClassName="md:max-w-none xl:max-w-[860px]">
      <header className="bull-page-header">
        <div>
          <p className="bull-eyebrow">Workspace</p>
          <h1 className="bull-page-title mt-2">Configurações</h1>
          <p className="bull-page-subtitle mt-1">
            Réguas de risco, parâmetros do FGC e preferências do assessor — tudo explícito, nada
            inferido.
          </p>
        </div>
      </header>

      <WorkspaceSettings />
    </AppShell>
  )
}
