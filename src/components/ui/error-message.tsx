import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorMessageProps {
  message: string;
  className?: string;
}

export function ErrorMessage({ message, className }: ErrorMessageProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-[var(--radius-m)] bg-error/10 border border-error/20",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <AlertCircle
        className="w-5 h-5 text-error flex-shrink-0 mt-0.5"
        aria-hidden="true"
      />
      <p className="text-sm leading-5 font-normal text-error">{message}</p>
    </div>
  );
}
