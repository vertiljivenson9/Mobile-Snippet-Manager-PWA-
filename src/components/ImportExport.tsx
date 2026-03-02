import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Upload, X, FileJson, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSnippetStore } from '@/stores/snippetStore';

interface ImportExportProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportExport({ isOpen, onClose }: ImportExportProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importData, setImportData] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const exportSnippets = useSnippetStore((state) => state.exportSnippets);
  const importSnippets = useSnippetStore((state) => state.importSnippets);
  const loadSnippets = useSnippetStore((state) => state.loadSnippets);

  const handleExport = async () => {
    try {
      const data = await exportSnippets();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `snippets-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess('Exported successfully!');
      setTimeout(() => setSuccess(''), 2000);
    } catch {
      setError('Failed to export snippets');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImportData(event.target?.result as string);
      setError('');
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importData.trim()) {
      setError('Please paste JSON data or select a file');
      return;
    }

    try {
      await importSnippets(importData.trim());
      await loadSnippets();
      setSuccess('Imported successfully!');
      setImportData('');
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 1500);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleClose = () => {
    setImportData('');
    setError('');
    setSuccess('');
    setActiveTab('export');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-card w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Import / Export</h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 active:scale-95"
                onClick={handleClose}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setActiveTab('export')}
                className={`flex-1 py-3 text-sm font-medium transition-colors active:scale-[0.99] ${
                  activeTab === 'export'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </span>
              </button>
              <button
                onClick={() => setActiveTab('import')}
                className={`flex-1 py-3 text-sm font-medium transition-colors active:scale-[0.99] ${
                  activeTab === 'import'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" />
                  Import
                </span>
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {activeTab === 'export' ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Export all your snippets as a JSON file. You can use this file to backup your data or import it into another device.
                  </p>
                  <Button
                    onClick={handleExport}
                    className="w-full h-12 gap-2 active:scale-95"
                  >
                    <FileJson className="w-4 h-4" />
                    Download JSON
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Import snippets from a JSON file. Existing snippets will be merged using last-write-wins strategy.
                  </p>
                  
                  <input
                    type="file"
                    accept=".json"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-12 gap-2 active:scale-95"
                  >
                    <FileJson className="w-4 h-4" />
                    Select JSON file
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or paste JSON</span>
                    </div>
                  </div>

                  <textarea
                    value={importData}
                    onChange={(e) => {
                      setImportData(e.target.value);
                      setError('');
                    }}
                    placeholder="Paste your JSON here..."
                    className="w-full h-32 p-3 bg-muted rounded-lg text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  />

                  <Button
                    onClick={handleImport}
                    disabled={!importData.trim()}
                    className="w-full h-12 gap-2 active:scale-95"
                  >
                    <Upload className="w-4 h-4" />
                    Import
                  </Button>
                </div>
              )}

              {/* Messages */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2 text-sm"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
              
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-green-500/10 text-green-600 rounded-lg flex items-center gap-2 text-sm"
                >
                  <Check className="w-4 h-4 flex-shrink-0" />
                  {success}
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
