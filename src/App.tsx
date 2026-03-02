import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Settings, CloudOff, Menu, X, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toaster, toast } from 'sonner';
import { SearchBar } from '@/components/SearchBar';
import { CategoryFilter } from '@/components/CategoryFilter';
import { SnippetCard } from '@/components/SnippetCard';
import { SnippetForm } from '@/components/SnippetForm';
import { EmptyState } from '@/components/EmptyState';
import { ImportExport } from '@/components/ImportExport';
import { useSnippetStore } from '@/stores/snippetStore';
import type { Snippet, SnippetInput } from '@/types/snippet';
import './App.css';

function App() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);

  const {
    filteredSnippets,
    selectedCategory,
    searchQuery,
    isLoading,
    pendingCount,
    loadSnippets,
    setCategory,
    setSearchQuery,
    addSnippet,
    updateSnippet,
    deleteSnippet,
    copyToClipboard,
  } = useSnippetStore();

  useEffect(() => {
    loadSnippets();
  }, [loadSnippets]);

  const handleAdd = useCallback(() => {
    setEditingSnippet(null);
    setIsFormOpen(true);
  }, []);

  const handleEdit = useCallback((snippet: Snippet) => {
    setEditingSnippet(snippet);
    setIsFormOpen(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingSnippet(null);
  }, []);

  const handleSave = useCallback(async (input: SnippetInput) => {
    try {
      await addSnippet(input);
      toast.success('Snippet created successfully');
    } catch {
      toast.error('Failed to create snippet');
    }
  }, [addSnippet]);

  const handleUpdate = useCallback(async (id: string, input: Partial<SnippetInput>) => {
    try {
      await updateSnippet(id, input);
      toast.success('Snippet updated successfully');
    } catch {
      toast.error('Failed to update snippet');
    }
  }, [updateSnippet]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteSnippet(id);
      toast.success('Snippet deleted successfully');
    } catch {
      toast.error('Failed to delete snippet');
    }
  }, [deleteSnippet]);

  const handleCopy = useCallback(async (content: string) => {
    try {
      await copyToClipboard(content);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  }, [copyToClipboard]);

  const handleClearFilters = useCallback(() => {
    setCategory(null);
    setSearchQuery('');
  }, [setCategory, setSearchQuery]);

  const hasFilters = selectedCategory !== null || searchQuery !== '';

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border safe-area-top">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-primary" />
            <h1 className="text-lg font-bold">Snippet Manager</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 text-amber-600 rounded-full text-xs">
                <CloudOff className="w-3 h-3" />
                <span>{pendingCount}</span>
              </div>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 active:scale-95"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Menu Dropdown */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-14 right-4 z-50 bg-card border border-border rounded-xl shadow-lg p-2 min-w-[160px]"
          >
            <button
              onClick={() => {
                setIsImportExportOpen(true);
                setIsMenuOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-sm rounded-lg hover:bg-muted transition-colors flex items-center gap-2 active:scale-[0.98]"
            >
              <Settings className="w-4 h-4" />
              Import / Export
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-4 pb-24">
        {/* Search */}
        <div className="mb-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <CategoryFilter
            selected={selectedCategory}
            onSelect={setCategory}
          />
        </div>

        {/* Snippets List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredSnippets.length === 0 ? (
          <EmptyState
            onAdd={handleAdd}
            hasFilters={hasFilters}
            onClearFilters={handleClearFilters}
          />
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredSnippets.map((snippet) => (
                <SnippetCard
                  key={snippet.id}
                  snippet={snippet}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onCopy={handleCopy}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <motion.button
        onClick={handleAdd}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center z-30 active:scale-95"
        whileTap={{ scale: 0.9 }}
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      {/* Snippet Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <SnippetForm
            snippet={editingSnippet}
            onSave={handleSave}
            onUpdate={handleUpdate}
            onClose={handleCloseForm}
          />
        )}
      </AnimatePresence>

      {/* Import/Export Modal */}
      <ImportExport
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
      />
    </div>
  );
}

export default App;
