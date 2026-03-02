import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { DB_NAME, DB_VERSION, STORE_NAMES } from './constants';
import type { Snippet, OutboxItem, Preferences } from '@/types/snippet';

interface SnippetDB extends DBSchema {
  [STORE_NAMES.SNIPPETS]: {
    key: string;
    value: Snippet;
    indexes: {
      'by-category': string;
      'by-sync': string;
      'by-updatedAt': number;
    };
  };
  [STORE_NAMES.OUTBOX]: {
    key: string;
    value: OutboxItem;
    indexes: {
      'by-timestamp': number;
    };
  };
  [STORE_NAMES.PREFERENCES]: {
    key: string;
    value: Preferences;
  };
}

class Database {
  private db: IDBPDatabase<SnippetDB> | null = null;

  async init(): Promise<IDBPDatabase<SnippetDB>> {
    if (this.db) return this.db;

    this.db = await openDB<SnippetDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Snippets store
        if (!db.objectStoreNames.contains(STORE_NAMES.SNIPPETS)) {
          const snippetStore = db.createObjectStore(STORE_NAMES.SNIPPETS, {
            keyPath: 'id',
          });
          snippetStore.createIndex('by-category', 'category');
          snippetStore.createIndex('by-sync', 'syncStatus');
          snippetStore.createIndex('by-updatedAt', 'updatedAt');
        }

        // Outbox store for sync FIFO
        if (!db.objectStoreNames.contains(STORE_NAMES.OUTBOX)) {
          const outboxStore = db.createObjectStore(STORE_NAMES.OUTBOX, {
            keyPath: 'id',
          });
          outboxStore.createIndex('by-timestamp', 'timestamp');
        }

        // Preferences store
        if (!db.objectStoreNames.contains(STORE_NAMES.PREFERENCES)) {
          db.createObjectStore(STORE_NAMES.PREFERENCES, {
            keyPath: 'id',
          });
        }
      },
    });

    console.log('[DB] IndexedDB initialized');
    return this.db;
  }

  private async getDB(): Promise<IDBPDatabase<SnippetDB>> {
    if (!this.db) {
      return this.init();
    }
    return this.db;
  }

  // Snippet operations
  async getAllSnippets(): Promise<Snippet[]> {
    const db = await this.getDB();
    return db.getAll(STORE_NAMES.SNIPPETS);
  }

  async getSnippetsByCategory(category: string): Promise<Snippet[]> {
    const db = await this.getDB();
    const index = db.transaction(STORE_NAMES.SNIPPETS).store.index('by-category');
    return index.getAll(category);
  }

  async getSnippetById(id: string): Promise<Snippet | undefined> {
    const db = await this.getDB();
    return db.get(STORE_NAMES.SNIPPETS, id);
  }

  async saveSnippet(snippet: Snippet): Promise<void> {
    const db = await this.getDB();
    await db.put(STORE_NAMES.SNIPPETS, snippet);
  }

  async deleteSnippet(id: string): Promise<void> {
    const db = await this.getDB();
    await db.delete(STORE_NAMES.SNIPPETS, id);
  }

  // Outbox operations for sync
  async addToOutbox(item: OutboxItem): Promise<void> {
    const db = await this.getDB();
    await db.put(STORE_NAMES.OUTBOX, item);
  }

  async getOutboxItems(): Promise<OutboxItem[]> {
    const db = await this.getDB();
    const index = db.transaction(STORE_NAMES.OUTBOX).store.index('by-timestamp');
    return index.getAll();
  }

  async removeFromOutbox(id: string): Promise<void> {
    const db = await this.getDB();
    await db.delete(STORE_NAMES.OUTBOX, id);
  }

  async clearOutbox(): Promise<void> {
    const db = await this.getDB();
    const items = await db.getAll(STORE_NAMES.OUTBOX);
    const tx = db.transaction(STORE_NAMES.OUTBOX, 'readwrite');
    await Promise.all(items.map(item => tx.store.delete(item.id)));
    await tx.done;
  }

  // Preferences operations
  async getPreferences(): Promise<Preferences> {
    const db = await this.getDB();
    const prefs = await db.get(STORE_NAMES.PREFERENCES, 'user');
    if (!prefs) {
      const defaultPrefs: Preferences = {
        id: 'user',
        selectedCategory: null,
        lastSyncAt: null,
      };
      await db.put(STORE_NAMES.PREFERENCES, defaultPrefs);
      return defaultPrefs;
    }
    return prefs;
  }

  async savePreferences(prefs: Partial<Preferences>): Promise<void> {
    const db = await this.getDB();
    const current = await this.getPreferences();
    const updated = { ...current, ...prefs };
    await db.put(STORE_NAMES.PREFERENCES, updated);
  }

  // Export/Import
  async exportAll(): Promise<Snippet[]> {
    return this.getAllSnippets();
  }

  async importSnippets(snippets: Snippet[]): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction(STORE_NAMES.SNIPPETS, 'readwrite');
    await Promise.all(snippets.map(snippet => tx.store.put(snippet)));
    await tx.done;
  }

  // Check if there are pending sync items
  async hasPendingSync(): Promise<boolean> {
    const db = await this.getDB();
    const count = await db.count(STORE_NAMES.OUTBOX);
    return count > 0;
  }

  // Get pending snippets count
  async getPendingCount(): Promise<number> {
    const db = await this.getDB();
    return db.count(STORE_NAMES.OUTBOX);
  }
}

export const db = new Database();
