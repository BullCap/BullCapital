export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0D0B14] px-6 py-10">
      {children}
    </div>
  )
}
