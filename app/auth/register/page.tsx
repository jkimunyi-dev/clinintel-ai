"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brain, Mail, Lock, User, ArrowRight, Sparkles, Shield, Check } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [hospitalName, setHospitalName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalName, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registration failed");
      } else {
        // Redirect to login after successful registration
        router.push("/auth/login?registered=true");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-white rounded-xl blur opacity-50"></div>
                <div className="relative bg-white/20 backdrop-blur-sm p-3 rounded-xl border border-white/30">
                  <Brain className="h-8 w-8 text-white" />
                </div>
              </div>
              <span className="text-3xl font-bold">ClinIntelAI</span>
            </div>
            
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Join the Future of Healthcare Management
            </h1>
            <p className="text-xl text-blue-100 mb-12 leading-relaxed">
              Register your hospital and experience AI-powered medical intelligence. 30-day free trial included.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 backdrop-blur-sm p-1.5 rounded-full">
                <Check className="h-5 w-5" />
              </div>
              <span className="text-lg">30-day free trial included</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 backdrop-blur-sm p-1.5 rounded-full">
                <Check className="h-5 w-5" />
              </div>
              <span className="text-lg">Unlimited doctors & patients</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 backdrop-blur-sm p-1.5 rounded-full">
                <Check className="h-5 w-5" />
              </div>
              <span className="text-lg">AI-powered insights & analytics</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 backdrop-blur-sm p-1.5 rounded-full">
                <Check className="h-5 w-5" />
              </div>
              <span className="text-lg">HIPAA compliant & secure</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 backdrop-blur-sm p-1.5 rounded-full">
                <Check className="h-5 w-5" />
              </div>
              <span className="text-lg">24/7 support & updates</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 overflow-y-auto">
        <div className="max-w-md w-full">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center space-x-2 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-75"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                  <Brain className="h-6 w-6 text-white" />
                </div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                ClinIntelAI
              </span>
            </Link>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-3">
              <span className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Register Your Hospital
              </span>
            </h2>
            <p className="text-gray-600 text-lg">
              Start your 30-day free trial today
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-2xl blur"></div>
            <div className="relative bg-white rounded-2xl border border-gray-200 p-8 shadow-xl">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-red-500 rounded-lg blur opacity-20"></div>
                    <div className="relative bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="hospitalName"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Hospital Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Shield className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="hospitalName"
                      type="text"
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="City General Hospital"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Admin Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="admin@hospital.com"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    This will be your login email
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Must be at least 8 characters
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full mt-6"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
                  <div className="relative w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                    <span>{loading ? "Registering hospital..." : "Register Hospital"}</span>
                    {!loading && <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                  </div>
                </button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">
                      Already have an account?
                    </span>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700:text-blue-300 font-semibold transition-colors"
                  >
                    Sign in instead
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-gray-500">
            By registering, you agree to our Terms of Service and Privacy Policy.<br />
            Your hospital admin account will be created automatically.
          </div>
        </div>
      </div>
    </div>
  );
}
