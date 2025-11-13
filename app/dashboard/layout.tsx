import { auth, signOut } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Brain, LayoutDashboard, Users, FileText, MessageSquare, Settings, LogOut, Menu, Lock, AlertCircle, Building2, DollarSign } from "lucide-react";
import { checkSubscriptionAccess } from "@/lib/middleware/subscription-check";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const userRole = session.user.role as "SUPER_ADMIN" | "HOSPITAL_ADMIN" | "DOCTOR" | undefined;

  const subscriptionCheck = await checkSubscriptionAccess(session.user.id);
  const { hasAccess, hospitalName, subscriptionStatus } = subscriptionCheck;

  // DEBUG LOGGING - REMOVE AFTER TESTING
  console.log("=== SUBSCRIPTION CHECK DEBUG ===");
  console.log("User ID:", session.user.id);
  console.log("User Role:", userRole);
  console.log("Hospital Name:", hospitalName);
  console.log("Subscription Status:", subscriptionStatus);
  console.log("Has Access:", hasAccess);
  console.log("Will Redirect:", !hasAccess && userRole !== "SUPER_ADMIN");
  console.log("================================");

  if (!hasAccess && userRole !== "SUPER_ADMIN") {
    console.log("🚨 REDIRECTING TO /payment-required");
    redirect("/payment-required");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white/80 backdrop-blur-md border-r border-gray-200 z-40">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-75"></div>
            <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
              <Brain className="h-5 w-5 text-white" />
            </div>
          </div>
          <span className="ml-3 text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            ClinIntelAI
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link
            href="/dashboard"
            className="group flex items-center px-3 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50:bg-blue-950/50 hover:text-blue-600:text-blue-400 transition-all"
          >
            <LayoutDashboard className="h-5 w-5 mr-3" />
            <span className="font-medium">Dashboard</span>
          </Link>
          
          {/* Super Admin Only: Hospitals Management */}
          {userRole === "SUPER_ADMIN" && (
            <>
              <Link
                href="/dashboard/hospitals"
                className="group flex items-center px-3 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50:bg-blue-950/50 hover:text-blue-600:text-blue-400 transition-all"
              >
                <Building2 className="h-5 w-5 mr-3" />
                <span className="font-medium">Hospitals</span>
              </Link>
              <Link
                href="/dashboard/payments"
                className="group flex items-center px-3 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50:bg-blue-950/50 hover:text-blue-600:text-blue-400 transition-all"
              >
                <DollarSign className="h-5 w-5 mr-3" />
                <span className="font-medium">Payments</span>
              </Link>
            </>
          )}

          {/* Hospital Admin Only: Doctors Management */}
          {userRole === "HOSPITAL_ADMIN" && (
            <Link
              href="/dashboard/doctors"
              className="group flex items-center px-3 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50:bg-blue-950/50 hover:text-blue-600:text-blue-400 transition-all"
            >
              <Users className="h-5 w-5 mr-3" />
              <span className="font-medium">Doctors</span>
            </Link>
          )}
          
          {/* Doctor & Hospital Admin: Patients */}
          {(userRole === "DOCTOR" || userRole === "HOSPITAL_ADMIN") && (
            <Link
              href="/dashboard/patients"
              className="group flex items-center px-3 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50:bg-blue-950/50 hover:text-blue-600:text-blue-400 transition-all"
            >
              <Users className="h-5 w-5 mr-3" />
              <span className="font-medium">Patients</span>
            </Link>
          )}
          
          {/* Doctor Only: Files and Chat */}
          {userRole === "DOCTOR" && (
            <>
              <Link
                href="/dashboard/files"
                className="group flex items-center px-3 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50:bg-blue-950/50 hover:text-blue-600:text-blue-400 transition-all"
              >
                <FileText className="h-5 w-5 mr-3" />
                <span className="font-medium">Files</span>
              </Link>
              
              <Link
                href="/dashboard/chat"
                className="group flex items-center px-3 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50:bg-blue-950/50 hover:text-blue-600:text-blue-400 transition-all"
              >
                <MessageSquare className="h-5 w-5 mr-3" />
                <span className="font-medium">AI Assistant</span>
              </Link>
            </>
          )}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {session?.user?.email}
                </p>
              </div>
            </div>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
            className="w-full"
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600:text-red-400 hover:bg-red-50:bg-red-950/50 rounded-lg transition-all"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="h-full px-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Medical Intelligence Platform
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-25"></div>
                <div className="relative bg-white px-4 py-2 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-700">
                    AI Powered 🚀
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
