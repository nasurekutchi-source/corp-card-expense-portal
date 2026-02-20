import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"; label?: string }> = {
  ACTIVE: { variant: "success", label: "Active" },
  SUSPENDED: { variant: "warning", label: "Suspended" },
  CANCELLED: { variant: "destructive", label: "Cancelled" },
  FROZEN: { variant: "info", label: "Frozen" },
  PENDING: { variant: "warning", label: "Pending" },
  DRAFT: { variant: "secondary", label: "Draft" },
  SUBMITTED: { variant: "info", label: "Submitted" },
  IN_REVIEW: { variant: "warning", label: "In Review" },
  APPROVED: { variant: "success", label: "Approved" },
  REJECTED: { variant: "destructive", label: "Rejected" },
  PROCESSING: { variant: "info", label: "Processing" },
  PAID: { variant: "success", label: "Paid" },
  FAILED: { variant: "destructive", label: "Failed" },
  SETTLED: { variant: "success", label: "Settled" },
  DECLINED: { variant: "destructive", label: "Declined" },
  REVERSED: { variant: "warning", label: "Reversed" },
  COMPLIANT: { variant: "success", label: "Compliant" },
  SOFT_VIOLATION: { variant: "warning", label: "Soft Violation" },
  HARD_VIOLATION: { variant: "destructive", label: "Hard Violation" },
  EXCEPTION: { variant: "info", label: "Exception" },
  DELEGATED: { variant: "info", label: "Delegated" },
  ESCALATED: { variant: "warning", label: "Escalated" },
  VERIFIED: { variant: "success", label: "Verified" },
  AUTH: { variant: "warning", label: "Authorization" },
  SETTLE: { variant: "success", label: "Settlement" },
  REVERSE: { variant: "destructive", label: "Reversal" },
  DECLINE: { variant: "destructive", label: "Declined" },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { variant: "outline" as const, label: status };

  return (
    <Badge variant={config.variant} className={cn("text-[10px]", className)}>
      {config.label || status}
    </Badge>
  );
}
