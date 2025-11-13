import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/patients/:id - Get a specific patient
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doctorId = request.headers.get('x-doctor-id'); // Stub: should come from session

    if (!doctorId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const patient = await prisma.patient.findFirst({
      where: {
        id,
        doctorId,
      },
      include: {
        File: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ patient });
  } catch (error) {
    console.error('Get patient error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/patients/:id - Update a patient
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doctorId = request.headers.get('x-doctor-id'); // Stub: should come from session

    if (!doctorId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();

    const patient = await prisma.patient.updateMany({
      where: {
        id,
        doctorId, // Ensure doctor can only update their own patients
      },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        gender: data.gender,
        medicalRecordNumber: data.medicalRecordNumber,
        notes: data.notes,
      },
    });

    if (patient.count === 0) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update patient error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/patients/:id - Delete a patient
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doctorId = request.headers.get('x-doctor-id'); // Stub: should come from session

    if (!doctorId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const patient = await prisma.patient.deleteMany({
      where: {
        id,
        doctorId, // Ensure doctor can only delete their own patients
      },
    });

    if (patient.count === 0) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete patient error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
