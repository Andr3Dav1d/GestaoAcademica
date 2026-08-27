export function cuidLike() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`
}

export function normalizeStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}
