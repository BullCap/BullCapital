// Provenance envelope — canonical contract in docs/contracts/data-envelope.md (v1).
// Computed at read time by this module; AI Service tools propagate it untouched.

export type DataSource = 'brapi' | 'bcb_sgs' | 'cache' | 'snapshot'

export interface ProvenanceEnvelope {
  /** Where the value came from in this response. */
  source: DataSource
  /** ISO 8601 UTC timestamp of when the value was obtained from the primary source. */
  ts: string
  /** True when `ts` exceeds the freshness threshold for the data type. */
  stale: boolean
}

export type WithProvenance<T> = T & { provenance: ProvenanceEnvelope }
