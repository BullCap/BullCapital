// Public interface of the market module (Brapi + macro data + resilience chain).
// Consumers import from '@/modules/market' only — never from internal files.
// Seam rules: docs/migracao-arquitetura.md §5.
export * from './data/market'
