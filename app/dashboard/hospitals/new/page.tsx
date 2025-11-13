"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewHospitalPage() {
  const router = useRouter();
  const [hospitalName, setHospitalName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [monthlyFee, setMonthlyFee] = useState("5000");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/hospitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalName,
          email,
          phone,
          adminName,
          adminEmail,
          password,
          monthlyFee: parseInt(monthlyFee),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create hospital");
      }

      router.push("/dashboard/hospitals");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <Link
          href="/dashboard/hospitals"
          className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
        >
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Hospitals
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Add New Hospital
        </h1>
        <p className="text-gray-600 mb-8">
          Create a new hospital with admin account
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Hospital Information */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Hospital Information
            </h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="hospitalName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Hospital Name
                </label>
                <input
                  type="text"
                  id="hospitalName"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  placeholder="Nairobi General Hospital"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Hospital Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  placeholder="contact@hospital.com"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  placeholder="+254700000000"
                />
              </div>

              <div>
                <label
                  htmlFor="monthlyFee"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Monthly Fee (KES)
                </label>
                <input
                  type="number"
                  id="monthlyFee"
                  value={monthlyFee}
                  onChange={(e) => setMonthlyFee(e.target.value)}
                  required
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Admin Account */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Hospital Admin Account
            </h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="adminName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Admin Full Name
                </label>
                <input
                  type="text"
                  id="adminName"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label
                  htmlFor="adminEmail"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Admin Email
                </label>
                <input
                  type="email"
                  id="adminEmail"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  placeholder="admin@hospital.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Hospital"}
            </button>
            <Link
              href="/dashboard/hospitals"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50:bg-gray-700 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
