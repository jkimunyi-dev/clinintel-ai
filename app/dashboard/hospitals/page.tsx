import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import HospitalsClient from "./HospitalsClient";

export default async function HospitalsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Only SUPER_ADMIN can access this page
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  // Fetch all hospitals
  const hospitals = await prisma.hospital.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { User: true, Patient: true, Payment: true },
      },
    },
  });

  // Serialize data for client component
  const serializedHospitals = hospitals.map(hospital => ({
    id: hospital.id,
    name: hospital.name,
    email: hospital.email,
    subscriptionStatus: hospital.subscriptionStatus,
    nextBillingDate: hospital.nextBillingDate?.toISOString() || null,
    isActive: hospital.isActive,
    userCount: hospital._count.User,
    patientCount: hospital._count.Patient,
    paymentCount: hospital._count.Payment,
  }));

  return <HospitalsClient hospitals={serializedHospitals} />;
}
