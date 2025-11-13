/**
 * Subscription Check Middleware
 * Verifies if a hospital has an active subscription before allowing doctor access
 */

import { prisma } from '@/lib/db';

export interface SubscriptionCheck {
  hasAccess: boolean;
  subscriptionStatus: string;
  userRole: string;
  hospitalName?: string;
  reason?: string;
  trialEndsAt?: Date;
  nextBillingDate?: Date;
}

/**
 * Check if a user (doctor or hospital admin) has access based on subscription
 * 
 * RBAC Rules:
 * - SUPER_ADMIN: Always has access
 * - HOSPITAL_ADMIN: Has access if hospital is ACTIVE or TRIAL
 * - DOCTOR: Has access only if hospital subscription is ACTIVE or TRIAL
 */
export async function checkSubscriptionAccess(
  userId: string
): Promise<SubscriptionCheck> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        Hospital: {
          select: {
            id: true,
            name: true,
            subscriptionStatus: true,
            isActive: true,
            trialEndsAt: true,
            nextBillingDate: true,
          },
        },
      },
    });

    if (!user) {
      return {
        hasAccess: false,
        subscriptionStatus: 'UNKNOWN',
        userRole: 'UNKNOWN',
        reason: 'User not found',
      };
    }

    // SUPER_ADMIN always has access
    if (user.role === 'SUPER_ADMIN') {
      return {
        hasAccess: true,
        subscriptionStatus: 'ADMIN',
        userRole: user.role,
      };
    }

    // Check if user has a hospital
    if (!user.Hospital) {
      return {
        hasAccess: false,
        subscriptionStatus: 'NO_HOSPITAL',
        userRole: user.role,
        reason: 'No hospital associated with this account',
      };
    }

    const hospital = user.Hospital;

    // Check if hospital is active
    if (!hospital.isActive) {
      return {
        hasAccess: false,
        subscriptionStatus: hospital.subscriptionStatus,
        userRole: user.role,
        hospitalName: hospital.name,
        reason: 'Hospital account has been suspended',
      };
    }

    // Allowed subscription statuses for access (ONLY ACTIVE)
    // TRIAL, PENDING_PAYMENT, EXPIRED, and SUSPENDED should block access and redirect to payment
    const allowedStatuses = ['ACTIVE'];

    if (allowedStatuses.includes(hospital.subscriptionStatus)) {
      return {
        hasAccess: true,
        subscriptionStatus: hospital.subscriptionStatus,
        userRole: user.role,
        hospitalName: hospital.name,
        trialEndsAt: hospital.trialEndsAt || undefined,
        nextBillingDate: hospital.nextBillingDate || undefined,
      };
    }

    // Expired or suspended
    return {
      hasAccess: false,
      subscriptionStatus: hospital.subscriptionStatus,
      userRole: user.role,
      hospitalName: hospital.name,
      reason: getReasonForStatus(hospital.subscriptionStatus, user.role),
      trialEndsAt: hospital.trialEndsAt || undefined,
    };
  } catch (error) {
    console.error('Subscription check error:', error);
    return {
      hasAccess: false,
      subscriptionStatus: 'ERROR',
      userRole: 'UNKNOWN',
      reason: 'Error checking subscription status',
    };
  }
}

/**
 * Get human-readable reason for subscription status
 */
function getReasonForStatus(status: string, userRole: string): string {
  const isDoctor = userRole === 'DOCTOR';
  
  switch (status) {
    case 'EXPIRED':
      return isDoctor 
        ? 'Your hospital subscription has expired. Please contact your administrator to renew.'
        : 'Your hospital subscription has expired. Please renew to continue accessing features.';
    case 'SUSPENDED':
      return isDoctor
        ? 'Your hospital account has been suspended. Please contact your administrator.'
        : 'Your hospital account has been suspended. Please contact support.';
    case 'TRIAL':
      return 'Your hospital is on a free trial.';
    case 'ACTIVE':
      return 'Your subscription is active.';
    default:
      return 'Unable to verify subscription status.';
  }
}

/**
 * Check if a doctor can access features (for use in API routes)
 */
export async function requireActiveSubscription(userId: string): Promise<{
  allowed: boolean;
  error?: { message: string; status: number };
}> {
  const check = await checkSubscriptionAccess(userId);

  if (!check.hasAccess) {
    return {
      allowed: false,
      error: {
        message: check.reason || 'Access denied due to subscription status',
        status: 403,
      },
    };
  }

  return { allowed: true };
}
