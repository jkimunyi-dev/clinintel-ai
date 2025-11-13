"use client";

import { useState } from "react";

interface Payment {
  id: string;
  hospitalName: string;
  hospitalEmail: string;
  hospitalSubscriptionStatus: string;
  amount: number;
  status: string;
  phoneNumber: string | null;
  mpesaReceiptNumber: string | null;
  checkoutRequestId: string | null;
  merchantRequestId: string | null;
  createdAt: string;
}

interface PaymentsClientProps {
  payments: Payment[];
}

export default function PaymentsClient({ payments }: PaymentsClientProps) {
  const [filter, setFilter] = useState<string>("all");

  const filteredPayments = payments.filter((payment) => {
    if (filter === "all") return true;
    return payment.status === filter.toUpperCase();
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-100 text-green-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200:bg-gray-600"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("success")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === "success"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200:bg-gray-600"
            }`}
          >
            Successful
          </button>
          <button
            onClick={() => setFilter("failed")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === "failed"
                ? "bg-red-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200:bg-gray-600"
            }`}
          >
            Failed
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === "pending"
                ? "bg-yellow-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200:bg-gray-600"
            }`}
          >
            Pending
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hospital
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                M-Pesa Receipt
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No payments found
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50:bg-gray-900/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {payment.hospitalName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {payment.hospitalEmail}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-900">
                      KES {payment.amount?.toLocaleString() || "0"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">
                      {payment.phoneNumber || "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono text-gray-900">
                      {payment.mpesaReceiptNumber || "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">
                      {new Date(payment.createdAt).toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
