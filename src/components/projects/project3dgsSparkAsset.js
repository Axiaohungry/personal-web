export function resolveSparkAssetFileType(url) {
  // Spark 支持多种 3DGS 资源格式。
  // 这里通过 URL 后缀做一次静态识别，帮助加载器在拉取二进制前就确定解析方式。
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
