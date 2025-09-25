import { useState, useEffect } from 'react';
import { Users, AlertTriangle, TrendingUp } from 'lucide-react';
import { getOrganizationMemberCount, getOrganizationById } from '../lib/supabase';
import { getMemberLimitInfo } from '../lib/subscriptionPlans';

interface MembershipProgressCardProps {
  organizationId: string;
  onLimitReached?: () => void;
}

export function MembershipProgressCard({ organizationId, onLimitReached }: MembershipProgressCardProps) {
  const [memberLimitInfo, setMemberLimitInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMembershipData = async () => {
      try {
        setLoading(true);
        
        // Get current member count
        const memberCount = await getOrganizationMemberCount(organizationId);
        
        // Get organization data to get subscription type
        const orgResult = await getOrganizationById(organizationId);
        
        if (orgResult.data) {
          const planId = orgResult.data.subscription_type || 'start';
          const limitInfo = getMemberLimitInfo(memberCount, planId);
          setMemberLimitInfo(limitInfo);
          
          if (limitInfo?.isAtLimit && onLimitReached) {
            onLimitReached();
          }
        }
      } catch (error) {
        console.error('Error loading membership data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (organizationId) {
      loadMembershipData();
    }
  }, [organizationId, onLimitReached]);

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="p-6">
          <div className="h-4 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="h-2 bg-gray-700 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (!memberLimitInfo) {
    return null;
  }

  const getProgressColor = () => {
    if (memberLimitInfo.isAtLimit) return 'bg-red-500';
    if (memberLimitInfo.isNearLimit) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusIcon = () => {
    if (memberLimitInfo.isAtLimit) return AlertTriangle;
    if (memberLimitInfo.isNearLimit) return AlertTriangle;
    return TrendingUp;
  };

  const StatusIcon = getStatusIcon();

  return (
    <div className="card hover:bg-gray-700/50 transition-colors">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-gray-700 p-2 rounded-full">
              <Users className="w-5 h-5 text-svpk-yellow" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-300">Medlemskap</h3>
              <p className="text-xs text-gray-400">{memberLimitInfo.plan.name}</p>
            </div>
          </div>
          <div className={`p-2 rounded-full ${
            memberLimitInfo.isAtLimit ? 'bg-red-500/20 text-red-400' :
            memberLimitInfo.isNearLimit ? 'bg-yellow-500/20 text-yellow-400' : 
            'bg-green-500/20 text-green-400'
          }`}>
            <StatusIcon className="w-4 h-4" />
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-bold text-white">
              {memberLimitInfo.currentCount}
            </span>
            <span className="text-sm text-gray-400">
              / {memberLimitInfo.isUnlimited ? '∞' : memberLimitInfo.limit}
            </span>
          </div>
          
          {!memberLimitInfo.isUnlimited && (
            <div className="w-full bg-gray-600 rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full transition-all ${getProgressColor()}`}
                style={{ width: `${Math.min(100, memberLimitInfo.usagePercentage)}%` }}
              />
            </div>
          )}
        </div>

        <div className="text-xs">
          {memberLimitInfo.isAtLimit ? (
            <p className="text-red-400">
              Medlemsgrensen er nådd. Oppgrader for å legge til flere medlemmer.
            </p>
          ) : memberLimitInfo.isNearLimit ? (
            <p className="text-yellow-400">
              {memberLimitInfo.remaining} medlemsplasser igjen av {memberLimitInfo.limit}.
            </p>
          ) : (
            <p className="text-green-400">
              {memberLimitInfo.isUnlimited ? 
                'Ubegrenset medlemskap' : 
                `${memberLimitInfo.remaining} plasser igjen`
              }
            </p>
          )}
        </div>
      </div>
    </div>
  );
}