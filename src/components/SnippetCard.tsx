import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Edit2, 
  Trash2,
  CloudOff,
  Tag
} from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// cn utility not used in this component
import { SYNC_STATUS } from '@/lib/constants';
import type { Snippet } from '@/types/snippet';

interface SnippetCardProps {
  snippet: Snippet;
  onEdit: (snippet: Snippet) => void;
  onDelete: (id: string) => void;
  onCopy: (content: string) => void;
}

const languageMap: Record<string, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  swift: 'swift',
  kotlin: 'kotlin',
  java: 'java',
  html: 'markup',
  css: 'css',
  json: 'json',
  sql: 'sql',
  bash: 'bash',
  yaml: 'yaml',
  markdown: 'markdown',
  other: 'javascript',
};

export function SnippetCard({ snippet, onEdit, onDelete, onCopy }: SnippetCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isExpanded && codeRef.current) {
      const language = languageMap[snippet.language] || 'javascript';
      codeRef.current.className = `language-${language}`;
      Prism.highlightElement(codeRef.current);
    }
  }, [isExpanded, snippet.content, snippet.language]);

  const handleCopy = async () => {
    await onCopy(snippet.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this snippet?')) {
      onDelete(snippet.id);
    }
  };

  const isPending = snippet.syncStatus === SYNC_STATUS.PENDING || snippet.syncStatus === SYNC_STATUS.LOCAL;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-base truncate">{snippet.title}</h3>
            {isPending && (
              <CloudOff className="w-4 h-4 text-amber-500 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {snippet.category}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {snippet.language}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 active:scale-95"
            onClick={handleCopy}
          >
            {isCopied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 active:scale-95"
            onClick={() => onEdit(snippet)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive active:scale-95"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tags */}
      {snippet.tags.length > 0 && (
        <div className="px-4 pb-2 flex items-center gap-1 flex-wrap">
          <Tag className="w-3 h-3 text-muted-foreground mr-1" />
          {snippet.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Code Section */}
      <div className="border-t border-border">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-2 flex items-center justify-between text-sm text-muted-foreground hover:bg-muted/50 transition-colors active:scale-[0.99]"
        >
          <span>{isExpanded ? 'Hide code' : 'Show code'}</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-4 pt-0">
                <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-sm">
                  <code ref={codeRef} className="language-javascript">
                    {snippet.content}
                  </code>
                </pre>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-muted/30 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Updated {new Date(snippet.updatedAt).toLocaleDateString()}
        </p>
      </div>
    </motion.div>
  );
}
