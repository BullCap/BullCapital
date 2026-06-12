import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronRight, Users } from 'lucide-react'
import { getScope } from '@/modules/user'
import { listClients } from '@/modules/portfolio'
import AppShell from '@/components/navigation/AppShell'
import { NewClientForm } from '@/components/clients/NewClientForm'

function maskCpf(cpf: string | null): string | null {
  if (!cpf || cpf.length !== 11) return null
  return `•••.•••.•${cpf.slice(7, 9)}-${cpf.slice(9)}`
}

export default async function ClientsPage() {
  const scope = await getScope()
  if (!scope) redirect('/auth/sign-in')

  const clients = await listClients(scope)

  return (
    <AppShell active="clients" contentClassName="md:max-w-none xl:max-w-[1100px]">
      <header className="bull-page-header">
        <div>
          <p className="bull-eyebrow">Carteiras</p>
          <h1 className="bull-page-title mt-2">Clientes</h1>
          <p className="bull-page-subtitle mt-1">
            {clients.length === 0
              ? 'Cadastre o primeiro cliente para importar a carteira padrão Bull.'
              : `${clients.length} ${clients.length === 1 ? 'cliente ativo' : 'clientes ativos'} no workspace.`}
          </p>
        </div>
      </header>

      <div className="space-y-5">
        <NewClientForm />

        {clients.length === 0 ? (
          <div className="bull-card-calm flex flex-col items-center px-6 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03] text-starlight/40">
              <Users size={20} />
            </span>
            <p className="mt-5 font-serif text-xl text-starlight/80">Nenhum cliente ainda</p>
            <p className="mt-2 max-w-sm text-[13px] leading-6 text-starlight/45">
              A jornada começa pela carteira: cadastre o cliente, importe a planilha padrão Bull e a
              ficha consolidada — composição, FGC, delta e vencimentos — fica pronta na hora.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {clients.map((client) => {
              const cpfMasked = maskCpf(client.cpf)
              return (
                <li key={client.id}>
                  <Link
                    href={`/clients/${client.id}`}
                    className="bull-card-calm group flex items-center gap-4 px-5 py-4"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] font-serif text-[15px] text-starlight/75">
                      {client.name.trim().charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium text-starlight">
                        {client.name}
                      </span>
                      <span className="mt-0.5 block text-[12px] text-starlight/40">
                        {cpfMasked ? `CPF ${cpfMasked}` : 'CPF pendente — necessário para o FGC'}
                      </span>
                    </span>
                    <ChevronRight
                      size={16}
                      className="shrink-0 text-starlight/25 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-starlight/55"
                    />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </AppShell>
  )
}
