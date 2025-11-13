import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Users, FileText, Brain, TrendingUp, Activity, Clock, ArrowRight, Sparkles } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const [patientCount, fileCount, inferenceCount] = await Promise.all([
    prisma.patient.count({ where: { doctorId: session.user.id } }),
    prisma.file.count({ where: { doctorId: session.user.id } }),
    prisma.inference.count({
      where: { File: { doctorId: session.user.id } },
    }),
  ]);

  const recentPatients = await prisma.patient.findMany({
    where: { doctorId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-3xl blur-3xl"></div>
        <div className="relative bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200 p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Welcome back, {session.user.name?.split(' ')[0]}! 👋
                </span>
              </h1>
              <p className="text-gray-600 text-lg">
                Here's what's happening with your patients today
              </p>
            </div>
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-25"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-xl text-white">
                  <Sparkles className="h-8 w-8" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Patients Card */}
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-200"></div>
          <div className="relative bg-white rounded-2xl border border-gray-200 p-6 hover:border-blue-500:border-blue-500 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-500 w-12 h-12 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center text-sm text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>12.5%</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">
                Total Patients
              </p>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {patientCount}
              </p>
              <p className="text-xs text-gray-500">
                Active in your care
              </p>
            </div>
          </div>
        </div>

        {/* Files Card */}
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-200"></div>
          <div className="relative bg-white rounded-2xl border border-gray-200 p-6 hover:border-green-500:border-green-500 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-green-500 to-teal-500 w-12 h-12 rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center text-sm text-blue-600">
                <Activity className="h-4 w-4 mr-1" />
                <span>Active</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">
                Files Uploaded
              </p>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {fileCount}
              </p>
              <p className="text-xs text-gray-500">
                Medical records stored
              </p>
            </div>
          </div>
        </div>

        {/* AI Analyses Card */}
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-200"></div>
          <div className="relative bg-white rounded-2xl border border-gray-200 p-6 hover:border-purple-500:border-purple-500 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-12 h-12 rounded-xl flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center text-sm text-purple-600">
                <Sparkles className="h-4 w-4 mr-1" />
                <span>AI Powered</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">
                AI Analyses
              </p>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {inferenceCount}
              </p>
              <p className="text-xs text-gray-500">
                Insights generated
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/dashboard/patients/new"
          className="group relative overflow-hidden rounded-xl border border-gray-200 hover:border-blue-500:border-blue-500 bg-white p-6 transition-all hover:shadow-lg"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Add Patient</h3>
              <p className="text-sm text-gray-600">Create new patient record</p>
            </div>
          </div>
          <ArrowRight className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/dashboard/files/upload"
          className="group relative overflow-hidden rounded-xl border border-gray-200 hover:border-green-500:border-green-500 bg-white p-6 transition-all hover:shadow-lg"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Upload File</h3>
              <p className="text-sm text-gray-600">Add medical records</p>
            </div>
          </div>
          <ArrowRight className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/dashboard/chat"
          className="group relative overflow-hidden rounded-xl border border-gray-200 hover:border-purple-500:border-purple-500 bg-white p-6 transition-all hover:shadow-lg"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Brain className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">AI Assistant</h3>
              <p className="text-sm text-gray-600">Chat with AI doctor</p>
            </div>
          </div>
          <ArrowRight className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* Recent Patients */}
      <div className="relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-2xl blur"></div>
        <div className="relative bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Clock className="h-6 w-6 mr-2 text-blue-600" />
                Recent Patients
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Your most recently added patients
              </p>
            </div>
            <Link
              href="/dashboard/patients"
              className="group flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100:bg-blue-950 transition-all font-medium"
            >
              <span>View all</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {recentPatients.length === 0 ? (
              <div className="p-12 text-center">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No patients yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Get started by adding your first patient
                </p>
                <Link
                  href="/dashboard/patients/new"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold"
                >
                  <Users className="h-5 w-5 mr-2" />
                  Add Patient
                </Link>
              </div>
            ) : (
              recentPatients.map((patient) => (
                <Link
                  key={patient.id}
                  href={`/dashboard/patients/${patient.id}`}
                  className="p-6 hover:bg-gray-50:bg-slate-700/50 block transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gradient-to-br from-blue-500 to-indigo-500 w-12 h-12 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {patient.name[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600:text-blue-400 transition-colors">
                          {patient.name}
                        </h3>
                        <p className="text-sm text-gray-600 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Added {new Date(patient.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
