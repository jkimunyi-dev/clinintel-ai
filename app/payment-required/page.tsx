"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, AlertTriangle, CreditCard, Phone, Mail } from "lucide-react";

export default function PaymentRequiredPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string>("");
  const [hospitalName, setHospitalName] = useState<string>("");
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [checkoutRequestId, setCheckoutRequestId] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    // Fetch user and subscription info
    fetch("/api/subscription-status")
      .then((res) => res.json())
      .then((data) => {
        setUserRole(data.userRole);
        setHospitalName(data.hospitalName);
        setSubscriptionStatus(data.subscriptionStatus);
        setIsLoadingData(false);
        
        // If they have access, redirect to dashboard
        if (data.hasAccess) {
          router.push("/dashboard");
        }
      })
      .catch((err) => {
        console.error("Error fetching subscription status:", err);
        setIsLoadingData(false);
      });
  }, [router]);

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
    const maxAttempts = 30; // 30 attempts x 2 seconds = 1 minute

    console.log(`🔄 Starting payment status polling for: ${requestId}`);

    const interval = setInterval(async () => {
      attempts++;
      console.log(`📡 Polling attempt ${attempts}/${maxAttempts} for payment status...`);

      try {
        const response = await fetch(`/api/payments/status?checkoutRequestId=${requestId}`);
        const data = await response.json();

        console.log(`📊 Payment status response:`, data);

        if (data.status === "SUCCESS") {
          console.log(`✅ Payment successful! Redirecting to dashboard...`);
          clearInterval(interval);
          // Show success message briefly before redirect
          setError("");
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 1000);
        } else if (data.status === "FAILED") {
          console.log(`❌ Payment failed`);
          clearInterval(interval);
          setError("Payment failed. Please try again.");
          setSuccess(false);
        } else if (attempts >= maxAttempts) {
          console.log(`⏱️ Payment verification timeout after ${maxAttempts} attempts`);
          clearInterval(interval);
          setError("Payment verification timeout. Please refresh the page or contact support.");
          setSuccess(false);
        } else {
          console.log(`⏳ Payment still pending (status: ${data.status})`);
        }
      } catch (err) {
        console.error("❌ Error checking payment status:", err);
        // Don't stop polling on individual errors
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setError("Unable to verify payment status. Please contact support.");
          setSuccess(false);
        }
      }
    }, 2000); // Poll every 2 seconds
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  // Doctor view - Cannot pay, must contact admin
  if (userRole === "DOCTOR") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-slate-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-t-2xl">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                <AlertTriangle className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white text-center">
              Payment Required
            </h1>
            <p className="text-white/90 text-center mt-2 text-sm">
              Your hospital subscription has {subscriptionStatus.toLowerCase()}
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Hospital Info */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">
                    Your Hospital
                  </p>
                  <p className="font-semibold text-slate-900">
                    {hospitalName}
                  </p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-semibold text-slate-900 mb-2">
                  Contact Your Administrator
                </h3>
                <p className="text-sm text-slate-600">
                  You cannot access the system until your hospital administrator renews the subscription.
                  Please contact them immediately.
                </p>
              </div>

              {/* Contact Methods */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Phone className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm text-slate-900">
                      Call your administrator
                    </p>
                    <p className="text-xs text-slate-600">
                      Request immediate subscription renewal
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <Mail className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm text-slate-900">
                      Send an email
                    </p>
                    <p className="text-xs text-slate-600">
                      Request subscription renewal via email
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800 text-center">
                <strong>Note:</strong> You cannot make payments directly. Only hospital administrators can renew subscriptions.
              </p>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => window.location.href = "/api/auth/signout"}
              className="w-full py-2 px-4 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Hospital Admin view - Can make payment
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 rounded-t-2xl">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
              <CreditCard className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white text-center">
            Payment Required
          </h1>
          <p className="text-white/90 text-center mt-2">
            Complete payment to access your dashboard
          </p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Hospital Info */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500">Hospital</p>
                <p className="font-semibold text-slate-900">{hospitalName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Status</p>
                <p className="font-semibold text-red-600">{subscriptionStatus}</p>
              </div>
            </div>
          </div>

          {/* Alert */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-900 text-sm">
                  Access Blocked
                </p>
                <p className="text-red-700 text-sm mt-1">
                  You cannot access the dashboard until payment is completed. All features are locked.
                </p>
              </div>
            </div>
          </div>

          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center mb-3">
                <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-green-900">Payment Request Sent!</h3>
              </div>
              <p className="text-green-700 mb-2">
                Check your phone for the M-Pesa prompt and enter your PIN to complete the payment.
              </p>
              <p className="text-green-700 text-sm">
                You will be automatically redirected to the dashboard once payment is confirmed.
              </p>
              <div className="mt-4 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePayment} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  M-Pesa Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0712345678 or +254712345678"
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={loading}
                />
                <p className="mt-2 text-xs text-slate-500">
                  You will receive an M-Pesa prompt on this number
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Amount to Pay:</span>
                  <span className="text-xl font-bold text-blue-600">KES 1</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Sandbox test amount</p>
              </div>

              <button
                type="submit"
                disabled={loading || !phoneNumber}
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? "Processing..." : "Pay with M-Pesa"}
              </button>
            </form>
          )}

          {/* Logout Button */}
          <button
            onClick={() => window.location.href = "/api/auth/signout"}
            className="w-full py-2 px-4 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
