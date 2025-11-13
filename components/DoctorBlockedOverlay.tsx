"use client";

import { ShieldAlert, Phone, Mail, Building2 } from "lucide-react";

interface DoctorBlockedOverlayProps {
  hospitalName: string;
  subscriptionStatus: string;
}

export default function DoctorBlockedOverlay({
  hospitalName,
  subscriptionStatus,
}: DoctorBlockedOverlayProps) {
  const getStatusMessage = () => {
    switch (subscriptionStatus) {
      case "EXPIRED":
        return "The hospital's subscription has expired";
      case "SUSPENDED":
        return "The hospital account has been suspended";
      case "PENDING_PAYMENT":
        return "Payment is pending for the hospital";
      default:
        return "Access is currently restricted";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-t-2xl">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
              <ShieldAlert className="w-12 h-12 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white text-center">
            Access Restricted
          </h2>
          <p className="text-white/90 text-center mt-2 text-sm">
            {getStatusMessage()}
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
                What should you do?
              </h3>
              <p className="text-sm text-slate-600">
                Please contact your hospital administrator to resolve this issue.
                They need to renew the subscription to restore access.
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
                    Speak directly with your hospital admin
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

          {/* Status Badge */}
          <div className="text-center pt-4 border-t border-slate-200">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 rounded-full border border-red-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-sm font-medium text-red-700">
                Subscription {subscriptionStatus.toLowerCase()}
              </span>
            </div>
          </div>

          {/* Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800 text-center">
              <strong>Note:</strong> You cannot make payments directly. Only
              hospital administrators can renew subscriptions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
