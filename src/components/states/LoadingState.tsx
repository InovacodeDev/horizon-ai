import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
      <div className="relative">
        {/* Circular progress indicator */}
        <LoadingSpinner size="lg" />
      </div>

      <p className="mt-6 text-base font-normal text-on-surface-variant text-center">
        {message}
      </p>
    </div>
  );
}
