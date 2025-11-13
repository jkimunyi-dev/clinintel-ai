import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import FileAnalysisClient from "./FileAnalysisClient";

export default async function FileDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Fetch file with all related data
  const file = await prisma.file.findFirst({
    where: {
      id,
      doctorId: session.user.id,
    },
    include: {
      Patient: {
        select: {
          id: true,
          name: true,
        },
      },
      MedicalRecord: {
        include: {
          LabResult: true,
          Diagnosis: true,
        },
        orderBy: { recordDate: "desc" },
      },
      Inference: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!file) {
    notFound();
  }

  return <FileAnalysisClient file={file} userId={session.user.id} />;
}
