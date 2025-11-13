import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/hospitals/:id - Get a specific hospital
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Super admin can view any hospital
    // Hospital admin can only view their own hospital
    if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'HOSPITAL_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    if (user?.role === 'HOSPITAL_ADMIN' && user.hospitalId !== id) {
      return NextResponse.json(
        { error: 'Forbidden - Can only view your own hospital' },
        { status: 403 }
      );
    }

    const hospital = await prisma.hospital.findUnique({
      where: { id },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        },
        Payment: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            User: true,
            Patient: true,
            Payment: true
          }
        }
      }
    });

    if (!hospital) {
      return NextResponse.json(
        { error: 'Hospital not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ hospital });
  } catch (error) {
    console.error('Get hospital error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/hospitals/:id - Update a hospital
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Only super admin and hospital admin can update
    if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'HOSPITAL_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Hospital admin can only update their own hospital
    if (user?.role === 'HOSPITAL_ADMIN' && user.hospitalId !== id) {
      return NextResponse.json(
        { error: 'Forbidden - Can only update your own hospital' },
        { status: 403 }
      );
    }

    const data = await request.json();
    
    // Only super admin can update subscription-related fields
    const allowedFields: any = {
      name: data.name,
      email: data.email,
      phone: data.phone
    };

    if (user?.role === 'SUPER_ADMIN') {
      if (data.subscriptionStatus) allowedFields.subscriptionStatus = data.subscriptionStatus;
      if (data.monthlyFee !== undefined) allowedFields.monthlyFee = data.monthlyFee;
    }

    // Remove undefined fields
    Object.keys(allowedFields).forEach(key => {
      if (allowedFields[key] === undefined) delete allowedFields[key];
    });

    const hospital = await prisma.hospital.update({
      where: { id },
      data: allowedFields
    });

    return NextResponse.json({ hospital, message: 'Hospital updated successfully' });
  } catch (error) {
    console.error('Update hospital error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/hospitals/:id - Delete a hospital (Super Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Delete hospital and all related data (cascade)
    await prisma.hospital.delete({
      where: { id }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Hospital deleted successfully' 
    });
  } catch (error) {
    console.error('Delete hospital error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
