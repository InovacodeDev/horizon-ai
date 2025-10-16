import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

export function showSuccessToast(message: string) {
  toast.success(message, {
    icon: <CheckCircle2 className="h-5 w-5 text-secondary" />,
    duration: 3000,
    className: "bg-surface border-outline",
  });
}

// Example usage:
// showSuccessToast('Itaú account connected successfully!');
