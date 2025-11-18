import React from 'react';
import { AlertTriangleIcon } from '@/components/assets/Icons';

interface BillingLimitBannerProps {
  isVisible: boolean;
}

export const BillingLimitBanner: React.FC<BillingLimitBannerProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-6 flex items-start gap-3">
      <AlertTriangleIcon className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
      <div>
        <h4 className="text-sm font-medium text-warning">Limite do plano atingido</h4>
        <p className="text-sm text-on-surface-variant mt-1">
          Alguns dados podem não estar atualizados ou visíveis no momento devido aos limites do plano Appwrite.
          As funcionalidades serão restauradas assim que o limite for redefinido ou o plano for atualizado.
        </p>
      </div>
    </div>
  );
};
