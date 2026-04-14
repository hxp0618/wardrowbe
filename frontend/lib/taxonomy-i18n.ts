/** Maps API color values to keys under taxonomy.colors (hyphens → underscores). */
export function taxonomyColorKey(value: string): string {
  return value.replace(/-/g, '_');
}
