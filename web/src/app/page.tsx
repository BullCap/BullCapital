import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

import Header from '@/components/landing/Header'
import DynamicTitle from '@/components/landing/DynamicTitle'
import SearchBar from '@/components/landing/SearchBar'
import Grainient from '@/components/landing/Grainient'
import TopAssetsSection from '@/components/landing/TopAssetsSection'
import MarketOverview from '@/components/landing/MarketOverview'
import MarketHighlights from '@/components/landing/MarketHighlights'
import Footer from '@/components/landing/Footer'

export default async function HomePage() {
  const session = await auth()

  if (session?.user) {
    redirect('/home')
  }

  const user = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }
    : undefined

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden text-[#F4F0FF]">
      {/* Fixed WebGL Background Animation */}
      <div className="pointer-events-none fixed inset-0 -z-50 h-screen w-screen opacity-70">
        <Grainient
          color1="#0D0B14"
          color2="#5227FF"
          color3="#0D0B14"
          timeSpeed={0.25}
          colorBalance={0.1}
          warpStrength={2.5}
          warpFrequency={4.5}
          warpSpeed={2.5}
          warpAmplitude={45}
          blendAngle={15}
          blendSoftness={0.08}
          rotationAmount={350}
          noiseScale={2.5}
          grainAmount={0.08}
          grainScale={1.5}
          grainAnimated={true}
          contrast={1.4}
          gamma={1.1}
          saturation={1.2}
          centerX={0}
          centerY={0}
          zoom={0.8}
          className="h-full w-full"
        />
        {/* Soft shadow overlay to blend WebGL with the dark void background */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0D0B14]/40 to-[#0D0B14]" />
      </div>

      {/* Dynamic Floating Header */}
      <Header user={user} />

      {/* Hero Section */}
      <section className="relative flex h-[700px] w-full flex-col items-center justify-center gap-8 pt-28">
        <DynamicTitle />
        <SearchBar />
      </section>



      {/* Content Sections */}
      <div className="z-10 mx-auto flex w-full max-w-7xl flex-col items-start gap-32 px-6 py-12">
        {/* Top Asset Cards */}
        <TopAssetsSection />

        {/* Visão Geral */}
        <MarketOverview />

        {/* Destaques */}
        <MarketHighlights />
      </div>

      {/* Institutional Glass Footer */}
      <Footer />
    </main>
  )
}

