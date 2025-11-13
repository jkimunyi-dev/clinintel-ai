import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * POST /api/payments/callback - Handle M-Pesa payment callback
 * This endpoint is called by the M-Pesa server when a payment is completed
 */
export async function POST(request: NextRequest) {
  try {
    const callbackData = await request.json();

    console.log('=== M-PESA PAYMENT CALLBACK RECEIVED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Callback Data:', JSON.stringify(callbackData, null, 2));

    // Extract callback data
    const stkCallback = callbackData.Body?.stkCallback;
    
    if (!stkCallback) {
      console.error('❌ Invalid callback format - missing stkCallback');
      return NextResponse.json({ 
        ResultCode: 1, 
        ResultDesc: 'Invalid callback format' 
      });
    }

    const merchantRequestID = stkCallback.MerchantRequestID;
    const checkoutRequestID = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;
    const resultDesc = stkCallback.ResultDesc;

    console.log('📋 Callback Details:', {
      merchantRequestID,
      checkoutRequestID,
      resultCode,
      resultDesc
    });

    // Find the payment record
    console.log('🔍 Searching for payment record...');
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { merchantRequestId: merchantRequestID },
          { checkoutRequestId: checkoutRequestID }
        ]
      },
      include: {
        Hospital: true
      }
    });

    if (!payment) {
      console.error('❌ Payment record not found for:', {
        merchantRequestID,
        checkoutRequestID
      });
      console.log('💡 This might be a test payment or the payment record was not created');
      
      // Still return success to M-Pesa to prevent retries
      return NextResponse.json({ 
        ResultCode: 0, 
        ResultDesc: 'Accepted' 
      });
    }

    console.log('✅ Payment record found:', {
      paymentId: payment.id,
      hospitalId: payment.hospitalId,
      hospitalName: payment.Hospital?.name,
      currentStatus: payment.status
    });

    // Check if payment was successful
    if (resultCode === 0) {
      // Payment successful
      const callbackMetadata = stkCallback.CallbackMetadata?.Item || [];
      const amount = callbackMetadata.find((item: any) => item.Name === 'Amount')?.Value;
      const mpesaReceiptNumber = callbackMetadata.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value;
      const transactionDate = callbackMetadata.find((item: any) => item.Name === 'TransactionDate')?.Value;
      const phoneNumber = callbackMetadata.find((item: any) => item.Name === 'PhoneNumber')?.Value;

      console.log('💰 Payment Successful:', {
        amount,
        mpesaReceiptNumber,
        transactionDate,
        phoneNumber
      });

      // Update payment record
      console.log('📝 Updating payment record to SUCCESS...');
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCESS',
          mpesaReceiptNumber,
          phoneNumber: phoneNumber?.toString(),
          metadata: {
            amount,
            transactionDate,
            resultCode,
            resultDesc,
            callbackReceivedAt: new Date().toISOString()
          }
        }
      });

      // Update hospital subscription status
      const nextBillingDate = new Date();
      nextBillingDate.setDate(nextBillingDate.getDate() + 30); // 30 days subscription

      console.log('🏥 Activating hospital subscription...');
      await prisma.hospital.update({
        where: { id: payment.hospitalId },
        data: {
          subscriptionStatus: 'ACTIVE',
          nextBillingDate: nextBillingDate,
          isActive: true
        }
      });

      console.log('✅✅✅ SUBSCRIPTION ACTIVATED ✅✅✅');
      console.log('Hospital:', payment.Hospital?.name);
      console.log('Amount:', amount);
      console.log('Receipt:', mpesaReceiptNumber);
      console.log('Next Billing:', nextBillingDate.toISOString());
      console.log('==========================================');
    } else {
      // Payment failed
      console.log('❌ Payment failed with code:', resultCode);
      console.log('Reason:', resultDesc);
      
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          metadata: {
            resultCode,
            resultDesc,
            callbackReceivedAt: new Date().toISOString()
          }
        }
      });

      console.log('📝 Payment record updated to FAILED');
    }

    // Respond to M-Pesa
    console.log('✅ Sending acknowledgment to M-Pesa');
    return NextResponse.json({ 
      ResultCode: 0, 
      ResultDesc: 'Accepted' 
    });
  } catch (error) {
    console.error('❌❌❌ PAYMENT CALLBACK ERROR ❌❌❌');
    console.error(error);
    
    // Still return success to M-Pesa to prevent retries
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Accepted'
    });
  }
}

/**
 * GET /api/payments/callback - Endpoint info (not used by M-Pesa)
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'M-Pesa Payment Callback Endpoint',
    method: 'POST',
    description: 'This endpoint receives payment notifications from M-Pesa',
    callbackUrl: 'https://daraja-node.vercel.app/api/callback'
  });
}
