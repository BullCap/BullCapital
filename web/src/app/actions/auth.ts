'use server'

import { AuthError } from 'next-auth'
import { signIn } from '@/lib/auth'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/db'
import { Prisma } from '@/generated/prisma/client'
import { z } from 'zod'

export type AuthActionState =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }
  | null

const registerSchema = z.object({
  email: z.string().email('Endereço de e-mail inválido.'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.'),
  name: z
    .string()
    .min(2, 'O nome deve ter pelo menos 2 caracteres.')
    .optional()
    .or(z.literal('')),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export async function register(
  _prevState: AuthActionState,
  formData: FormData | Record<string, unknown>
): Promise<AuthActionState> {
  const raw = formData instanceof FormData ? Object.fromEntries(formData.entries()) : formData

  const parsed = registerSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Dados inválidos.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { email, password, name } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { success: false, error: 'Já existe uma conta com este e-mail.' }
  }

  const passwordHash = await hash(password, 12)

  try {
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || null,
      },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, error: 'Já existe uma conta com este e-mail.' }
    }
    throw error
  }

  try {
    await signIn('credentials', { email, password, redirect: false })
  } catch {
    // User created — sign-in failure is non-fatal; user can sign in manually
  }

  return { success: true }
}

export async function login(
  _prevState: AuthActionState,
  formData: FormData | Record<string, unknown>
): Promise<AuthActionState> {
  const raw = formData instanceof FormData ? Object.fromEntries(formData.entries()) : formData

  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: 'E-mail ou senha inválidos.' }
  }

  const { email, password } = parsed.data

  try {
    await signIn('credentials', { email, password, redirect: false })
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === 'CredentialsSignin') {
        return { success: false, error: 'E-mail ou senha incorretos.' }
      }
      return { success: false, error: 'Algo deu errado. Tente novamente.' }
    }
    throw error
  }

  return { success: true }
}
