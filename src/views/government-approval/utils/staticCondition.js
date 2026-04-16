function normalizeValue(value) {
  if (value && typeof value === 'object' && 'value' in value) return String(value.value)
  if (value === undefined || value === null) return ''
  return String(value)
}

function parseComparisons(condition) {
  const source = String(condition || '')
  const pattern = /viewData(?:\?\.)?\.?([A-Za-z0-9_]+)(?:\?\.)?\.?([A-Za-z0-9_]+)\s*([!=]==?)\s*['"]([^'"]+)['"]/g
  const comparisons = []
  let match

  while ((match = pattern.exec(source))) {
    comparisons.push({
      key: `${match[1]}.${match[2]}`,
      operator: match[3],
      value: match[4],
    })
  }

  return comparisons
}

function evaluateSingleCondition(condition, valuesByWriteField) {
  const comparisons = parseComparisons(condition)
  if (!comparisons.length) return true

  return comparisons.every((comparison) => {
    const currentValue = normalizeValue(valuesByWriteField[comparison.key])
    if (comparison.operator.includes('!=')) return currentValue !== comparison.value
    return currentValue === comparison.value
  })
}

export function evaluateStaticCondition(condition, valuesByWriteField = {}) {
  const source = String(condition || '').trim()
  if (!source) return true

  if (source.includes('||')) {
    return source.split('||').some((part) => evaluateSingleCondition(part, valuesByWriteField))
  }

  return source.split('&&').every((part) => evaluateSingleCondition(part, valuesByWriteField))
}

export function extractConditionOptionValues(writeField, conditions = []) {
  const values = []
  const seen = new Set()

  conditions.forEach((condition) => {
    parseComparisons(condition).forEach((comparison) => {
      if (comparison.key !== writeField) return

      const candidates = comparison.operator.includes('!=') ? [comparison.value, '1'] : [comparison.value]
      candidates.forEach((value) => {
        if (seen.has(value)) return
        seen.add(value)
        values.push(value)
      })
    })
  })

  return values
}
