/**
 * Product-wide constants. Single source of truth for names, versions and limits.
 * Changing a POLICY version forces users to re-acknowledge that document.
 */
export const PRODUCT = {
  name: 'Kryz Quick Reply',
  parentBrand: 'Kryz Digital Partners',
  ecosystem: 'Kryz Digital Software',
  tagline: 'Built for productivity. Designed for privacy.',
  privacyCommitment: 'Your Data. Your Control.',
} as const;

/** Bump when the legal text materially changes. Stored with each acknowledgement. */
export const POLICY_VERSIONS = {
  privacy: '2026-11-25-draft',
  terms: '2026-11-25-draft',
} as const;

/** Current storage schema version. See src/storage/schema.ts for migrations. */
export const SCHEMA_VERSION = 1;

export const LIMITS = {
  /** Max size of an import file, in bytes. */
  importBytes: 2 * 1024 * 1024,
  maxTemplates: 2000,
  maxFolders: 200,
  maxTagsPerTemplate: 20,
  titleChars: 120,
  descriptionChars: 500,
  bodyChars: 20000,
  tagChars: 40,
  folderNameChars: 60,
  variableValueChars: 2000,
  /** Shortcuts: "/" + 1-30 characters. */
  shortcutMaxChars: 31,
  /** Characters before the caret the expander is allowed to look at. */
  expanderLookbehind: 32,
  trashRetentionDays: 30,
  usageRetentionDays: 400,
} as const;

/** Security contact is intentionally not invented. Product owner must supply it. */
export const SECURITY_CONTACT: string | null = null;
