import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST /api/analyze - Analyze a file (stub implementation)
export async function POST(request: NextRequest) {
  try {
    const doctorId = request.headers.get('x-doctor-id'); // Stub: should come from session

    if (!doctorId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { fileId, inferenceType, inputData } = await request.json();

    if (!fileId || !inferenceType) {
      return NextResponse.json(
        { error: 'fileId and inferenceType are required' },
        { status: 400 }
      );
    }

    // Verify file exists and belongs to doctor
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        doctorId,
      },
    });

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Update file status to processing
    await prisma.file.update({
      where: { id: fileId },
      data: { status: 'PROCESSING' },
    });

    // TODO: Implement actual AI analysis logic
    // This is a stub implementation
    const startTime = Date.now();

    // Simulate processing
    const stubOutput = {
      result: 'Analysis completed (stub)',
      analysisType: inferenceType,
      timestamp: new Date().toISOString(),
    };

    const processingTime = Date.now() - startTime;

    // Create inference record
    const inference = await prisma.inference.create({
      data: {
        fileId,
        inferenceType,
        inputData: inputData || {},
        outputData: stubOutput,
        confidence: 0.95, // Stub confidence score
        status: 'COMPLETED',
        doctorId,
      },
    });

    // Update file status to analyzed
    await prisma.file.update({
      where: { id: fileId },
      data: { status: 'ANALYZED' },
    });

    return NextResponse.json({
      success: true,
      inference,
    }, { status: 201 });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/analyze - Get all inferences
export async function GET(request: NextRequest) {
  try {
    const doctorId = request.headers.get('x-doctor-id'); // Stub: should come from session

    if (!doctorId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const fileId = searchParams.get('fileId');

    const inferences = await prisma.inference.findMany({
      where: {
        File: { doctorId },
        ...(fileId && { fileId }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        File: {
          select: {
            id: true,
            fileName: true,
            Patient: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ inferences });
  } catch (error) {
    console.error('Get inferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
