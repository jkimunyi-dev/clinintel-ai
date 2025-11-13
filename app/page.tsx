import Link from "next/link";
import { ArrowRight, Brain, Shield, Zap, FileText, Users, TrendingUp, Sparkles, Check, ChevronRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-75"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                  <Brain className="h-6 w-6 text-white" />
                </div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                ClinIntelAI
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900:text-white transition-colors">
                Features
              </a>
              <a href="#benefits" className="text-gray-600 hover:text-gray-900:text-white transition-colors">
                Benefits
              </a>
              <Link 
                href="/auth/login"
                className="text-gray-600 hover:text-gray-900:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="relative group"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
                <div className="relative px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg text-white font-semibold">
                  Get Started
                </div>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/50 backdrop-blur-sm border border-gray-200 mb-8 animate-fade-in">
              <Sparkles className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">
                AI-Powered Medical Intelligence Platform
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
                Transform Medical Data
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Into Actionable Insights
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Leverage cutting-edge AI to analyze patient data, generate intelligent reports, 
              and make data-driven decisions faster than ever before.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/auth/register"
                className="group relative inline-flex items-center justify-center"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
                <div className="relative px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white font-semibold flex items-center space-x-2">
                  <span>Start Free Trial</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
              
              <button className="px-8 py-4 bg-white rounded-xl text-gray-900 font-semibold border border-gray-200 hover:border-gray-300:border-gray-600 transition-all hover:shadow-lg">
                Watch Demo
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>HIPAA Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>SOC 2 Certified</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>End-to-End Encrypted</span>
              </div>
            </div>
          </div>

          {/* Hero Image/Illustration */}
          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-3xl blur-3xl"></div>
            <div className="relative bg-white/40 backdrop-blur-xl rounded-3xl border border-gray-200 p-8 shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Mini Dashboard Preview */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 hover:scale-105 transition-transform">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Active Patients</h3>
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">2,847</div>
                  <div className="text-sm text-green-600">+12.5% from last month</div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200 hover:scale-105 transition-transform">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">AI Reports</h3>
                    <Brain className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">1,923</div>
                  <div className="text-sm text-purple-600">Generated this week</div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200 hover:scale-105 transition-transform">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Time Saved</h3>
                    <Zap className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">847hrs</div>
                  <div className="text-sm text-orange-600">This month</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to revolutionize your medical practice
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-200"></div>
              <div className="relative bg-white rounded-2xl p-8 border border-gray-200 hover:border-blue-500:border-blue-500 transition-all">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-500 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  AI-Powered Analysis
                </h3>
                <p className="text-gray-600">
                  Advanced machine learning algorithms analyze medical data and provide intelligent insights in seconds.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-200"></div>
              <div className="relative bg-white rounded-2xl p-8 border border-gray-200 hover:border-purple-500:border-purple-500 transition-all">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Enterprise Security
                </h3>
                <p className="text-gray-600">
                  Bank-level encryption, HIPAA compliance, and SOC 2 certification ensure your data is always protected.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-200"></div>
              <div className="relative bg-white rounded-2xl p-8 border border-gray-200 hover:border-orange-500:border-orange-500 transition-all">
                <div className="bg-gradient-to-br from-orange-500 to-red-500 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Automated Reports
                </h3>
                <p className="text-gray-600">
                  Generate comprehensive medical reports automatically with AI-powered insights and recommendations.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-200"></div>
              <div className="relative bg-white rounded-2xl p-8 border border-gray-200 hover:border-green-500:border-green-500 transition-all">
                <div className="bg-gradient-to-br from-green-500 to-teal-500 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Patient Management
                </h3>
                <p className="text-gray-600">
                  Comprehensive patient profiles with medical history, files, and AI-generated insights all in one place.
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-600 to-amber-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-200"></div>
              <div className="relative bg-white rounded-2xl p-8 border border-gray-200 hover:border-yellow-500:border-yellow-500 transition-all">
                <div className="bg-gradient-to-br from-yellow-500 to-amber-500 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Real-Time Processing
                </h3>
                <p className="text-gray-600">
                  Lightning-fast data processing and analysis with instant results and real-time updates.
                </p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-200"></div>
              <div className="relative bg-white rounded-2xl p-8 border border-gray-200 hover:border-cyan-500:border-cyan-500 transition-all">
                <div className="bg-gradient-to-br from-cyan-500 to-blue-500 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Advanced Analytics
                </h3>
                <p className="text-gray-600">
                  Powerful analytics and visualization tools to identify trends and patterns in patient data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-2xl opacity-20"></div>
            <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 md:p-16 text-center">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Transform Your Practice?
              </h2>
              <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
                Join thousands of healthcare professionals using ClinIntelAI to deliver better patient care.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/auth/register"
                  className="group inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl"
                >
                  <span>Get Started Free</span>
                  <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="px-8 py-4 bg-blue-700 text-white rounded-xl font-semibold hover:bg-blue-800 transition-all border border-blue-500">
                  Schedule Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-600 hover:text-gray-900:text-white transition-colors">Features</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900:text-white transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-gray-900:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-gray-900:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-gray-900:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900:text-white transition-colors">HIPAA</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Brain className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                ClinIntelAI
              </span>
            </div>
            <p className="text-gray-600 text-sm">
              © 2025 ClinIntelAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
