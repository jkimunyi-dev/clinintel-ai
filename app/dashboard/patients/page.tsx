import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { decryptPatientData } from "@/lib/encryption";

export default async function PatientsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const patients = await prisma.patient.findMany({
    where: { doctorId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { File: true, MedicalRecord: true },
      },
    },
  });

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Patients
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your patient records
          </p>
        </div>
        <Link
          href="/dashboard/patients/new"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition-colors"
        >
          Add Patient
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {patients.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No patients yet
            </h3>
            <p className="text-gray-600 mb-6">
              Get started by adding your first patient
            </p>
            <Link
              href="/dashboard/patients/new"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition-colors"
            >
              Add Patient
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
                    Gender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Files
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Analyses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {patients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="hover:bg-gray-50:bg-gray-750"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {patient.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {patient.gender || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {patient._count.File}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {patient._count.MedicalRecord}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(patient.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <Link
                        href={`/dashboard/patients/${patient.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View
                      </Link>
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
