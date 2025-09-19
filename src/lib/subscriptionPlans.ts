export interface SubscriptionPlan {
  id: string;
  name: string;
  memberLimit: number;
  features: string[];
  price?: string;
  custom?: boolean;
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  start: {
    id: 'start',
    name: 'Start',
    memberLimit: 100,
    features: [
      'Opptil 100 medlemmer',
      'Treningslogg',
      'QR-kode skanning',
      'Medlemshåndtering'
    ],
    price: 'Gratis'
  },
  ubegrenset: {
    id: 'ubegrenset',
    name: 'Ubegrenset',
    memberLimit: -1, // Unlimited
    features: [
      'Ubegrenset antall medlemmer',
      'Alle funksjoner',
      'Prioritert støtte'
    ],
    price: 'Kontakt oss'
  }
};

export function getSubscriptionPlan(planId: string): SubscriptionPlan | null {
  return SUBSCRIPTION_PLANS[planId] || null;
}

export function getAllSubscriptionPlans(): SubscriptionPlan[] {
  return Object.values(SUBSCRIPTION_PLANS);
}

export function canAddMember(currentMemberCount: number, planId: string): boolean {
  const plan = getSubscriptionPlan(planId);
  if (!plan) return false;
  
  // Unlimited members
  if (plan.memberLimit === -1) return true;
  
  return currentMemberCount < plan.memberLimit;
}

export function getMemberLimitInfo(currentMemberCount: number, planId: string) {
  const plan = getSubscriptionPlan(planId);
  if (!plan) return null;
  
  const isUnlimited = plan.memberLimit === -1;
  const remaining = isUnlimited ? -1 : Math.max(0, plan.memberLimit - currentMemberCount);
  const usagePercentage = isUnlimited ? 0 : Math.min(100, (currentMemberCount / plan.memberLimit) * 100);
  
  return {
    plan,
    currentCount: currentMemberCount,
    limit: plan.memberLimit,
    remaining,
    usagePercentage,
    isUnlimited,
    isNearLimit: !isUnlimited && usagePercentage >= 80,
    isAtLimit: !isUnlimited && currentMemberCount >= plan.memberLimit
  };
}