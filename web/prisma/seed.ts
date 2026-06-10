import { config } from 'dotenv'
config({ path: '.env.local' })
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { hash } from 'bcryptjs'
import { MARKET_DDL, MARKET_SCHEMA } from '../src/modules/market/data/schema-sql'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Synthetic DEV-ONLY market data so /, /home and /terminal render without a
// BRAPI_KEY (plan §8.3). Real data comes from the cron handlers (see README).
const SEED_QUOTES: Array<
  [ticker: string, name: string, price: number, change: number, volume: number, marketCap: number, sector: string | null]
> = [
  ['PETR4', 'Petrobras PN', 38.42, 1.2, 52_000_000, 501_000_000_000, 'Energia'],
  ['VALE3', 'Vale ON', 61.05, -0.8, 31_000_000, 280_000_000_000, 'Mineração'],
  ['ITUB4', 'Itaú Unibanco PN', 33.71, 0.4, 28_000_000, 330_000_000_000, 'Financeiro'],
  ['BBAS3', 'Banco do Brasil ON', 27.9, -0.2, 19_000_000, 159_000_000_000, 'Financeiro'],
  ['WEGE3', 'WEG ON', 41.3, 0.9, 9_000_000, 173_000_000_000, 'Bens de Capital'],
  ['B3SA3', 'B3 ON', 12.18, 0.1, 22_000_000, 66_000_000_000, 'Financeiro'],
  ['TAEE11', 'Taesa UNT', 34.55, 0.3, 4_000_000, 11_900_000_000, 'Energia Elétrica'],
  ['MXRF11', 'Maxi Renda FII', 10.12, 0.05, 1_500_000, 3_200_000_000, 'FII'],
  ['^BVSP', 'Ibovespa', 137_412.0, 0.6, 0, 0, null],
  ['^GSPC', 'S&P 500', 6_104.2, 0.2, 0, 0, null],
  ['^VIX', 'VIX', 14.8, -1.1, 0, 0, null],
]

async function seedMarket() {
  for (const statement of MARKET_DDL) {
    await pool.query(statement)
  }

  for (const [ticker, name, price, change, volume, marketCap, sector] of SEED_QUOTES) {
    await pool.query(
      `INSERT INTO ${MARKET_SCHEMA}.asset_quotes (ticker, name, price, change_percent, volume, market_cap, sector, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, now())
       ON CONFLICT (ticker) DO NOTHING`,
      [ticker, name, price, change, volume, marketCap || null, sector]
    )

    // 30 days of synthetic daily closes around the seed price.
    for (let i = 0; i < 30; i += 1) {
      const drift = Math.sin(i / 4) * 0.02 * price
      const close = Number((price - drift).toFixed(2))
      await pool.query(
        `INSERT INTO ${MARKET_SCHEMA}.asset_historical_prices (ticker, date, open, high, low, close, volume)
         VALUES ($1, current_date - $2::int, $3, $4, $5, $6, $7)
         ON CONFLICT ON CONSTRAINT uq_ticker_date DO NOTHING`,
        [ticker, i, close * 0.995, close * 1.01, close * 0.99, close, volume || null]
      )
    }
  }

  await pool.query(
    `INSERT INTO ${MARKET_SCHEMA}.macro_indicators (series_id, name, date, value)
     VALUES (432, 'SELIC', current_date, 14.75), (13522, 'IPCA', date_trunc('month', current_date)::date, 4.8)
     ON CONFLICT ON CONSTRAINT uq_series_date DO NOTHING`
  )
  await pool.query(
    `INSERT INTO ${MARKET_SCHEMA}.currency_quotes (pair, name, bid, ask, high, low, updated_at)
     VALUES ('USD-BRL', 'USD/BRL', 5.42, 5.43, 5.46, 5.39, now())
     ON CONFLICT (pair) DO NOTHING`
  )
}

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

  await seedMarket()
  console.log('✅ Market: tabelas garantidas + dados sintéticos de dev (quotes, histórico, macro, câmbio)')
}

main()
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    await pool.end()
    process.exit(1)
  })
  .then(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
