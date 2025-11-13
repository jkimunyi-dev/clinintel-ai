"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface UpgradeOverlayProps {
  hospitalName: string;
  subscriptionStatus: string;
  nextBillingDate?: string | null;
}

export default function UpgradeOverlay({
  hospitalName,
  subscriptionStatus,
  nextBillingDate
}: UpgradeOverlayProps) {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [checkoutRequestId, setCheckoutRequestId] = useState("");

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          amount: 1, // KES 1 for sandbox testing
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Payment initiation failed");
      }

      // Extract checkoutRequestId from the payment object
      const requestId = data.payment?.checkoutRequestId;
      
      if (!requestId) {
        throw new Error("No checkout request ID received from payment server");
      }

      setCheckoutRequestId(requestId);
      setSuccess(true);

      // Poll for payment status
      pollPaymentStatus(requestId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = async (requestId: string) => {
    let attempts = 0;
    const maxAttempts = 30; // Poll for 1 minute (every 2 seconds)

    const interval = setInterval(async () => {
      attempts++;

      try {
        const response = await fetch(`/api/payments/status?checkoutRequestId=${requestId}`);
        const data = await response.json();

        if (data.status === "SUCCESS") {
          clearInterval(interval);
          // Reload the page to reflect new subscription status
          window.location.reload();
        } else if (data.status === "FAILED") {
          clearInterval(interval);
          setError("Payment failed. Please try again.");
          setSuccess(false);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setError("Payment verification timeout. Please contact support.");
          setSuccess(false);
        }
      } catch (err) {
        console.error("Payment status check error:", err);
      }
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md">
      <div className="relative mx-4 max-w-2xl w-full">
        {/* Blurred background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-900/90 to-indigo-900/90 backdrop-blur-xl rounded-2xl" />
        
        {/* Content */}
        <div className="relative p-8 md:p-12">
          {/* Lock Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-orange-500 to-red-600 rounded-full">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-4">
            Upgrade to Access Features
          </h2>
          
          {/* Subtitle for Hospital Admin */}
          <p className="text-center text-blue-300 mb-6 font-medium">
            Hospital Administrator Access
          </p>

          {/* Subscription Status */}
          <div className="bg-white/10 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300">Hospital:</span>
              <span className="text-white font-semibold">{hospitalName}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300">Status:</span>
              <span className={`font-semibold ${
                subscriptionStatus === 'ACTIVE' ? 'text-green-400' :
                subscriptionStatus === 'TRIAL' ? 'text-yellow-400' :
                subscriptionStatus === 'EXPIRED' ? 'text-red-400' :
                'text-gray-400'
              }`}>
                {subscriptionStatus}
              </span>
            </div>
            {nextBillingDate && (
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Next Billing:</span>
                <span className="text-white">{new Date(nextBillingDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-center text-gray-300 mb-8">
            Your subscription has {subscriptionStatus === 'EXPIRED' ? 'expired' : 'not been activated'}. 
            Please complete the payment to access all features and continue managing patient data.
          </p>

          {success ? (
            <div className="bg-green-500/20 border border-green-500 rounded-lg p-6 mb-6">
              <div className="flex items-center mb-3">
                <svg className="w-6 h-6 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-green-400">Payment Request Sent!</h3>
              </div>
              <p className="text-green-300 mb-2">
                Check your phone for the M-Pesa prompt and enter your PIN to complete the payment.
              </p>
              <p className="text-green-300 text-sm">
                Waiting for payment confirmation...
              </p>
              <div className="mt-4 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePayment} className="space-y-6">
              {error && (
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {/* Payment Form */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  M-Pesa Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0712345678 or +254712345678"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={loading}
                />
                <p className="mt-2 text-xs text-gray-400">
                  You will receive an STK push prompt on this number
                </p>
              </div>

              {/* Amount */}
              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Amount:</span>
                  <span className="text-2xl font-bold text-white">KES 1.00</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Sandbox test amount</p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !phoneNumber}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  "Pay Now via M-Pesa"
                )}
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-8 text-center text-gray-400 text-sm">
            <p>Need help? Contact support at support@clinintelai.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
