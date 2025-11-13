import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { encryptPatientData, decryptPatientData } from '@/lib/encryption';

// GET /api/patients - Get all patients for the authenticated doctor
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const patients = await prisma.patient.findMany({
      where: { doctorId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { File: true, MedicalRecord: true },
        },
      },
    });

    // Decrypt sensitive data before sending
    const decryptedPatients = patients.map(patient => ({
      ...patient,
      ...decryptPatientData({
        email: patient.email,
        phone: patient.phone,
        medicalRecordNumber: patient.medicalRecordNumber,
        notes: patient.notes,
      }),
    }));

    return NextResponse.json({ patients: decryptedPatients });
  } catch (error) {
    console.error('Get patients error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/patients - Create a new patient
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();

    // Encrypt sensitive data before storing
    const encryptedData = encryptPatientData({
      email: data.email,
      phone: data.phone,
      medicalRecordNumber: data.medicalRecordNumber,
      notes: data.notes,
    });

    const patient = await prisma.patient.create({
      data: {
        doctorId: session.user.id,
        name: data.name,
        email: encryptedData.email,
        phone: encryptedData.phone,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender,
        medicalRecordNumber: encryptedData.medicalRecordNumber,
        notes: encryptedData.notes,
      },
    });

    // Return decrypted data
    const decryptedPatient = {
      ...patient,
      ...decryptPatientData({
        email: patient.email,
        phone: patient.phone,
        medicalRecordNumber: patient.medicalRecordNumber,
        notes: patient.notes,
      }),
    };

    return NextResponse.json({ patient: decryptedPatient }, { status: 201 });
  } catch (error) {
    console.error('Create patient error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
