export function normalizeTicker(value: string): string {
  const trimmed = value.trim().toUpperCase()
  if (!trimmed) return ''
  return trimmed.replace(/\.SA$/i, '')
}

export function buildAssetHref(value: string): string {
  const normalized = normalizeTicker(value)
  return normalized ? `/asset/${encodeURIComponent(normalized)}` : '/home'
}
