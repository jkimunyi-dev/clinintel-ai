import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import DoctorsClient from "./DoctorsClient";

export default async function DoctorsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Only HOSPITAL_ADMIN can access this page
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, hospitalId: true },
  });

  if (user?.role !== "HOSPITAL_ADMIN") {
    redirect("/dashboard");
  }

  if (!user.hospitalId) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">No hospital associated with your account.</p>
        </div>
      </div>
    );
  }

  // Fetch all doctors in the hospital
  const doctors = await prisma.user.findMany({
    where: {
      hospitalId: user.hospitalId,
      role: "DOCTOR",
    },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { Patient: true },
      },
    },
  });

  const hospital = await prisma.hospital.findUnique({
    where: { id: user.hospitalId },
    select: { name: true },
  });

  // Serialize data for client component
  const serializedDoctors = doctors.map(doctor => ({
    id: doctor.id,
    name: doctor.name,
    email: doctor.email,
    isActive: doctor.isActive,
    lastLogin: doctor.lastLogin?.toISOString() || null,
    patientCount: doctor._count.Patient,
  }));

  return (
    <DoctorsClient 
      doctors={serializedDoctors} 
      hospitalName={hospital?.name || "Unknown Hospital"} 
    />
  );
}
