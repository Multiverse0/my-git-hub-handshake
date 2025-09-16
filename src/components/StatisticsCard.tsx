import { LucideIcon } from 'lucide-react';

interface StatisticsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  onClick?: () => void;
}

export function StatisticsCard({ title, value, icon: Icon, color, onClick }: StatisticsCardProps) {
  const colorClasses = {
    yellow: 'text-svpk-yellow',
    green: 'text-green-400',
    orange: 'text-orange-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    red: 'text-red-400'
  };

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`card ${onClick ? 'hover:bg-gray-700/50 transition-colors cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className={`text-2xl font-bold ${colorClasses[color as keyof typeof colorClasses] || 'text-white'}`}>
            {value}
          </p>
        </div>
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
    </Component>
  );
}