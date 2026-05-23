export function PageLoadingContent() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="absolute -inset-6 rounded-full bg-[#8B5CF6]/10 blur-2xl animate-pulse-glow" />
        <div className="relative h-8 w-8 rounded-full border-2 border-[#8B5CF6]/20 border-t-[#8B5CF6] animate-spin" />
      </div>
      <p className="text-xs tracking-[0.2em] uppercase text-[#F4F0FF]/30">carregando</p>
    </div>
  )
}
