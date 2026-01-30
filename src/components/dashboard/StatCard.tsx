import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
  iconClassName?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  className,
  iconClassName,
}: StatCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
              {trend && trendValue && (
                <span
                  className={cn(
                    'text-xs font-medium',
                    trend === 'up' && 'text-green-600',
                    trend === 'down' && 'text-red-600',
                    trend === 'neutral' && 'text-gray-500'
                  )}
                >
                  {trend === 'up' && '↑'}
                  {trend === 'down' && '↓'}
                  {trend === 'neutral' && '→'} {trendValue}
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs text-gray-400">{description}</p>
            )}
          </div>
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-lg',
              iconClassName
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
