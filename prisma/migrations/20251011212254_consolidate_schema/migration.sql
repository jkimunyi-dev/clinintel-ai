-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('PENDING', 'UPLOADED', 'PROCESSING', 'ANALYZED', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "InferenceStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'TIMEOUT');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIAL', 'EXPIRED', 'SUSPENDED', 'PENDING_PAYMENT');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR');

-- CreateTable
CREATE TABLE "AgentKnowledge" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "agentType" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "knowledge" TEXT NOT NULL,
    "source" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentKnowledge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "patientId" TEXT,
    "agentType" TEXT NOT NULL,
    "messages" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diagnosis" (
    "id" TEXT NOT NULL,
    "medicalRecordId" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT NOT NULL,
    "severity" TEXT,
    "diagnosedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Diagnosis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "metadata" JSONB,
    "status" "FileStatus" NOT NULL DEFAULT 'PENDING',
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hospital" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "subscriptionPlan" TEXT NOT NULL DEFAULT 'basic',
    "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "billingPhoneNumber" TEXT,
    "monthlyFee" DOUBLE PRECISION NOT NULL DEFAULT 5000,
    "trialEndsAt" TIMESTAMP(3),
    "lastPaymentDate" TIMESTAMP(3),
    "nextBillingDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hospital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inference" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "inferenceType" TEXT NOT NULL,
    "inputData" JSONB NOT NULL,
    "outputData" JSONB,
    "confidence" DOUBLE PRECISION,
    "status" "InferenceStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "doctorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabResult" (
    "id" TEXT NOT NULL,
    "medicalRecordId" TEXT NOT NULL,
    "testName" TEXT NOT NULL,
    "testValue" TEXT NOT NULL,
    "unit" TEXT,
    "referenceRange" TEXT,
    "isAbnormal" BOOLEAN NOT NULL DEFAULT false,
    "performedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalRecord" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "recordDate" TIMESTAMP(3) NOT NULL,
    "recordType" TEXT NOT NULL,
    "chiefComplaint" TEXT,
    "symptoms" TEXT[],
    "vitalSigns" JSONB,
    "physicalExam" TEXT,
    "medications" JSONB,
    "allergies" TEXT[],
    "familyHistory" TEXT,
    "socialHistory" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",
    "medicalRecordNumber" TEXT,
    "notes" TEXT,
    "doctorId" TEXT NOT NULL,
    "hospitalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "insights" TEXT[],
    "recommendations" TEXT[],
    "riskScore" DECIMAL(5,2),
    "generatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "merchantRequestId" TEXT,
    "checkoutRequestId" TEXT NOT NULL,
    "mpesaReceiptNumber" TEXT,
    "transactionDate" TIMESTAMP(3),
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "resultCode" INTEGER,
    "resultDesc" TEXT,
    "billingPeriodStart" TIMESTAMP(3),
    "billingPeriodEnd" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'DOCTOR',
    "hospitalId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentKnowledge_doctorId_agentType_idx" ON "AgentKnowledge"("doctorId", "agentType");

-- CreateIndex
CREATE INDEX "ChatSession_doctorId_idx" ON "ChatSession"("doctorId");

-- CreateIndex
CREATE INDEX "ChatSession_patientId_idx" ON "ChatSession"("patientId");

-- CreateIndex
CREATE INDEX "Diagnosis_medicalRecordId_idx" ON "Diagnosis"("medicalRecordId");

-- CreateIndex
CREATE INDEX "File_doctorId_idx" ON "File"("doctorId");

-- CreateIndex
CREATE INDEX "File_patientId_idx" ON "File"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "Hospital_email_key" ON "Hospital"("email");

-- CreateIndex
CREATE INDEX "Hospital_subscriptionStatus_idx" ON "Hospital"("subscriptionStatus");

-- CreateIndex
CREATE INDEX "Inference_doctorId_idx" ON "Inference"("doctorId");

-- CreateIndex
CREATE INDEX "Inference_fileId_idx" ON "Inference"("fileId");

-- CreateIndex
CREATE INDEX "LabResult_medicalRecordId_idx" ON "LabResult"("medicalRecordId");

-- CreateIndex
CREATE INDEX "MedicalRecord_fileId_idx" ON "MedicalRecord"("fileId");

-- CreateIndex
CREATE INDEX "MedicalRecord_patientId_idx" ON "MedicalRecord"("patientId");

-- CreateIndex
CREATE INDEX "Patient_doctorId_idx" ON "Patient"("doctorId");

-- CreateIndex
CREATE INDEX "Patient_hospitalId_idx" ON "Patient"("hospitalId");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt");

-- CreateIndex
CREATE INDEX "Report_patientId_idx" ON "Report"("patientId");

-- CreateIndex
CREATE INDEX "Report_reportType_idx" ON "Report"("reportType");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_checkoutRequestId_key" ON "Payment"("checkoutRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_mpesaReceiptNumber_key" ON "Payment"("mpesaReceiptNumber");

-- CreateIndex
CREATE INDEX "Payment_hospitalId_idx" ON "Payment"("hospitalId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_hospitalId_idx" ON "User"("hospitalId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- AddForeignKey
ALTER TABLE "AgentKnowledge" ADD CONSTRAINT "AgentKnowledge_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inference" ADD CONSTRAINT "Inference_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inference" ADD CONSTRAINT "Inference_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;
