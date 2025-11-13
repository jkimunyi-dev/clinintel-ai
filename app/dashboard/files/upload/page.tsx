"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Patient {
  id: string;
  name: string;
}

export default function UploadFilePage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await fetch("/api/patients");
      const data = await response.json();
      if (response.ok) {
        setPatients(data.patients);
      }
    } catch (err) {
      console.error("Failed to fetch patients:", err);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!file || !selectedPatient) {
      setError("Please select a patient and file");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("patientId", selectedPatient);

      const response = await fetch("/api/files", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Upload failed");
      } else {
        router.push("/dashboard/files");
        router.refresh();
      }
    } catch (err) {
      setError("An error occurred during upload");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/dashboard/files"
          className="text-blue-600 hover:text-blue-700 font-medium mb-4 inline-flex items-center"
        >
          <svg
            className="w-5 h-5 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Files
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          Upload File
        </h1>
        <p className="text-gray-600 mt-2">
          Upload CSV files or medical documents
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="patient"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Select Patient *
            </label>
            <select
              id="patient"
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a patient...</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
            {patients.length === 0 && (
              <p className="mt-2 text-sm text-gray-600">
                No patients found.{" "}
                <Link
                  href="/dashboard/patients/new"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Add a patient first
                </Link>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File *
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileChange}
                accept=".csv,.xlsx,.xls,.pdf,.jpg,.jpeg,.png"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer"
              >
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
                {file ? (
                  <div className="text-gray-900">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-600">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setFile(null);
                      }}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Change file
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-2">
                      <span className="font-medium text-blue-600">Click to upload</span>{" "}
                      or drag and drop
                    </p>
                    <p className="text-sm text-gray-500">
                      CSV, Excel, PDF, or images (max 10MB)
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Link
              href="/dashboard/files"
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50:bg-gray-700 font-medium transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !file || !selectedPatient}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Uploading..." : "Upload File"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
