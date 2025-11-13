// Type exports from Prisma
export type {
  User,
  Patient,
  File,
  Inference,
  UserRole,
  Gender,
  FileStatus,
  InferenceStatus,
} from '@prisma/client';

// API Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface CreatePatientRequest {
  name: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  medicalRecordNumber?: string;
  notes?: string;
}

export interface UpdatePatientRequest extends Partial<CreatePatientRequest> {}

export interface UploadFileRequest {
  patientId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  metadata?: Record<string, any>;
}

export interface AnalyzeRequest {
  fileId: string;
  inferenceType: string;
  inputData?: Record<string, any>;
}

export interface ApiError {
  error: string;
}

// Extended types with relations
export interface PatientWithStats extends Patient {
  _count: {
    files: number;
    inferences: number;
  };
}

export interface FileWithRelations extends File {
  patient: {
    id: string;
    name: string;
  };
  _count: {
    inferences: number;
  };
}

export interface InferenceWithRelations extends Inference {
  file: {
    id: string;
    fileName: string;
  };
  patient: {
    id: string;
    name: string;
  };
}

// Import Prisma generated types for direct use
import type { Patient, User, File, Inference } from '@prisma/client';
