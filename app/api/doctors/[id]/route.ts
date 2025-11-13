import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/doctors/:id - Get a specific doctor (Hospital Admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, hospitalId: true },
    });

    // Only hospital admins can view doctors
    if (user?.role !== "HOSPITAL_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!user.hospitalId) {
      return NextResponse.json(
        { error: "No hospital associated" },
        { status: 400 }
      );
    }

    // Fetch doctor in the same hospital
    const doctor = await prisma.user.findFirst({
      where: {
        id,
        hospitalId: user.hospitalId,
        role: "DOCTOR",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        _count: {
          select: { Patient: true },
        },
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    return NextResponse.json({ doctor });
  } catch (error) {
    console.error("Get doctor error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/doctors/:id - Update a doctor (Hospital Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, hospitalId: true },
    });

    if (user?.role !== "HOSPITAL_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!user.hospitalId) {
      return NextResponse.json(
        { error: "No hospital associated" },
        { status: 400 }
      );
    }

    const { name, email, isActive, password } = await request.json();

    // Verify doctor exists in the same hospital
    const existingDoctor = await prisma.user.findFirst({
      where: {
        id,
        hospitalId: user.hospitalId,
        role: "DOCTOR",
      },
    });

    if (!existingDoctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Check if email is already taken by another user
    if (email && email !== existingDoctor.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (typeof isActive === "boolean") updateData.isActive = isActive;

    // Hash password if provided
    if (password) {
      const bcrypt = await import("bcryptjs");
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedDoctor = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        lastLogin: true,
      },
    });

    return NextResponse.json({
      message: "Doctor updated successfully",
      doctor: updatedDoctor,
    });
  } catch (error) {
    console.error("Update doctor error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/doctors/:id - Delete a doctor (Hospital Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, hospitalId: true },
    });

    if (user?.role !== "HOSPITAL_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!user.hospitalId) {
      return NextResponse.json(
        { error: "No hospital associated" },
        { status: 400 }
      );
    }

    // Verify doctor exists in the same hospital
    const existingDoctor = await prisma.user.findFirst({
      where: {
        id,
        hospitalId: user.hospitalId,
        role: "DOCTOR",
      },
    });

    if (!existingDoctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Delete the doctor (cascade will handle patients and related data)
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Doctor deleted successfully",
    });
  } catch (error) {
    console.error("Delete doctor error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
