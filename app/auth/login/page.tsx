"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Brain, Mail, Lock, ArrowRight, Sparkles, Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/dashboard");
        router.refresh();
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
              Transform Patient Care with AI
            </h1>
            <p className="text-xl text-blue-100 mb-12 leading-relaxed">
              Intelligent medical data management powered by cutting-edge AI technology.
              Make faster, data-driven decisions.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">AI-Powered Insights</h3>
                <p className="text-blue-100">Advanced algorithms analyze patient data instantly</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Enterprise Security</h3>
                <p className="text-blue-100">HIPAA compliant with end-to-end encryption</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
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
                Welcome back
              </span>
            </h2>
            <p className="text-gray-600 text-lg">
              Sign in to continue to your dashboard
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-2xl blur"></div>
            <div className="relative bg-white rounded-2xl border border-gray-200 p-8 shadow-xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-red-500 rounded-lg blur opacity-20"></div>
                    <div className="relative bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Email Address
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
                      placeholder="doctor@example.com"
                    />
                  </div>
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
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
                  <div className="relative w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                    <span>{loading ? "Signing in..." : "Sign in"}</span>
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
                      New to ClinIntelAI?
                    </span>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700:text-blue-300 font-semibold transition-colors"
                  >
                    Create an account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            Protected by enterprise-grade security
          </div>
        </div>
      </div>
    </div>
  );
}
