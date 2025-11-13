import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

/**
 * POST /api/auth/register - Hospital Registration Only
 * Creates a new hospital with a HOSPITAL_ADMIN user
 * 
 * Required fields:
 * - hospitalName: string
 * - email: string (will be the hospital admin's email)
 * - password: string
 * 
 * RBAC Rules:
 * - Only hospitals can register through this endpoint
 * - Creates Hospital with PENDING_PAYMENT status (NO FREE TRIAL)
 * - Auto-creates HOSPITAL_ADMIN user linked to the hospital
 * - Doctors CANNOT register here - they are created by hospital admins
 * - Payment required immediately to access dashboard
 */
export async function POST(request: NextRequest) {
  try {
    const { hospitalName, email, password } = await request.json();

    // Validation
    if (!hospitalName || !email || !password) {
      return NextResponse.json(
        { error: 'Hospital name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if hospital email already exists
    const existingHospital = await prisma.hospital.findUnique({
      where: { email },
    });

    if (existingHospital) {
      return NextResponse.json(
        { error: 'A hospital with this email already exists' },
        { status: 400 }
      );
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create hospital and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the hospital with PENDING_PAYMENT status (NO TRIAL)
      const hospital = await tx.hospital.create({
        data: {
          name: hospitalName,
          email,
          subscriptionStatus: 'PENDING_PAYMENT',
          subscriptionPlan: 'basic',
          monthlyFee: 5000, // KES 5,000 per month
          isActive: true,
        },
      });

      // 2. Create the hospital admin user
      const adminUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          name: `${hospitalName} Admin`, // Default name, can be updated later
          role: 'HOSPITAL_ADMIN',
          hospitalId: hospital.id,
          isActive: true,
        },
      });

      return { hospital, adminUser };
    });

    return NextResponse.json({
      success: true,
      message: 'Hospital registered successfully! Please complete payment to access the dashboard.',
      hospital: {
        id: result.hospital.id,
        name: result.hospital.name,
        email: result.hospital.email,
        subscriptionStatus: result.hospital.subscriptionStatus,
      },
      user: {
        id: result.adminUser.id,
        email: result.adminUser.email,
        name: result.adminUser.name,
        role: result.adminUser.role,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Hospital registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error during registration' },
      { status: 500 }
    );
  }
}
