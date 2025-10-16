import { DashboardNav } from "@/components/dashboard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <DashboardNav />
      {children}
    </div>
  );
}
