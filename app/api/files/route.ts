import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { parseFile, convertToMedicalRecords } from '@/lib/parsers/excel';
import { extractText, parseMedicalText } from '@/lib/ocr';
import { ingestMedicalData, ingestOCRData } from '@/lib/services/medical-ingestion';
import { cleanMedicalCSVData } from '@/lib/services/data-cleaning';

// GET /api/files - Get all files
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    const where = patientId
      ? { patientId, doctorId: session.user.id }
      : { doctorId: session.user.id };

    const files = await prisma.file.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        Patient: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { Inference: true },
        },
      },
    });    return NextResponse.json({ files });
  } catch (error) {
    console.error('Get files error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/files - Upload a file
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const patientId = formData.get('patientId') as string;

    if (!file || !patientId) {
      return NextResponse.json(
        { error: 'File and patientId are required' },
        { status: 400 }
      );
    }

    // Verify patient belongs to doctor
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        doctorId: session.user.id,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Initialize metadata and processing result
    let metadata: any = {};
    let ingestionResult: any = null;

    // Determine file type and process accordingly
    const isImage = file.type.startsWith('image/');
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv');

    // Update file status to processing
    await prisma.file.update({
      where: { id: 'temp' }, // Will be created first
      data: { status: 'PROCESSING' },
    }).catch(() => {}); // Ignore error for now

    // Process based on file type
    if (isCSV || isExcel) {
      // Parse CSV/Excel file
      try {
        const parseResult = await parseFile(buffer, file.name);
        
        if (parseResult.success && parseResult.data) {
          // Extract original headers for field mapping
          const originalHeaders = parseResult.headers || Object.keys(parseResult.data[0] || {});
          
          // Clean the parsed data before processing with original headers for mapping
          const cleaningResult = await cleanMedicalCSVData(parseResult.data, {
            removeIncompleteRows: true,
            fillMissingValues: true,
            strictValidation: false,
            requiredFields: ['visit_date', 'fasting_blood_glucose', 'hba1c']
          }, originalHeaders);

          metadata = {
            rowCount: parseResult.rowCount,
            columnCount: parseResult.columnCount,
            headers: parseResult.headers,
            sheetNames: parseResult.sheetNames,
            dateRange: parseResult.metadata?.dateRange,
            sample: parseResult.data.slice(0, 3), // First 3 rows
            cleaning: {
              success: cleaningResult.success,
              originalRows: cleaningResult.metadata.originalRows,
              cleanedRows: cleaningResult.metadata.cleanedRows,
              rowsRemoved: cleaningResult.metadata.rowsRemoved,
              errors: cleaningResult.errors,
              warnings: cleaningResult.warnings,
              fieldsNormalized: cleaningResult.metadata.fieldsNormalized,
              missingFields: cleaningResult.metadata.missingFields,
              fieldMappings: cleaningResult.metadata.fieldMappings // Add field mappings to metadata
            }
          };

          // Use cleaned data if cleaning was successful, otherwise use original
          const dataToUse = cleaningResult.success && cleaningResult.cleanedData.length > 0
            ? cleaningResult.cleanedData
            : parseResult.data;

          // Convert to medical records format for ingestion
          const medicalRecords = cleaningResult.success && cleaningResult.cleanedData.length > 0
            ? cleaningResult.cleanedData.map((record, idx) => ({
                ...record,
                recordType: 'clinical_visit',
                recordDate: record.visitDate,
                data: record,
                source: isExcel ? 'excel' : 'csv'
              }))
            : convertToMedicalRecords(dataToUse, parseResult.headers || []);

          // Update source to excel if needed
          if (isExcel) {
            medicalRecords.forEach(r => r.source = 'excel' as any);
          }

          // Store conversion result for later ingestion
          ingestionResult = {
            type: 'structured',
            records: medicalRecords,
            cleanedData: cleaningResult.cleanedData, // Store cleaned data separately
          };
        } else {
          metadata = { parseError: parseResult.errors?.join(', ') };
        }
      } catch (error: any) {
        console.error('File parsing error:', error);
        metadata = { parseError: error.message };
      }
    } else if (isImage) {
      // Extract text from image using OCR
      try {
        const ocrResult = await extractText(buffer, true); // Prefer cloud OCR
        
        if (ocrResult.text) {
          const parsedMedical = parseMedicalText(ocrResult.text);
          
          metadata = {
            ocrConfidence: ocrResult.confidence,
            textLength: ocrResult.text.length,
            extractedData: {
              patientInfo: parsedMedical.patientInfo,
              vitals: parsedMedical.vitals,
              labResultsCount: parsedMedical.labResults?.length || 0,
              medicationsCount: parsedMedical.medications?.length || 0,
              diagnosesCount: parsedMedical.diagnoses?.length || 0,
            },
          };

          // Store OCR result for ingestion
          ingestionResult = {
            type: 'ocr',
            text: ocrResult.text,
            parsedData: parsedMedical,
          };
        } else {
          metadata = { ocrError: 'No text extracted' };
        }
      } catch (error: any) {
        console.error('OCR error:', error);
        metadata = { ocrError: error.message };
      }
    }

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(
      buffer,
      `clinintelai/patient-${patientId}`,
      `${Date.now()}-${file.name.replace(/\s+/g, '-')}`
    );

    // Create file record in database
    const fileRecord = await prisma.file.create({
      data: {
        doctorId: session.user.id,
        patientId,
        fileName: file.name,
        fileUrl: uploadResult.url,
        publicId: uploadResult.publicId,
        fileType: file.type || 'application/octet-stream',
        fileSize: uploadResult.size,
        status: 'UPLOADED',
        metadata: {
          ...metadata,
          cloudinaryPublicId: uploadResult.publicId,
          cloudinaryFormat: uploadResult.format,
        },
      },
    });

    // Ingest structured data if available
    if (ingestionResult) {
      try {
        let ingestResult;
        
        if (ingestionResult.type === 'structured') {
          ingestResult = await ingestMedicalData(
            patientId,
            fileRecord.id,
            ingestionResult.records
          );
        } else if (ingestionResult.type === 'ocr') {
          ingestResult = await ingestOCRData(
            patientId,
            fileRecord.id,
            {
              text: ingestionResult.text,
              parsedData: ingestionResult.parsedData,
            }
          );
        }

        // Update file status
        await prisma.file.update({
          where: { id: fileRecord.id },
          data: {
            status: ingestResult?.success ? 'ANALYZED' : 'UPLOADED',
            metadata: {
              ...(fileRecord.metadata as any || {}),
              ingestion: JSON.parse(JSON.stringify(ingestResult)),
            },
          },
        });

        return NextResponse.json({
          file: fileRecord,
          ingestion: ingestResult,
        }, { status: 201 });
      } catch (ingestionError: any) {
        console.error('Ingestion error:', ingestionError);
        // File is uploaded but ingestion failed
        return NextResponse.json({
          file: fileRecord,
          ingestionError: ingestionError.message,
        }, { status: 201 });
      }
    }

    return NextResponse.json({ file: fileRecord }, { status: 201 });
  } catch (error) {
    console.error('Upload file error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
