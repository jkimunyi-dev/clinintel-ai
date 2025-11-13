import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/files/:id - Get a specific file
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

    const file = await prisma.file.findFirst({
      where: {
        id,
        doctorId,
      },
      include: {
        Patient: true,
        Inference: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ file });
  } catch (error) {
    console.error('Get file error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/files/:id - Delete a file
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

    const file = await prisma.file.deleteMany({
      where: {
        id,
        doctorId,
      },
    });

    if (file.count === 0) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // TODO: Also delete physical file from storage

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete file error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
