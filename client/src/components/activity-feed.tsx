import { ActivityItem } from '@/lib/types';
import { formatDateTime } from '@/lib/types';
import { Activity, BadgeCheck, Clock, DollarSign, Edit, UserPlus, Zap } from 'lucide-react';

interface ActivityFeedProps {
  activities: ActivityItem[];
  className?: string;
  title?: string;
  showViewAll?: boolean;
  onViewAll?: () => void;
}

export function ActivityFeed({
  activities,
  className,
  title = "Recent Activities",
  showViewAll = true,
  onViewAll
}: ActivityFeedProps) {

  const getActivityIcon = (activity: ActivityItem) => {
    const IconComponent = getIconForActivity(activity.action, activity.entityType);
    return (
      <div className={`h-10 w-10 rounded-full ${activity.iconBg} flex items-center justify-center ring-8 ring-white`}>
        <IconComponent className={activity.icon} />
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      <div className="px-6 py-4 border-b border-neutral-200">
        <h2 className="text-lg font-medium text-neutral-500">{title}</h2>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="flow-root">
          <ul role="list" className="-mb-8">
            {activities.length > 0 ? (
              activities.map((activity, idx) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {idx !== activities.length - 1 && (
                      <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-neutral-200" aria-hidden="true"></span>
                    )}
                    <div className="relative flex items-start space-x-3">
                      <div className="relative">
                        {getActivityIcon(activity)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div>
                          <div className="text-sm">
                            <span className="font-medium text-neutral-500">{activity.userName}</span>
                            {' '}{getActivityDescription(activity)}
                          </div>
                          <p className="mt-0.5 text-sm text-neutral-400">{formatDateTime(activity.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="text-sm text-neutral-500 text-center py-4">No recent activities</li>
            )}
          </ul>
        </div>
        
        {showViewAll && activities.length > 0 && (
          <div className="mt-4 text-center">
            <button 
              className="text-primary text-sm hover:underline"
              onClick={onViewAll}
            >
              View all activity
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function getIconForActivity(action: string, entityType: string | null): React.ComponentType<any> {
  if (action === 'create' && entityType === 'employee') return UserPlus;
  if (action === 'create' && entityType === 'payrollItem') return DollarSign;
  if (action.includes('update')) return Edit;
  if (action.includes('approve')) return BadgeCheck;
  if (action.includes('login') || action.includes('logout')) return Clock;
  
  return Activity; 
}

function getActivityDescription(activity: ActivityItem): string {
  const entityName = activity.details?.split(':')[1]?.trim() || '';
  
  switch (`${activity.action}_${activity.entityType}`) {
    case 'create_employee':
      return `added ${entityName} as a new employee`;
    case 'update_employee':
      return `updated employee ${entityName}`;
    case 'create_payrollItem':
      return `processed payroll for ${entityName}`;
    case 'approve_approval':
      return `approved ${entityName}`;
    case 'login_user':
      return `logged in`;
    case 'logout_user':
      return `logged out`;
    default:
      return activity.details || `performed ${activity.action} on ${activity.entityType || 'system'}`;
  }
}
