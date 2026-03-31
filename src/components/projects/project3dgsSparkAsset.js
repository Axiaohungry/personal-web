export function resolveSparkAssetFileType(url) {
  if (typeof url !== 'string') {
    return null
  }

  const normalizedUrl = url.split(/[?#]/, 1)[0].toLowerCase()

  if (normalizedUrl.endsWith('.ply')) return 'ply'
  if (normalizedUrl.endsWith('.spz')) return 'spz'
  if (normalizedUrl.endsWith('.splat')) return 'splat'
  if (normalizedUrl.endsWith('.ksplat')) return 'ksplat'

  return null
}
