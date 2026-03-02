import { motion } from 'framer-motion';
import { Code2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onAdd: () => void;
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

export function EmptyState({ onAdd, hasFilters, onClearFilters }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
        <Code2 className="w-10 h-10 text-muted-foreground" />
      </div>
      
      <h3 className="text-xl font-semibold mb-2">
        {hasFilters ? 'No snippets found' : 'No snippets yet'}
      </h3>
      
      <p className="text-muted-foreground mb-6 max-w-xs">
        {hasFilters
          ? 'Try adjusting your search or filters to find what you are looking for.'
          : 'Start building your snippet library. Add your first code snippet to get started.'}
      </p>
      
      {hasFilters ? (
        <Button
          variant="outline"
          onClick={onClearFilters}
          className="active:scale-95"
        >
          Clear filters
        </Button>
      ) : (
        <Button
          onClick={onAdd}
          className="gap-2 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add your first snippet
        </Button>
      )}
    </motion.div>
  );
}
