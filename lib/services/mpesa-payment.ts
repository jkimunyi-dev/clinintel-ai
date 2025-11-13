/**
 * M-Pesa Payment Integration Service
 * Handles STK Push requests to the payment server for hospital subscriptions
 */

const MPESA_API_URL = process.env.MPESA_API_URL || 'https://daraja-node.vercel.app';

export interface STKPushRequest {
  phone: string;
  amount: string | number;
  accountNumber: string;
}

export interface STKPushResponse {
  msg: string;
  status: boolean;
  requestId?: string;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  responseCode?: string;
  customerMessage?: string;
  error?: any;
}

export interface PaymentCallbackData {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: any;
        }>;
      };
    };
  };
}

/**
 * Initiate STK Push for M-Pesa payment via daraja-node server
 */
export async function initiateSTKPush(
  phoneNumber: string,
  amount: number,
  hospitalId: string
): Promise<STKPushResponse> {
  try {
    // Format phone number
    let formattedPhone = phoneNumber;
    if (phoneNumber.startsWith('+254')) {
      formattedPhone = phoneNumber.slice(1);
    } else if (phoneNumber.startsWith('0')) {
      formattedPhone = '254' + phoneNumber.slice(1);
    } else if (!phoneNumber.startsWith('254')) {
      formattedPhone = '254' + phoneNumber;
    }

    // Use the Daraja server's callback endpoint
    // The Daraja server at https://daraja-node.vercel.app will handle the M-Pesa callback
    const callbackUrl = 'https://daraja-node.vercel.app/api/callback';

    console.log('Initiating STK Push:', {
      phoneNumber: formattedPhone,
      amount,
      hospitalId,
      callbackUrl
    });

    // Call the daraja-node server for STK push
    const response = await fetch('https://daraja-node.vercel.app/api/stkpush', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: formattedPhone,
        amount: amount.toString(),
        accountNumber: hospitalId, // Use hospitalId as account reference
        callbackUrl: callbackUrl, // Custom callback URL
      }),
    });

    const data = await response.json();

    console.log('STK Push Response:', data);

    if (!data.status) {
      throw new Error(data.msg || 'Failed to initiate STK Push');
    }

    return {
      msg: data.msg,
      status: data.status,
      requestId: data.checkoutRequestId, // Match the actual field name from daraja-node
      merchantRequestId: data.merchantRequestId,
      checkoutRequestId: data.checkoutRequestId, // Add this for convenience
      responseCode: data.responseCode,
      customerMessage: data.customerMessage
    };
  } catch (error) {
    console.error('STK Push Error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to initiate STK Push');
  }
}

/**
 * Parse M-Pesa callback data
 */
export function parsePaymentCallback(callbackData: PaymentCallbackData): {
  merchantRequestId: string;
  checkoutRequestId: string;
  resultCode: number;
  resultDesc: string;
  amount?: number;
  mpesaReceiptNumber?: string;
  transactionDate?: Date;
  phoneNumber?: string;
} {
  const callback = callbackData.Body.stkCallback;
  
  const result: any = {
    merchantRequestId: callback.MerchantRequestID,
    checkoutRequestId: callback.CheckoutRequestID,
    resultCode: callback.ResultCode,
    resultDesc: callback.ResultDesc
  };

  // Extract metadata if payment was successful
  if (callback.CallbackMetadata) {
    callback.CallbackMetadata.Item.forEach(item => {
      switch (item.Name) {
        case 'Amount':
          result.amount = item.Value;
          break;
        case 'MpesaReceiptNumber':
          result.mpesaReceiptNumber = item.Value;
          break;
        case 'TransactionDate':
          // M-Pesa sends date as YYYYMMDDHHmmss
          const dateStr = item.Value.toString();
          const year = parseInt(dateStr.substring(0, 4));
          const month = parseInt(dateStr.substring(4, 6)) - 1;
          const day = parseInt(dateStr.substring(6, 8));
          const hour = parseInt(dateStr.substring(8, 10));
          const minute = parseInt(dateStr.substring(10, 12));
          const second = parseInt(dateStr.substring(12, 14));
          result.transactionDate = new Date(year, month, day, hour, minute, second);
          break;
        case 'PhoneNumber':
          result.phoneNumber = item.Value;
          break;
      }
    });
  }

  return result;
}

/**
 * Check if payment was successful
 */
export function isPaymentSuccessful(resultCode: number): boolean {
  return resultCode === 0;
}

/**
 * Get user-friendly error message for failed payment
 */
export function getPaymentErrorMessage(resultCode: number, resultDesc?: string): string {
  switch (resultCode) {
    case 0:
      return 'Payment successful';
    case 1:
      return 'Insufficient balance';
    case 1032:
      return 'Payment cancelled by user';
    case 1037:
      return 'Timeout - user did not enter PIN';
    case 2001:
      return 'Wrong PIN entered';
    default:
      return resultDesc || 'Payment failed. Please try again.';
  }
}

/**
 * Calculate next billing date (monthly subscription)
 */
export function calculateNextBillingDate(currentDate?: Date): Date {
  const date = currentDate || new Date();
  const nextMonth = new Date(date);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  return nextMonth;
}

/**
 * Check if subscription is expired
 */
export function isSubscriptionExpired(subscriptionEndDate?: Date | null): boolean {
  if (!subscriptionEndDate) return true;
  return new Date() > subscriptionEndDate;
}

/**
 * Check if subscription is expiring soon (within 7 days)
 */
export function isSubscriptionExpiringSoon(subscriptionEndDate?: Date | null): boolean {
  if (!subscriptionEndDate) return false;
  
  const now = new Date();
  const daysUntilExpiry = Math.floor(
    (subscriptionEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
}

/**
 * Format amount for display (KES)
 */
export function formatAmount(amount: number): string {
  return `KES ${amount.toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}
