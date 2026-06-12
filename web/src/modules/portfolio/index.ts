// Public interface of the portfolio module (import pipeline, reconciliation,
// risk/FGC, snapshots). Seam created during the architecture migration (F1);
// the domain lands via Spec Kit — see docs/migracao-arquitetura.md §5 and D10.
// Tenancy anchor (clients of the workspace) lives here since F5.
export {
  listClients,
  getClient,
  createClient,
  updateClient,
  archiveClient,
  normalizeCpf,
} from './data/clients'
export type { ClientInput } from './data/clients'
export type * from './types'
