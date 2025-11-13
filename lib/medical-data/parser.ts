import Papa from 'papaparse';
import { MedicalRecord, DIABETES_CSV_SCHEMA } from './schema';

export interface CSVParseResult {
  success: boolean;
  data?: MedicalRecord[];
  headers?: string[];
  rowCount?: number;
  errors?: string[];
  metadata?: {
    dateRange?: { start: string; end: string };
    averageHbA1c?: number;
    averageFastingGlucose?: number;
  };
}

/**
 * Parse medical CSV file
 */
export async function parseMedicalCSV(file: File | string): Promise<CSVParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          // Validate headers
          const headers = results.meta.fields || [];
          const validation = validateCSVHeaders(headers);
          
          if (!validation.valid) {
            resolve({
              success: false,
              errors: validation.errors,
            });
            return;
          }
          
          // Convert rows to MedicalRecord objects
          const records: MedicalRecord[] = results.data.map((row: any, index: number) => {
            try {
              return convertRowToMedicalRecord(row, index);
            } catch (error) {
              console.error(`Error parsing row ${index}:`, error);
              return null;
            }
          }).filter((record): record is MedicalRecord => record !== null);
          
          // Calculate metadata
          const metadata = calculateMetadata(records);
          
          resolve({
            success: true,
            data: records,
            headers,
            rowCount: records.length,
            metadata,
          });
        } catch (error) {
          resolve({
            success: false,
            errors: [`Parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`],
          });
        }
      },
      error: (error) => {
        resolve({
          success: false,
          errors: [`CSV parsing failed: ${error.message}`],
        });
      },
    });
  });
}

/**
 * Validate CSV headers against expected schema
 */
function validateCSVHeaders(headers: string[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const lowerHeaders = headers.map(h => h.toLowerCase().trim());
  
  // Check for required columns
  const requiredColumns = DIABETES_CSV_SCHEMA.required;
  const missingColumns: string[] = [];
  
  for (const required of requiredColumns) {
    if (!lowerHeaders.includes(required.toLowerCase())) {
      missingColumns.push(required);
    }
  }
  
  if (missingColumns.length > 0) {
    errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
  }
  
  // Warn about unknown columns (not an error)
  const knownColumns = Object.keys(DIABETES_CSV_SCHEMA.columns);
  const unknownColumns = lowerHeaders.filter(h => 
    !knownColumns.includes(h) && !DIABETES_CSV_SCHEMA.required.includes(h)
  );
  
  if (unknownColumns.length > 0) {
    console.warn('Unknown columns (will be ignored):', unknownColumns);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Convert CSV row to MedicalRecord
 */
function convertRowToMedicalRecord(row: any, index: number): MedicalRecord {
  const recordId = `REC-${Date.now()}-${index}`;
  
  // Helper to safely parse numbers
  const parseNum = (val: any): number | undefined => {
    const num = parseFloat(val);
    return isNaN(num) ? undefined : num;
  };
  
  // Helper to safely parse arrays (from semicolon-separated strings)
  const parseArray = (val: any): string[] | undefined => {
    if (!val || typeof val !== 'string') return undefined;
    return val.split(';').map(s => s.trim()).filter(s => s.length > 0);
  };
  
  return {
    patientId: row.patient_id || 'UNKNOWN',
    recordId,
    visitDate: row.visit_date || new Date().toISOString().split('T')[0],
    visitType: row.visit_type || 'routine',
    providerId: row.provider_id || 'DR-001',
    
    vitals: {
      bloodPressureSystolic: parseNum(row.bp_systolic),
      bloodPressureDiastolic: parseNum(row.bp_diastolic),
      heartRate: parseNum(row.heart_rate),
      temperature: parseNum(row.temperature),
      weight: parseNum(row.weight),
      height: parseNum(row.height),
      bmi: parseNum(row.bmi),
      oxygenSaturation: parseNum(row.oxygen_saturation),
    },
    
    labResults: {
      fastingBloodGlucose: parseNum(row.fasting_blood_glucose),
      hba1c: parseNum(row.hba1c),
      randomBloodGlucose: parseNum(row.random_blood_glucose),
      totalCholesterol: parseNum(row.total_cholesterol),
      ldlCholesterol: parseNum(row.ldl),
      hdlCholesterol: parseNum(row.hdl),
      triglycerides: parseNum(row.triglycerides),
      creatinine: parseNum(row.creatinine),
      eGFR: parseNum(row.egfr),
      urineAlbumin: parseNum(row.urine_albumin),
      alt: parseNum(row.alt),
      ast: parseNum(row.ast),
      hemoglobin: parseNum(row.hemoglobin),
      whiteBloodCellCount: parseNum(row.wbc),
    },
    
    symptoms: parseArray(row.symptoms),
    chiefComplaint: row.chief_complaint || row.symptoms?.split(';')[0]?.trim(),
    notes: row.notes,
    diagnosis: parseArray(row.diagnosis),
  };
}

/**
 * Calculate metadata from parsed records
 */
function calculateMetadata(records: MedicalRecord[]): CSVParseResult['metadata'] {
  if (records.length === 0) return {};
  
  // Find date range
  const dates = records
    .map(r => r.visitDate)
    .filter((d): d is string => !!d)
    .sort();
  
  // Calculate averages for key diabetes metrics
  const hba1cValues = records
    .map(r => r.labResults.hba1c)
    .filter((v): v is number => v !== undefined);
  
  const glucoseValues = records
    .map(r => r.labResults.fastingBloodGlucose)
    .filter((v): v is number => v !== undefined);
  
  const avgHbA1c = hba1cValues.length > 0
    ? hba1cValues.reduce((a, b) => a + b, 0) / hba1cValues.length
    : undefined;
  
  const avgGlucose = glucoseValues.length > 0
    ? glucoseValues.reduce((a, b) => a + b, 0) / glucoseValues.length
    : undefined;
  
  return {
    dateRange: dates.length > 0 ? {
      start: dates[0],
      end: dates[dates.length - 1],
    } : undefined,
    averageHbA1c: avgHbA1c ? Number(avgHbA1c.toFixed(1)) : undefined,
    averageFastingGlucose: avgGlucose ? Math.round(avgGlucose) : undefined,
  };
}

/**
 * Generate CSV from medical records
 */
export function generateCSVString(records: MedicalRecord[]): string {
  const headers = [
    'visit_date',
    'visit_type',
    'bp_systolic',
    'bp_diastolic',
    'heart_rate',
    'weight',
    'height',
    'bmi',
    'fasting_blood_glucose',
    'hba1c',
    'random_blood_glucose',
    'total_cholesterol',
    'ldl',
    'hdl',
    'triglycerides',
    'creatinine',
    'egfr',
    'urine_albumin',
    'symptoms',
    'diagnosis',
    'notes',
  ];
  
  const rows = records.map(record => [
    record.visitDate,
    record.visitType,
    record.vitals.bloodPressureSystolic || '',
    record.vitals.bloodPressureDiastolic || '',
    record.vitals.heartRate || '',
    record.vitals.weight || '',
    record.vitals.height || '',
    record.vitals.bmi || '',
    record.labResults.fastingBloodGlucose || '',
    record.labResults.hba1c || '',
    record.labResults.randomBloodGlucose || '',
    record.labResults.totalCholesterol || '',
    record.labResults.ldlCholesterol || '',
    record.labResults.hdlCholesterol || '',
    record.labResults.triglycerides || '',
    record.labResults.creatinine || '',
    record.labResults.eGFR || '',
    record.labResults.urineAlbumin || '',
    record.symptoms?.join('; ') || '',
    record.diagnosis?.join('; ') || '',
    record.notes || '',
  ]);
  
  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
}
