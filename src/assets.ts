const embeddedAssets: Record<string, string> = import.meta.env.MODE === 'portable'
  ? JSON.parse(document.getElementById('aurora-assets')?.textContent ?? '{}')
  : {}

export function assetUrl(filename: string): string {
  return embeddedAssets[filename] ?? `${import.meta.env.BASE_URL}assets/${filename}`
}

export function combatantArt(key: string): string {
  return assetUrl(`urban-${key}.webp`)
}
