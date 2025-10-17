import { DashboardNav } from "@/components/dashboard";
import { cn } from "@/lib/utils";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn("min-h-screen", "bg-[hsl(var(--md-sys-color-surface))]")}>
      <DashboardNav />

      {/* Main content area with sidebar offset for desktop */}
      <main className={cn("md:pl-64 pt-16", "min-h-screen")}>{children}</main>
    </div>
  );
}
