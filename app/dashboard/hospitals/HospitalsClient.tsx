"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Hospital {
  id: string;
  name: string;
  email: string;
  subscriptionStatus: string;
  nextBillingDate: string | null;
  isActive: boolean;
  userCount: number;
  patientCount: number;
  paymentCount: number;
}

interface HospitalsClientProps {
  hospitals: Hospital[];
}

export default function HospitalsClient({ hospitals }: HospitalsClientProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (hospital: Hospital) => {
    if (!confirm(
      `Are you sure you want to delete ${hospital.name}? This will delete all users, patients, and data associated with this hospital.`
    )) {
      return;
    }

    setDeleting(hospital.id);
    try {
      const response = await fetch(`/api/hospitals/${hospital.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to delete hospital");
        return;
      }

      // Refresh the page to show updated list
      router.refresh();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete hospital");
    } finally {
      setDeleting(null);
    }
  };

  const activeCount = hospitals.filter(h => h.subscriptionStatus === "ACTIVE").length;
  const trialCount = hospitals.filter(h => h.subscriptionStatus === "TRIAL").length;
  const expiredCount = hospitals.filter(h => h.subscriptionStatus === "EXPIRED").length;

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Hospital Management
          </h1>
          <p className="mt-2 text-gray-600">
            Manage all hospitals in the ClinIntelAI system
          </p>
        </div>
        <Link
          href="/dashboard/hospitals/new"
          className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
        >
          <span className="flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Hospital
          </span>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Total Hospitals
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {hospitals.length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Active
                </p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {activeCount}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  On Trial
                </p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">
                  {trialCount}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Expired
                </p>
                <p className="text-3xl font-bold text-red-600 mt-1">
                  {expiredCount}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hospitals Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {hospitals.length === 0 ? (
          <div className="p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No hospitals yet
            </h3>
            <p className="mt-2 text-gray-600">
              Get started by creating a new hospital.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hospital
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patients
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next Billing
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {hospitals.map((hospital) => (
                  <tr
                    key={hospital.id}
                    className="hover:bg-gray-50:bg-gray-750"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {hospital.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {hospital.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {hospital.userCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {hospital.patientCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          hospital.subscriptionStatus === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : hospital.subscriptionStatus === "TRIAL"
                            ? "bg-yellow-100 text-yellow-800"
                            : hospital.subscriptionStatus === "EXPIRED"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {hospital.subscriptionStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {hospital.nextBillingDate
                        ? new Date(hospital.nextBillingDate).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                      <Link
                        href={`/dashboard/hospitals/${hospital.id}/edit`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Edit
                      </Link>
                      <button
                        className="text-red-600 hover:text-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleDelete(hospital)}
                        disabled={deleting === hospital.id}
                      >
                        {deleting === hospital.id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
