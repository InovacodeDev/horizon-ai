import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
      <div className="relative">
        {/* Circular progress indicator */}
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>

      <p className="mt-6 text-base font-normal text-on-surface-variant text-center">
        {message}
      </p>
    </div>
  );
}
