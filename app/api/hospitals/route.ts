import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/hospitals - Get all hospitals (Super Admin only)
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
      select: { role: true }
    });

    if (user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    const hospitals = await prisma.hospital.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { 
            User: true, 
            Patient: true,
            Payment: true
          }
        }
      }
    });

    return NextResponse.json({ hospitals });
  } catch (error) {
    console.error('Get hospitals error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/hospitals - Create a new hospital (Super Admin only)
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
      select: { role: true }
    });

    if (user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    const data = await request.json();
    const {
      hospitalName,
      email,
      phone,
      monthlyFee,
      adminName,
      adminEmail,
      password
    } = data;

    // Validate required fields
    if (!hospitalName || !email || !adminName || !adminEmail || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if admin email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Admin email already exists' },
        { status: 409 }
      );
    }

    // Check if hospital email already exists
    const existingHospital = await prisma.hospital.findUnique({
      where: { email }
    });

    if (existingHospital) {
      return NextResponse.json(
        { error: 'Hospital email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    // Calculate trial end date (30 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);
    
    // Calculate next billing date (30 days from now)
    const nextBillingDate = new Date();
    nextBillingDate.setDate(nextBillingDate.getDate() + 30);

    // Create hospital and admin user in a transaction
    const hospital = await prisma.hospital.create({
      data: {
        name: hospitalName,
        email,
        phone: phone || null,
        billingPhoneNumber: phone || null,
        monthlyFee: monthlyFee || 5000,
        subscriptionStatus: 'TRIAL',
        trialEndsAt,
        nextBillingDate,
        User: {
          create: {
            name: adminName,
            email: adminEmail,
            passwordHash,
            role: 'HOSPITAL_ADMIN',
            isActive: true
          }
        }
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    return NextResponse.json({
      hospital,
      message: `Hospital created successfully with 30 day trial period`
    }, { status: 201 });
  } catch (error) {
    console.error('Create hospital error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
