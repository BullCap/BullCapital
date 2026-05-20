import { redirect } from 'next/navigation'

import { auth } from '@/lib/auth'

export default async function ChatPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/sign-in')
  }

  return (
    <main className="min-h-screen bg-[var(--void)] px-6 py-8">
      <section className="glass-card relative overflow-hidden p-8">
        <div className="pointer-events-none absolute left-1/2 top-0 h-px w-3/5 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#F4F0FF]/55">
          Inteligência
        </p>
        <h1 className="mt-4 font-serif text-4xl text-[#F4F0FF]">Chat com IA</h1>
      </section>
    </main>
  )
}
