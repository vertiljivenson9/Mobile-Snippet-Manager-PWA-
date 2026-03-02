import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import Fuse from 'fuse.js';
import { db } from '@/lib/db';
import { FUSE_OPTIONS, SYNC_STATUS } from '@/lib/constants';
import type { Snippet, SnippetInput } from '@/types/snippet';
import type { Category } from '@/lib/constants';

interface SnippetState {
  snippets: Snippet[];
  filteredSnippets: Snippet[];
  selectedCategory: Category | null;
  searchQuery: string;
  isLoading: boolean;
  fuse: Fuse<Snippet> | null;
  pendingCount: number;
  
  // Actions
  loadSnippets: () => Promise<void>;
  addSnippet: (input: SnippetInput) => Promise<void>;
  updateSnippet: (id: string, input: Partial<SnippetInput>) => Promise<void>;
  deleteSnippet: (id: string) => Promise<void>;
  setCategory: (category: Category | null) => Promise<void>;
  setSearchQuery: (query: string) => void;
  filterSnippets: () => void;
  copyToClipboard: (content: string) => Promise<void>;
  exportSnippets: () => Promise<string>;
  importSnippets: (jsonString: string) => Promise<void>;
  refreshPendingCount: () => Promise<void>;
}

export const useSnippetStore = create<SnippetState>((set, get) => ({
  snippets: [],
  filteredSnippets: [],
  selectedCategory: null,
  searchQuery: '',
  isLoading: false,
  fuse: null,
  pendingCount: 0,

  loadSnippets: async () => {
    set({ isLoading: true });
    try {
      await db.init();
      const snippets = await db.getAllSnippets();
      const prefs = await db.getPreferences();
      const fuse = new Fuse(snippets, FUSE_OPTIONS);
      
      set({ 
        snippets, 
        fuse,
        selectedCategory: prefs.selectedCategory,
        isLoading: false 
      });
      
      get().filterSnippets();
      get().refreshPendingCount();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  addSnippet: async (input: SnippetInput) => {
    const now = Date.now();
    const snippet: Snippet = {
      id: uuidv4(),
      ...input,
      createdAt: now,
      updatedAt: now,
      syncStatus: SYNC_STATUS.LOCAL,
    };

    await db.saveSnippet(snippet);
    
    // Add to outbox for sync
    await db.addToOutbox({
      id: uuidv4(),
      snippetId: snippet.id,
      operation: 'create',
      timestamp: now,
    });

    const { snippets, fuse } = get();
    const newSnippets = [...snippets, snippet];
    const newFuse = fuse ? new Fuse(newSnippets, FUSE_OPTIONS) : null;
    
    set({ 
      snippets: newSnippets, 
      fuse: newFuse 
    });
    
    get().filterSnippets();
    get().refreshPendingCount();
  },

  updateSnippet: async (id: string, input: Partial<SnippetInput>) => {
    const { snippets } = get();
    const snippet = snippets.find(s => s.id === id);
    if (!snippet) return;

    const updated: Snippet = {
      ...snippet,
      ...input,
      updatedAt: Date.now(),
      syncStatus: SYNC_STATUS.PENDING,
    };

    await db.saveSnippet(updated);
    
    // Add to outbox for sync
    await db.addToOutbox({
      id: uuidv4(),
      snippetId: id,
      operation: 'update',
      timestamp: Date.now(),
    });

    const newSnippets = snippets.map(s => s.id === id ? updated : s);
    const newFuse = new Fuse(newSnippets, FUSE_OPTIONS);
    
    set({ 
      snippets: newSnippets, 
      fuse: newFuse 
    });
    
    get().filterSnippets();
    get().refreshPendingCount();
  },

  deleteSnippet: async (id: string) => {
    const { snippets } = get();
    
    await db.deleteSnippet(id);
    
    // Add to outbox for sync
    await db.addToOutbox({
      id: uuidv4(),
      snippetId: id,
      operation: 'delete',
      timestamp: Date.now(),
    });

    const newSnippets = snippets.filter(s => s.id !== id);
    const newFuse = new Fuse(newSnippets, FUSE_OPTIONS);
    
    set({ 
      snippets: newSnippets, 
      fuse: newFuse 
    });
    
    get().filterSnippets();
    get().refreshPendingCount();
  },

  setCategory: async (category: Category | null) => {
    await db.savePreferences({ selectedCategory: category });
    set({ selectedCategory: category });
    get().filterSnippets();
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    get().filterSnippets();
  },

  filterSnippets: () => {
    const { snippets, selectedCategory, searchQuery, fuse } = get();
    
    let result = [...snippets];
    
    // Filter by category
    if (selectedCategory) {
      result = result.filter(s => s.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim() && fuse) {
      const searchResults = fuse.search(searchQuery.trim());
      const matchedIds = new Set(searchResults.map(r => r.item.id));
      result = result.filter(s => matchedIds.has(s.id));
    }
    
    // Sort by updatedAt desc
    result.sort((a, b) => b.updatedAt - a.updatedAt);
    
    set({ filteredSnippets: result });
  },

  copyToClipboard: async (content: string) => {
    await navigator.clipboard.writeText(content);
  },

  exportSnippets: async () => {
    const snippets = await db.exportAll();
    return JSON.stringify(snippets, null, 2);
  },

  importSnippets: async (jsonString: string) => {
    try {
      const imported: Snippet[] = JSON.parse(jsonString);
      
      if (!Array.isArray(imported)) {
        throw new Error('Invalid format: expected array');
      }
      
      // Validate each snippet
      for (const snippet of imported) {
        if (!snippet.id || !snippet.title || !snippet.content) {
          throw new Error('Invalid snippet format');
        }
      }

      const { snippets } = get();
      
      // Merge with last-write-wins strategy
      const merged = new Map<string, Snippet>();
      
      // Add existing snippets
      for (const s of snippets) {
        merged.set(s.id, s);
      }
      
      // Merge imported snippets
      for (const importedSnippet of imported) {
        const existing = merged.get(importedSnippet.id);
        if (!existing || importedSnippet.updatedAt > existing.updatedAt) {
          merged.set(importedSnippet.id, {
            ...importedSnippet,
            syncStatus: SYNC_STATUS.PENDING,
          });
        }
      }
      
      const mergedSnippets = Array.from(merged.values());
      
      // Save to DB
      await db.importSnippets(mergedSnippets);
      
      // Update state
      const newFuse = new Fuse(mergedSnippets, FUSE_OPTIONS);
      set({ 
        snippets: mergedSnippets, 
        fuse: newFuse 
      });
      
      get().filterSnippets();
    } catch (error) {
      throw new Error('Failed to import snippets: ' + (error as Error).message);
    }
  },

  refreshPendingCount: async () => {
    const count = await db.getPendingCount();
    set({ pendingCount: count });
  },
}));
