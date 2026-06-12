'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { Prisma } from '@/generated/prisma/client'
import { requireScope } from '@/modules/user'
import { createClient } from '@/modules/portfolio'

export type ClientActionState =
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }
  | null

const createClientSchema = z.object({
  name: z.string().trim().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  cpf: z
    .string()
    .trim()
    .transform((value) => value.replace(/\D/g, ''))
    .refine((digits) => digits.length === 0 || digits.length === 11, 'CPF deve ter 11 dígitos.')
    .optional()
    .or(z.literal('')),
  email: z.string().trim().email('E-mail inválido.').optional().or(z.literal('')),
})

export async function createClientAction(
  _prevState: ClientActionState,
  formData: FormData
): Promise<ClientActionState> {
  const parsed = createClientSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    return {
      success: false,
      error: 'Dados inválidos.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const scope = await requireScope()
  let clientId: string
  try {
    const client = await createClient(scope, {
      name: parsed.data.name,
      cpf: parsed.data.cpf || null,
      email: parsed.data.email || null,
    })
    clientId = client.id
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return {
        success: false,
        error: 'Já existe um cliente com este CPF neste workspace.',
        fieldErrors: { cpf: ['CPF já cadastrado.'] },
      }
    }
    throw error
  }

  revalidatePath('/clients')
  redirect(`/clients/${clientId}`)
}
