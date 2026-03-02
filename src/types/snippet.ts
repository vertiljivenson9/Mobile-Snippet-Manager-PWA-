import type { Category, Language, SyncStatus } from '@/lib/constants';

export interface Snippet {
  id: string;
  title: string;
  content: string;
  category: Category;
  language: Language;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  syncStatus: SyncStatus;
}

export interface SnippetInput {
  title: string;
  content: string;
  category: Category;
  language: Language;
  tags: string[];
}

export interface OutboxItem {
  id: string;
  snippetId: string;
  operation: 'create' | 'update' | 'delete';
  timestamp: number;
}

export interface Preferences {
  id: string;
  selectedCategory: Category | null;
  lastSyncAt: number | null;
}

export type SnippetFilter = {
  category: Category | null;
  search: string;
};
