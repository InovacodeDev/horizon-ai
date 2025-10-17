import { CircularProgress } from "@/components/ui/circular-progress";

interface LoadingStateProps {
  message?: string;
  size?: "small" | "medium" | "large";
}

export function LoadingState({ message = "Loading...", size = "large" }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
      {/* MD3 Circular Progress Indicator */}
      <CircularProgress size={size} color="primary" />

      {/* MD3 Body Large Typography */}
      <p
        className="mt-6 text-center"
        style={{
          fontSize: "var(--md-sys-typescale-body-large-size)",
          lineHeight: "var(--md-sys-typescale-body-large-line-height)",
          fontWeight: "var(--md-sys-typescale-body-large-weight)",
          color: "hsl(var(--md-sys-color-on-surface-variant))",
        }}
      >
        {message}
      </p>
    </div>
  );
}
