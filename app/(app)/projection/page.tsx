import { FinancialProjectionDashboard } from '@/components/projection/projection-dashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Financial Horizon | Horizon AI',
  description: 'Project your financial future and manage recurring expenses.',
};

export default function ProjectionPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <FinancialProjectionDashboard />
    </div>
  );
}
