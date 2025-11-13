"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function EditHospitalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [hospitalId, setHospitalId] = useState<string>("");
  const [hospitalName, setHospitalName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [monthlyFee, setMonthlyFee] = useState("");
  const [subscriptionStatus, setSubscriptionStatus] = useState("TRIAL");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    params.then((p) => {
      setHospitalId(p.id);
      fetchHospital(p.id);
    });
  }, []);

  const fetchHospital = async (id: string) => {
    try {
      const response = await fetch(`/api/hospitals/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch hospital");
      }

      setHospitalName(data.hospital.name);
      setEmail(data.hospital.email);
      setPhone(data.hospital.phone || "");
      setMonthlyFee(data.hospital.monthlyFee.toString());
      setSubscriptionStatus(data.hospital.subscriptionStatus);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const response = await fetch(`/api/hospitals/${hospitalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: hospitalName,
          email,
          phone: phone || null,
          monthlyFee: parseInt(monthlyFee),
          subscriptionStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update hospital");
      }

      router.push("/dashboard/hospitals");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
          Edit Hospital
        </h1>
        <p className="text-gray-600 mb-8">
          Update hospital information and settings
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
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

          <div>
            <label
              htmlFor="subscriptionStatus"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Subscription Status
            </label>
            <select
              id="subscriptionStatus"
              value={subscriptionStatus}
              onChange={(e) => setSubscriptionStatus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
            >
              <option value="TRIAL">Trial</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRED">Expired</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="PENDING_PAYMENT">Pending Payment</option>
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
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
