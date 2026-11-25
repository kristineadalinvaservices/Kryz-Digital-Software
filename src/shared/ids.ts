/** Random IDs from the platform CSPRNG. Not secrets; just collision-resistant identifiers. */
export function newId(prefix = 't'): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let hex = '';
  for (const b of bytes) hex += b.toString(16).padStart(2, '0');
  return `${prefix}_${hex}`;
}
