import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function FilesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const files = await prisma.file.findMany({
    where: { doctorId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      Patient: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Files
          </h1>
          <p className="text-gray-600 mt-2">
            Manage uploaded patient files
          </p>
        </div>
        <Link
          href="/dashboard/files/upload"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition-colors"
        >
          Upload File
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {files.length === 0 ? (
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
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No files uploaded yet
            </h3>
            <p className="text-gray-600 mb-6">
              Upload your first patient file to get started
            </p>
            <Link
              href="/dashboard/files/upload"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition-colors"
            >
              Upload File
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {files.map((file) => (
              <div
                key={file.id}
                className="p-6 hover:bg-gray-50:bg-gray-750"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
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
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {file.fileName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Patient: {file.Patient.name} •{" "}
                          {(file.fileSize / 1024).toFixed(2)} KB •{" "}
                          {new Date(file.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        file.status === "ANALYZED"
                          ? "bg-green-100 text-green-800"
                          : file.status === "PROCESSING"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {file.status}
                    </span>
                    <Link
                      href={`/dashboard/files/${file.id}`}
                      className="text-blue-600 hover:text-blue-700:text-blue-300 font-medium text-sm"
                    >
                      Details & Reports
                    </Link>
                    <a
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-gray-700:text-gray-300 font-medium text-sm"
                    >
                      Download
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
