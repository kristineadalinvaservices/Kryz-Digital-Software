/** Shared data model. Everything here is stored locally in chrome.storage.local. */

export type ID = string;

export interface Template {
  id: ID;
  title: string;
  description: string;
  body: string;
  /** Optional text shortcut, e.g. "/intro". Stored lower-case. */
  shortcut: string | null;
  folderId: ID | null;
  tags: string[];
  favorite: boolean;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
  /** True for templates that came from the optional starter library. */
  starter: boolean;
}

export interface TrashedTemplate {
  template: Template;
  deletedAt: number;
}

export interface Folder {
  id: ID;
  name: string;
  createdAt: number;
}

export type ThemePreference = 'light' | 'signature' | 'system';
export type MotionPreference = 'system' | 'reduce' | 'full';
export type ExpandKey = 'Tab' | 'Enter';

export interface SenderProfile {
  /** Values the user chose to save for their own details. Never recipient data. */
  senderName: string;
  meetingLink: string;
}

export interface Settings {
  theme: ThemePreference;
  motion: MotionPreference;
  /** Master switch for shortcut expansion on websites. */
  expansionEnabled: boolean;
  expandKey: ExpandKey;
  /** Origins (e.g. "https://mail.google.com") where the user switched expansion on. */
  expansionSites: string[];
  /** Typing speed used for the *estimated* time-saved metric. */
  typingWpm: number;
  profile: SenderProfile;
}

export interface Consent {
  privacyAckVersion: string | null;
  privacyAckAt: number | null;
  termsAcceptedVersion: string | null;
  termsAcceptedAt: number | null;
  onboardingCompletedAt: number | null;
}

export interface DayUsage {
  count: number;
  words: number;
}

export interface TemplateUsage {
  count: number;
  words: number;
  lastUsedAt: number;
}

export interface Usage {
  /** Keyed by template id. */
  byTemplate: Record<ID, TemplateUsage>;
  /** Keyed by local date "YYYY-MM-DD". */
  byDay: Record<string, DayUsage>;
  /** Keyed by folder id, or "none". Recorded at the time of use. */
  byFolder: Record<string, number>;
}

export type UsageAction = 'copy' | 'insert' | 'expand';

export interface Meta {
  schemaVersion: number;
  installedAt: number;
}

/** Everything the extension stores. Export of "all data" uses this shape. */
export interface StoreShape {
  meta: Meta;
  templates: Template[];
  folders: Folder[];
  trash: TrashedTemplate[];
  settings: Settings;
  consent: Consent;
  usage: Usage;
}

export type StoreKey = keyof StoreShape;
