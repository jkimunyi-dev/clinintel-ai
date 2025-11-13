/**
 * Hospital Subscription Management Service
 * Handles subscription status checks and access control
 */

import { prisma } from '@/lib/db';
import { calculateNextBillingDate, isSubscriptionExpired } from './mpesa-payment';

export type SubscriptionStatus = 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'SUSPENDED' | 'PENDING_PAYMENT';

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  isActive: boolean;
  canAccessSystem: boolean;
  daysRemaining: number;
  nextBillingDate?: Date;
  message: string;
}

/**
 * Check if hospital can access the system
 */
export async function checkHospitalAccess(hospitalId: string): Promise<SubscriptionInfo> {
  const hospital = await prisma.hospital.findUnique({
    where: { id: hospitalId },
    select: {
      subscriptionStatus: true,
      trialEndsAt: true,
      nextBillingDate: true,
      lastPaymentDate: true,
    }
  });

  if (!hospital) {
    return {
      status: 'SUSPENDED',
      isActive: false,
      canAccessSystem: false,
      daysRemaining: 0,
      message: 'Hospital not found'
    };
  }

  const now = new Date();
  let daysRemaining = 0;
  let canAccessSystem = false;
  let message = '';

  // Check based on subscription status
  switch (hospital.subscriptionStatus) {
    case 'ACTIVE':
      if (hospital.nextBillingDate) {
        daysRemaining = Math.max(0, Math.floor(
          (hospital.nextBillingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        ));
        canAccessSystem = daysRemaining > 0;
        message = canAccessSystem 
          ? `Subscription active. ${daysRemaining} days remaining.`
          : 'Subscription expired. Please renew to continue.';
      } else {
        canAccessSystem = true;
        message = 'Subscription active';
      }
      break;

    case 'TRIAL':
      if (hospital.trialEndsAt) {
        daysRemaining = Math.max(0, Math.floor(
          (hospital.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        ));
        canAccessSystem = daysRemaining > 0;
        message = canAccessSystem
          ? `Trial period. ${daysRemaining} days remaining.`
          : 'Trial period expired. Please subscribe to continue.';
      } else {
        // Default trial period of 14 days
        canAccessSystem = true;
        message = 'Trial period active';
      }
      break;

    case 'PENDING_PAYMENT':
      // Allow grace period of 3 days
      if (hospital.nextBillingDate) {
        const gracePeriodEnd = new Date(hospital.nextBillingDate);
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3);
        canAccessSystem = now < gracePeriodEnd;
        daysRemaining = Math.max(0, Math.floor(
          (gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        ));
        message = canAccessSystem
          ? `Payment pending. ${daysRemaining} days of grace period remaining.`
          : 'Grace period expired. Please complete payment to continue.';
      } else {
        canAccessSystem = false;
        message = 'Payment required to access system';
      }
      break;

    case 'EXPIRED':
    case 'SUSPENDED':
      canAccessSystem = false;
      message = hospital.subscriptionStatus === 'SUSPENDED'
        ? 'Hospital account suspended. Please contact support.'
        : 'Subscription expired. Please renew to continue.';
      break;

    default:
      canAccessSystem = false;
      message = 'Invalid subscription status';
  }

  return {
    status: hospital.subscriptionStatus as SubscriptionStatus,
    isActive: canAccessSystem,
    canAccessSystem,
    daysRemaining,
    nextBillingDate: hospital.nextBillingDate || undefined,
    message
  };
}

/**
 * Update hospital subscription status after payment
 */
export async function activateSubscription(
  hospitalId: string,
  paymentId: string
): Promise<void> {
  const now = new Date();
  const nextBillingDate = calculateNextBillingDate(now);

  await prisma.hospital.update({
    where: { id: hospitalId },
    data: {
      subscriptionStatus: 'ACTIVE',
      lastPaymentDate: now,
      nextBillingDate,
    }
  });

  console.log(`Subscription activated for hospital ${hospitalId} until ${nextBillingDate}`);
}

/**
 * Check subscriptions and update expired ones (run as cron job)
 */
export async function updateExpiredSubscriptions(): Promise<{
  updated: number;
  expiredHospitals: string[];
}> {
  const now = new Date();

  // Find hospitals with active subscriptions that have expired
  const expiredHospitals = await prisma.hospital.findMany({
    where: {
      subscriptionStatus: 'ACTIVE',
      nextBillingDate: {
        lt: now
      }
    },
    select: {
      id: true,
      name: true,
      billingPhoneNumber: true
    }
  });

  // Update their status to PENDING_PAYMENT
  const updateResults = await prisma.hospital.updateMany({
    where: {
      id: {
        in: expiredHospitals.map(h => h.id)
      }
    },
    data: {
      subscriptionStatus: 'PENDING_PAYMENT'
    }
  });

  console.log(`Updated ${updateResults.count} expired subscriptions to PENDING_PAYMENT`);

  return {
    updated: updateResults.count,
    expiredHospitals: expiredHospitals.map(h => h.id)
  };
}

/**
 * Check trial periods and update expired ones
 */
export async function updateExpiredTrials(): Promise<{
  updated: number;
  expiredTrials: string[];
}> {
  const now = new Date();

  // Find hospitals with trial status that have expired
  const expiredTrials = await prisma.hospital.findMany({
    where: {
      subscriptionStatus: 'TRIAL',
      trialEndsAt: {
        lt: now
      }
    },
    select: {
      id: true,
      name: true,
      billingPhoneNumber: true
    }
  });

  // Update their status to EXPIRED
  const updateResults = await prisma.hospital.updateMany({
    where: {
      id: {
        in: expiredTrials.map(h => h.id)
      }
    },
    data: {
      subscriptionStatus: 'EXPIRED'
    }
  });

  console.log(`Updated ${updateResults.count} expired trials to EXPIRED`);

  return {
    updated: updateResults.count,
    expiredTrials: expiredTrials.map(h => h.id)
  };
}

/**
 * Get subscription statistics for admin dashboard
 */
export async function getSubscriptionStats(): Promise<{
  totalHospitals: number;
  activeSubscriptions: number;
  trialAccounts: number;
  expiredAccounts: number;
  pendingPayments: number;
  suspendedAccounts: number;
  monthlyRevenue: number;
}> {
  const [total, active, trial, expired, pending, suspended, payments] = await Promise.all([
    prisma.hospital.count(),
    prisma.hospital.count({ where: { subscriptionStatus: 'ACTIVE' } }),
    prisma.hospital.count({ where: { subscriptionStatus: 'TRIAL' } }),
    prisma.hospital.count({ where: { subscriptionStatus: 'EXPIRED' } }),
    prisma.hospital.count({ where: { subscriptionStatus: 'PENDING_PAYMENT' } }),
    prisma.hospital.count({ where: { subscriptionStatus: 'SUSPENDED' } }),
    prisma.payment.aggregate({
      where: {
        status: 'SUCCESS',
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      },
      _sum: {
        amount: true
      }
    })
  ]);

  return {
    totalHospitals: total,
    activeSubscriptions: active,
    trialAccounts: trial,
    expiredAccounts: expired,
    pendingPayments: pending,
    suspendedAccounts: suspended,
    monthlyRevenue: Number(payments._sum.amount || 0)
  };
}

/**
 * Check if user's hospital has active subscription
 */
export async function canUserAccessSystem(userId: string): Promise<{
  canAccess: boolean;
  reason?: string;
  subscriptionInfo?: SubscriptionInfo;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      hospitalId: true,
      isActive: true
    }
  });

  if (!user) {
    return {
      canAccess: false,
      reason: 'User not found'
    };
  }

  // Super admin always has access
  if (user.role === 'SUPER_ADMIN') {
    return {
      canAccess: true
    };
  }

  // Check if user account is active
  if (!user.isActive) {
    return {
      canAccess: false,
      reason: 'Your account has been deactivated. Please contact your hospital administrator.'
    };
  }

  // Check if user has a hospital
  if (!user.hospitalId) {
    return {
      canAccess: false,
      reason: 'No hospital associated with your account'
    };
  }

  // Check hospital subscription
  const subscriptionInfo = await checkHospitalAccess(user.hospitalId);

  return {
    canAccess: subscriptionInfo.canAccessSystem,
    reason: subscriptionInfo.canAccessSystem ? undefined : subscriptionInfo.message,
    subscriptionInfo
  };
}
