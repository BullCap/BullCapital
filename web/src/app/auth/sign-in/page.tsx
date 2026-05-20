import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SignInForm from '@/components/auth/SignInForm'

export default async function SignInPage() {
  const session = await auth()
  if (session?.user) redirect('/home')

  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  )
}
