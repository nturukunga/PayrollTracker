import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MetricsCardProps {
  title: string;
  value: string | number;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: ReactNode;
  iconBackground: string;
  subtitle?: string;
}

export function MetricsCard({
  title,
  value,
  change,
  changeType,
  icon,
  iconBackground,
  subtitle
}: MetricsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-neutral-400 text-sm font-medium">{title}</h3>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className={cn("p-2 rounded-full", iconBackground)}>
          {icon}
        </div>
      </div>
      <div className="flex items-center">
        <span className={cn(
          "text-sm flex items-center",
          changeType === 'positive' && "text-green-600",
          changeType === 'negative' && "text-red-600",
          changeType === 'neutral' && "text-neutral-500"
        )}>
          <span className="material-icons text-sm mr-1">
            {changeType === 'positive' ? 'arrow_upward' : changeType === 'negative' ? 'arrow_downward' : 'remove'}
          </span>
          <span>{change}</span>
        </span>
        <span className="text-neutral-400 text-sm ml-2">{subtitle || 'from last period'}</span>
      </div>
    </div>
  );
}
