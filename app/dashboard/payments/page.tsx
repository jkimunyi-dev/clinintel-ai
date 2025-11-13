import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import PaymentsClient from "./PaymentsClient";

export default async function PaymentsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Only SUPER_ADMIN can access this page
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  // Fetch all payments
  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      Hospital: {
        select: {
          name: true,
          email: true,
          subscriptionStatus: true,
        },
      },
    },
  });

  // Calculate statistics
  const stats = {
    total: payments.length,
    successful: payments.filter((p) => p.status === "SUCCESS").length,
    failed: payments.filter((p) => p.status === "FAILED").length,
    pending: payments.filter((p) => p.status === "PENDING").length,
    totalAmount: payments
      .filter((p) => p.status === "SUCCESS")
      .reduce((sum, p) => sum + (p.amount || 0), 0),
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Payment History
        </h1>
        <p className="mt-2 text-gray-600">
          View and manage all M-Pesa payments from hospitals
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Payments
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.total}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Successful
              </p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {stats.successful}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Failed
              </p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {stats.failed}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Pending
              </p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {stats.pending}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-100">
                Total Revenue
              </p>
              <p className="text-2xl font-bold mt-1">
                KES {stats.totalAmount.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <PaymentsClient
        payments={payments.map((p) => ({
          id: p.id,
          hospitalName: p.Hospital.name,
          hospitalEmail: p.Hospital.email,
          hospitalSubscriptionStatus: p.Hospital.subscriptionStatus,
          amount: p.amount,
          status: p.status,
          phoneNumber: p.phoneNumber,
          mpesaReceiptNumber: p.mpesaReceiptNumber,
          checkoutRequestId: p.checkoutRequestId,
          merchantRequestId: p.merchantRequestId,
          createdAt: p.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
