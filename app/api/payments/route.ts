import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { initiateSTKPush, parsePaymentCallback, isPaymentSuccessful } from '@/lib/services/mpesa-payment';
import { activateSubscription } from '@/lib/services/hospital-subscription';

// GET /api/payments - Get payment history (Hospital Admin or Super Admin)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, hospitalId: true }
    });

    const { searchParams } = new URL(request.url);
    const hospitalId = searchParams.get('hospitalId');

    // Super admin can view all payments or specific hospital
    // Hospital admin can only view their own hospital's payments
    let whereClause: any = {};

    if (user?.role === 'SUPER_ADMIN') {
      if (hospitalId) {
        whereClause.hospitalId = hospitalId;
      }
    } else if (user?.role === 'HOSPITAL_ADMIN') {
      if (!user.hospitalId) {
        return NextResponse.json(
          { error: 'No hospital associated with your account' },
          { status: 400 }
        );
      }
      whereClause.hospitalId = user.hospitalId;
    } else {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        Hospital: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Get payments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/payments - Initiate a payment (Hospital Admin)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, hospitalId: true }
    });

    // Only hospital admins can initiate payments for their hospital
    if (user?.role !== 'HOSPITAL_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Hospital Admin access required' },
        { status: 403 }
      );
    }

    if (!user.hospitalId) {
      return NextResponse.json(
        { error: 'No hospital associated with your account' },
        { status: 400 }
      );
    }

    // Get hospital details
    const hospital = await prisma.hospital.findUnique({
      where: { id: user.hospitalId },
      select: {
        id: true,
        name: true,
        billingPhoneNumber: true,
        monthlyFee: true
      }
    });

    if (!hospital) {
      return NextResponse.json(
        { error: 'Hospital not found' },
        { status: 404 }
      );
    }

    const { phoneNumber, amount } = await request.json();

    // Use provided phone number or default to hospital billing phone
    const paymentPhone = phoneNumber || hospital.billingPhoneNumber;
    const paymentAmount = amount || Number(hospital.monthlyFee);

    // Initiate STK push
    const stkResponse = await initiateSTKPush(
      paymentPhone,
      paymentAmount,
      hospital.id
    );

    if (!stkResponse.status) {
      return NextResponse.json(
        { error: stkResponse.msg, details: stkResponse.error },
        { status: 400 }
      );
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        hospitalId: hospital.id,
        amount: paymentAmount,
        phoneNumber: paymentPhone,
        merchantRequestId: stkResponse.merchantRequestId,
        checkoutRequestId: stkResponse.checkoutRequestId || stkResponse.requestId || '',
        status: 'PENDING',
        metadata: {
          initiatedBy: session.user.id,
          hospitalName: hospital.name,
          paymentType: 'subscription',
          billingPeriod: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: stkResponse.msg,
      payment: {
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        checkoutRequestId: payment.checkoutRequestId,
        merchantRequestId: payment.merchantRequestId
      }
    });
  } catch (error) {
    console.error('Initiate payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
