export function parseCategories(value?: string | null) {
  return [
    ...new Set(
      (value ?? '')
        .split('|')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ].slice(0, 3);
}

export function serializeCategories(values: string[]) {
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))]
    .slice(0, 3)
    .join('|');
}

export function displayCategories(value?: string | null) {
  return parseCategories(value).join(' · ');
}
