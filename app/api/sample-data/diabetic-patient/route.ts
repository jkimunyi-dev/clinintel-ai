import { NextRequest, NextResponse } from 'next/server';
import { generateDiabeticPatientData, convertToCSV } from '@/lib/medical-data/generator';

/**
 * GET /api/sample-data/diabetic-patient
 * Generate and download sample diabetic patient CSV
 */
export async function GET(request: NextRequest) {
  try {
    // Generate sample patient data
    const patientId = 'PAT-SAMPLE-001';
    const records = generateDiabeticPatientData(patientId);
    
    // Convert to CSV
    const csvContent = convertToCSV(records);
    
    // Return as downloadable file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="diabetic_patient_6years.csv"',
      },
    });
  } catch (error) {
    console.error('Error generating sample data:', error);
    return NextResponse.json(
      { error: 'Failed to generate sample data' },
      { status: 500 }
    );
  }
}
