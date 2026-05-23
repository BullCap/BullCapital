import Link from 'next/link'
import { redirect } from 'next/navigation'

import { auth } from '@/lib/auth'

export default async function Page() {
  const session = await auth()

  if (session?.user) {
    redirect('/home')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--void)] px-6 py-10">
      <section className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#1A1625]/40 p-8 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-2px_6px_rgba(0,0,0,0.6),0_10px_20px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute left-1/2 top-0 h-px w-3/5 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="flex justify-center mb-6 mt-2">
          <img
            src="/icons/icon-192.png"
            alt="Logo BCAP"
            className="h-16 w-16 rounded-[1.25rem] border border-white/10 shadow-[0_10px_20px_rgba(0,0,0,0.4)]"
          />
        </div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#F4F0FF]/55">
          Inteligência financeira
        </p>
        <h1 className="mt-4 leading-tight text-[#F4F0FF] flex justify-center items-baseline select-none font-serif text-6xl font-bold tracking-wide">
          BCAP
        </h1>
        <p className="mt-5 text-sm leading-6 text-[#F4F0FF]/70">
          Leia o mercado brasileiro com clareza, contexto e calma.
        </p>
        <Link
          href="/auth/sign-in"
          className="mt-8 inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/10 bg-[#8B5CF6]/20 px-5 text-sm font-medium text-[#F4F0FF] shadow-[inset_0_1px_2px_rgba(255,255,255,0.18),0_8px_18px_rgba(0,0,0,0.35)] transition duration-500 hover:-translate-y-0.5 hover:bg-[#8B5CF6]/30"
        >
          Entrar
        </Link>
      </section>
    </main>
  )
}
