// Public interface of the reports module (B2 desk-submission package, B3 macro
// report composition, PDF/image export). Seam created during the architecture
// migration; the domain lands via Spec Kit — see docs/migracao-arquitetura.md
// §6.5 and D12/D13. Reads portfolio/market through their public interfaces;
// narrative blocks come from the AI Service via the BFF, never computed here.
export {}
