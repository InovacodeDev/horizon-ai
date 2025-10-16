import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onSecondaryAction?: () => void;
  secondaryActionLabel?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  onSecondaryAction,
  secondaryActionLabel = "Go back",
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
      {/* Error Icon */}
      <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-error" />
      </div>

      {/* Title */}
      <h2 className="text-[22px] leading-7 font-medium text-on-surface mb-3">
        {title}
      </h2>

      {/* Message */}
      <p className="text-base leading-6 font-normal text-on-surface-variant mb-8 max-w-md">
        {message}
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        {onRetry && (
          <Button
            onClick={onRetry}
            className="w-full h-10 bg-primary text-on-primary hover:bg-primary/90 rounded-full text-sm font-medium transition-all duration-200"
          >
            Try Again
          </Button>
        )}

        {onSecondaryAction && (
          <Button
            onClick={onSecondaryAction}
            variant="outline"
            className="w-full h-10 border-outline text-primary hover:bg-primary/5 rounded-full text-sm font-medium transition-all duration-200"
          >
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
