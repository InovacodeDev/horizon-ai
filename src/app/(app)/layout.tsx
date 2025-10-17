import { DashboardNav } from "@/components/dashboard";
import { cn } from "@/lib/utils";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn("min-h-screen", "bg-[hsl(var(--md-sys-color-surface-container-lowest))]")}>
      <DashboardNav />

      {/* Main content area with sidebar offset for desktop, header offset for all devices */}
      {/* Desktop: 256px sidebar (w-64) + 64px header (h-16) */}
      {/* Mobile: 56px header (h-14) */}
      <main className={cn("pt-14 md:pt-16 md:pl-64", "min-h-screen")}>{children}</main>
    </div>
  );
}
