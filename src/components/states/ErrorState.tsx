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
      {/* Error Icon with MD3 Error Container Color */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
        style={{
          backgroundColor: "hsl(var(--md-sys-color-error-container) / 0.3)",
        }}
      >
        <AlertTriangle className="w-8 h-8" style={{ color: "hsl(var(--md-sys-color-error))" }} />
      </div>

      {/* Title - MD3 Title Large */}
      <h2
        className="mb-3"
        style={{
          fontSize: "var(--md-sys-typescale-title-large-size)",
          lineHeight: "var(--md-sys-typescale-title-large-line-height)",
          fontWeight: "var(--md-sys-typescale-title-large-weight)",
          color: "hsl(var(--md-sys-color-on-surface))",
        }}
      >
        {title}
      </h2>

      {/* Message - MD3 Body Large */}
      <p
        className="mb-8 max-w-md"
        style={{
          fontSize: "var(--md-sys-typescale-body-large-size)",
          lineHeight: "var(--md-sys-typescale-body-large-line-height)",
          fontWeight: "var(--md-sys-typescale-body-large-weight)",
          color: "hsl(var(--md-sys-color-on-surface-variant))",
        }}
      >
        {message}
      </p>

      {/* Action Buttons - MD3 Buttons */}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        {onRetry && (
          <Button onClick={onRetry} variant="filled" className="w-full">
            Try Again
          </Button>
        )}

        {onSecondaryAction && (
          <Button onClick={onSecondaryAction} variant="outlined" className="w-full">
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
