import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET /api/doctors - Get all doctors in a hospital (Hospital Admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, hospitalId: true }
    });

    // Only hospital admins can view doctors
    if (user?.role !== 'HOSPITAL_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Hospital Admin access required' },
        { status: 403 }
      );
    }

    if (!user.hospitalId) {
      return NextResponse.json(
        { error: 'No hospital associated with your account' },
        { status: 400 }
      );
    }

    const doctors = await prisma.user.findMany({
      where: {
        hospitalId: user.hospitalId,
        role: 'DOCTOR',
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        _count: {
          select: { Patient: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });    return NextResponse.json({ doctors });
  } catch (error) {
    console.error('Get doctors error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/doctors - Create a new doctor (Hospital Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, hospitalId: true }
    });

    // Only hospital admins can create doctors
    if (user?.role !== 'HOSPITAL_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Hospital Admin access required' },
        { status: 403 }
      );
    }

    if (!user.hospitalId) {
      return NextResponse.json(
        { error: 'No hospital associated with your account' },
        { status: 400 }
      );
    }

    const { name, email, password } = await request.json();

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, password' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create doctor
    const doctor = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'DOCTOR',
        hospitalId: user.hospitalId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      success: true,
      doctor,
      message: 'Doctor account created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Create doctor error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
