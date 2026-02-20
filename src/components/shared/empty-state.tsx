import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon = FileText,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground/40" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-md">{description}</p>
      {actionLabel && (
        <Button className="mt-4" onClick={onAction} asChild={!!actionHref}>
          {actionHref ? (
            <a href={actionHref}>
              <Plus className="w-4 h-4" />
              {actionLabel}
            </a>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              {actionLabel}
            </>
          )}
        </Button>
      )}
    </div>
  );
}
