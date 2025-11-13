import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/payments/status - Check payment status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const checkoutRequestId = searchParams.get('checkoutRequestId');

    if (!checkoutRequestId) {
      return NextResponse.json(
        { error: 'Checkout request ID is required' },
        { status: 400 }
      );
    }

    // Find payment in our database
    const payment = await prisma.payment.findFirst({
      where: { checkoutRequestId },
      include: {
        Hospital: true
      }
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // If payment is still pending, check the Daraja server for updates
    if (payment.status === 'PENDING') {
      try {
        console.log(`Checking Daraja server for payment status: ${checkoutRequestId}`);
        
        const darajaResponse = await fetch(
          `https://daraja-node.vercel.app/api/stkpush/status/${checkoutRequestId}`
        );

        if (darajaResponse.ok) {
          const darajaData = await darajaResponse.json();
          console.log('Daraja server response:', darajaData);

          // Check if we have transaction data from Daraja
          if (darajaData.success && darajaData.transaction) {
            const transaction = darajaData.transaction;
            
            // Check if transaction is completed or failed
            if (transaction.status === 'completed' || transaction.status === 'failed') {
              // Ensure resultCode is a number (Daraja sometimes sends it as string)
              const resultCode = typeof transaction.resultCode === 'number' 
                ? transaction.resultCode 
                : parseInt(String(transaction.resultCode), 10);
              
              const isSuccess = resultCode === 0;
              const newStatus = isSuccess ? 'SUCCESS' : 'FAILED';

              console.log(`🔄 Updating payment ${checkoutRequestId} to ${newStatus}`);

              // Parse M-Pesa transaction date (format: YYYYMMDDHHmmss -> 20251012110325)
              let parsedTransactionDate: Date | null = null;
              if (transaction.transactionDate) {
                const dateStr = String(transaction.transactionDate);
                // Format: YYYYMMDDHHmmss
                const year = dateStr.substring(0, 4);
                const month = dateStr.substring(4, 6);
                const day = dateStr.substring(6, 8);
                const hour = dateStr.substring(8, 10);
                const minute = dateStr.substring(10, 12);
                const second = dateStr.substring(12, 14);
                parsedTransactionDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
              }

              // Update payment record
              const updatedPayment = await prisma.payment.update({
                where: { id: payment.id },
                data: {
                  status: newStatus,
                  resultCode: resultCode, // Now guaranteed to be a number
                  resultDesc: transaction.resultDesc || 'Transaction completed',
                  mpesaReceiptNumber: transaction.mpesaReceiptNumber || null,
                  transactionDate: parsedTransactionDate,
                },
              });

              console.log(`✅ Payment ${checkoutRequestId} updated to ${newStatus}`);

              // If payment was successful, activate the subscription
              if (isSuccess) {
                const nextBillingDate = new Date();
                nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

                await prisma.hospital.update({
                  where: { id: payment.hospitalId },
                  data: {
                    subscriptionStatus: 'ACTIVE',
                    lastPaymentDate: new Date(),
                    nextBillingDate: nextBillingDate,
                  },
                });

                console.log(`✅ Hospital ${payment.hospitalId} subscription activated`);
              }

              return NextResponse.json({
                id: updatedPayment.id,
                status: updatedPayment.status,
                amount: updatedPayment.amount,
                mpesaReceiptNumber: updatedPayment.mpesaReceiptNumber,
                phoneNumber: updatedPayment.phoneNumber,
                createdAt: updatedPayment.createdAt,
                hospitalName: payment.Hospital.name,
              });
            } else {
              console.log(`⏳ Payment ${checkoutRequestId} still pending on Daraja (status: ${transaction.status})`);
            }
          }
        }
      } catch (darajaError) {
        console.error('Error checking Daraja server:', darajaError);
        // Continue with local status if Daraja check fails
      }
    }

    // Return current status from our database
    return NextResponse.json({
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      mpesaReceiptNumber: payment.mpesaReceiptNumber,
      phoneNumber: payment.phoneNumber,
      createdAt: payment.createdAt,
      hospitalName: payment.Hospital.name
    });
  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
