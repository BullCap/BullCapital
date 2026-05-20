import { config } from 'dotenv'
config({ path: '.env.local' })
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { hash } from 'bcryptjs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  const passwordHash = await hash('senha123456', 12)

  await prisma.user.upsert({
    where: { email: 'dev@bullcapital.app' },
    update: {},
    create: {
      email: 'dev@bullcapital.app',
      name: 'Dev User',
      passwordHash,
    },
  })

  console.log('✅ Dev user: dev@bullcapital.app / senha123456')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
