import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrate: {
    async adapter() {
      const pool = new Pool({
        connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
      })
      return new PrismaPg(pool)
    },
  },
})
