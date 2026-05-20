import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SignUpForm from '@/components/auth/SignUpForm'

export default async function SignUpPage() {
  const session = await auth()
  if (session?.user) redirect('/home')

  return <SignUpForm />
}
