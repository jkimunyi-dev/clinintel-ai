"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Doctor {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  lastLogin: string | null;
  patientCount: number;
}

interface DoctorsClientProps {
  doctors: Doctor[];
  hospitalName: string;
}

export default function DoctorsClient({ doctors, hospitalName }: DoctorsClientProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (doctor: Doctor) => {
    if (!confirm(
      `Are you sure you want to delete ${doctor.name}? This will also delete all their patients and data.`
    )) {
      return;
    }

    setDeleting(doctor.id);
    try {
      const response = await fetch(`/api/doctors/${doctor.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to delete doctor");
        return;
      }

      // Refresh the page to show updated list
      router.refresh();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete doctor");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Doctor Management
          </h1>
          <p className="mt-2 text-gray-600">
            Manage doctors for {hospitalName}
          </p>
        </div>
        <Link
          href="/dashboard/doctors/new"
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
            Add Doctor
          </span>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {doctors.length === 0 ? (
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No doctors yet
            </h3>
            <p className="mt-2 text-gray-600">
              Get started by creating a new doctor account.
            </p>
            <Link
              href="/dashboard/doctors/new"
              className="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add your first doctor
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patients
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {doctors.map((doctor) => (
                  <tr
                    key={doctor.id}
                    className="hover:bg-gray-50:bg-gray-750"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {doctor.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {doctor.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {doctor.patientCount} patients
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {doctor.isActive ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {doctor.lastLogin
                        ? new Date(doctor.lastLogin).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                      <Link
                        href={`/dashboard/doctors/${doctor.id}/edit`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Edit
                      </Link>
                      <button
                        className="text-red-600 hover:text-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleDelete(doctor)}
                        disabled={deleting === doctor.id}
                      >
                        {deleting === doctor.id ? "Deleting..." : "Delete"}
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
