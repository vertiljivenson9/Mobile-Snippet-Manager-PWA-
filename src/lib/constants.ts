// Categories - single source of truth
export const CATEGORIES = [
  'UI',
  'API',
  'Database',
  'Utils',
  'Auth',
  'DevOps',
  'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];

// Languages for syntax highlighting
export const LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'swift',
  'kotlin',
  'java',
  'html',
  'css',
  'json',
  'sql',
  'bash',
  'yaml',
  'markdown',
  'other',
] as const;

export type Language = (typeof LANGUAGES)[number];

// Sync status
export const SYNC_STATUS = {
  LOCAL: 'local',
  PENDING: 'pending',
  SYNCED: 'synced',
} as const;

export type SyncStatus = (typeof SYNC_STATUS)[keyof typeof SYNC_STATUS];

// Database
export const DB_NAME = 'snippet-manager';
export const DB_VERSION = 1;

// Store names
export const STORE_NAMES = {
  SNIPPETS: 'snippets',
  OUTBOX: 'outbox',
  PREFERENCES: 'preferences',
} as const;

// Fuse.js search options
export const FUSE_OPTIONS = {
  keys: ['title', 'content', 'tags', 'category'],
  threshold: 0.3,
  ignoreLocation: true,
  includeScore: false,
};

// Debounce delay for search
export const SEARCH_DEBOUNCE = 150;

// Animation durations
export const ANIMATION = {
  FAST: 0.15,
  NORMAL: 0.2,
  SLOW: 0.3,
};
