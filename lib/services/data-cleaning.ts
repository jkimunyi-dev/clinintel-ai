/**
 * CSV Data Cleaning Pipeline
 * Validates, normalizes, and extracts required fields from medical CSV files
 */

import { MedicalRecord } from '@/lib/medical-data/schema';
import { mapCSVHeaders, validateRequiredFields } from './field-mapping';

export interface CleaningResult {
  success: boolean;
  cleanedData: MedicalRecord[];
  errors: string[];
  warnings: string[];
  metadata: {
    originalRows: number;
    cleanedRows: number;
    rowsRemoved: number;
    fieldsNormalized: string[];
    missingFields: string[];
    fieldMappings?: Array<{
      original: string;
      standard: string;
      confidence: string;
      category?: string;
    }>;
  };
}

export interface CleaningOptions {
  removeIncompleteRows?: boolean;
  fillMissingValues?: boolean;
  strictValidation?: boolean;
  requiredFields?: string[];
}

/**
 * Clean and validate medical CSV data
 */
export async function cleanMedicalCSVData(
  rawData: any[],
  options: CleaningOptions = {},
  originalHeaders?: string[]
): Promise<CleaningResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const cleanedData: MedicalRecord[] = [];
  const fieldsNormalized: string[] = [];
  const missingFields: string[] = [];
  let fieldMappings: any[] = [];

  const {
    removeIncompleteRows = true,
    fillMissingValues = true,
    strictValidation = false,
    requiredFields = ['visit_date', 'fasting_blood_glucose', 'hba1c']
  } = options;

  const originalRows = rawData.length;

  // Map CSV headers to standard fields if provided
  if (originalHeaders && originalHeaders.length > 0) {
    const mappingResult = mapCSVHeaders(originalHeaders);
    fieldMappings = mappingResult.mappings;
    
    // Log mapping results
    const exactMatches = mappingResult.mappings.filter(m => m.confidence === 'exact').length;
    const fuzzyMatches = mappingResult.mappings.filter(m => m.confidence === 'high').length;
    const unmappedCount = mappingResult.unmapped.length;
    
    console.log(`Field Mapping: ${exactMatches} exact, ${fuzzyMatches} fuzzy, ${unmappedCount} unmapped`);
    
    if (unmappedCount > 0) {
      warnings.push(`${unmappedCount} columns could not be mapped: ${mappingResult.unmapped.join(', ')}`);
    }
    
    // Remap raw data with standard field names
    rawData = rawData.map(row => {
      const remappedRow: any = {};
      for (let i = 0; i < originalHeaders.length; i++) {
        const originalKey = originalHeaders[i];
        const standardKey = mappingResult.mappedHeaders[i];
        remappedRow[standardKey] = row[originalKey];
      }
      return remappedRow;
    });
    
    // Validate required fields after mapping
    const validation = validateRequiredFields(mappingResult.mappedHeaders);
    if (!validation.valid) {
      warnings.push(`Missing required fields after mapping: ${validation.missing.join(', ')}`);
    }
  }

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    const rowNumber = i + 1;

    try {
      // Check for required fields
      const missing = requiredFields.filter(field => !row[field] && row[field] !== 0);
      
      if (missing.length > 0) {
        if (removeIncompleteRows) {
          warnings.push(`Row ${rowNumber}: Missing required fields [${missing.join(', ')}] - skipped`);
          missing.forEach(field => {
            if (!missingFields.includes(field)) {
              missingFields.push(field);
            }
          });
          continue;
        } else {
          warnings.push(`Row ${rowNumber}: Missing required fields [${missing.join(', ')}]`);
        }
      }

      // Clean and normalize the row
      const cleanedRow = cleanRow(row, fillMissingValues);
      
      // Validate data types and ranges
      const validationResult = validateRow(cleanedRow, strictValidation);
      
      if (!validationResult.valid) {
        if (strictValidation) {
          errors.push(`Row ${rowNumber}: ${validationResult.errors.join(', ')}`);
          continue;
        } else {
          warnings.push(`Row ${rowNumber}: ${validationResult.errors.join(', ')}`);
        }
      }

      // Convert to MedicalRecord format
      const medicalRecord = convertToMedicalRecord(cleanedRow, rowNumber);
      cleanedData.push(medicalRecord);

    } catch (error) {
      errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Track which fields were normalized
  if (cleanedData.length > 0) {
    const sampleRow = cleanedData[0];
    fieldsNormalized.push(...Object.keys(sampleRow).filter(key => key !== 'id'));
  }

  return {
    success: errors.length === 0,
    cleanedData,
    errors,
    warnings,
    metadata: {
      originalRows,
      cleanedRows: cleanedData.length,
      rowsRemoved: originalRows - cleanedData.length,
      fieldsNormalized,
      missingFields,
      fieldMappings
    }
  };
}

/**
 * Clean individual row
 */
function cleanRow(row: any, fillMissing: boolean): any {
  const cleaned: any = {};

  for (const [key, value] of Object.entries(row)) {
    const cleanKey = normalizeFieldName(key);
    
    // Handle missing values
    if (value === null || value === undefined || value === '' || value === 'N/A' || value === 'null') {
      if (fillMissing) {
        cleaned[cleanKey] = getDefaultValue(cleanKey);
      } else {
        cleaned[cleanKey] = null;
      }
      continue;
    }

    // Clean and normalize value
    cleaned[cleanKey] = normalizeValue(cleanKey, value);
  }

  return cleaned;
}

/**
 * Normalize field names to standard format
 */
function normalizeFieldName(field: string): string {
  return field
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[()]/g, '')
    .replace(/\//g, '_')
    .replace(/-/g, '_')
    .replace(/__+/g, '_');
}

/**
 * Normalize values based on field type
 */
function normalizeValue(field: string, value: any): any {
  // Date fields
  if (field.includes('date') || field === 'visit_date') {
    return normalizeDate(value);
  }

  // Numeric fields
  const numericFields = [
    'fasting_blood_glucose', 'hba1c', 'random_blood_glucose',
    'bp_systolic', 'bp_diastolic', 'heart_rate', 'weight', 'height', 'bmi',
    'total_cholesterol', 'ldl', 'hdl', 'triglycerides', 'creatinine', 'egfr',
    'urine_albumin', 'age'
  ];

  if (numericFields.includes(field)) {
    return normalizeNumber(value);
  }

  // Text fields - trim and clean
  if (typeof value === 'string') {
    return value.trim();
  }

  return value;
}

/**
 * Normalize date to ISO format
 */
function normalizeDate(value: any): string {
  if (!value) return new Date().toISOString().split('T')[0];
  
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      // Try parsing common formats
      const formats = [
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY
        /(\d{4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
        /(\d{1,2})-(\d{1,2})-(\d{4})/, // DD-MM-YYYY
      ];

      for (const format of formats) {
        const match = String(value).match(format);
        if (match) {
          const [, p1, p2, p3] = match;
          const parsed = new Date(`${p3}-${p2}-${p1}`);
          if (!isNaN(parsed.getTime())) {
            return parsed.toISOString().split('T')[0];
          }
        }
      }
      
      return new Date().toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Normalize number values
 */
function normalizeNumber(value: any): number | null {
  if (typeof value === 'number') return value;
  
  if (typeof value === 'string') {
    // Remove common non-numeric characters
    const cleaned = value.replace(/[,\s]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  
  return null;
}

/**
 * Get default value for missing fields
 */
function getDefaultValue(field: string): any {
  const defaults: Record<string, any> = {
    visit_type: 'regular',
    bp_systolic: null,
    bp_diastolic: null,
    heart_rate: null,
    weight: null,
    height: null,
    bmi: null,
    symptoms: '',
    medications: '',
    notes: '',
    diagnosis: '',
  };

  return defaults[field] ?? null;
}

/**
 * Validate row data
 */
function validateRow(row: any, strict: boolean): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate date
  if (row.visit_date) {
    const date = new Date(row.visit_date);
    if (isNaN(date.getTime())) {
      errors.push('Invalid visit date');
    }
  }

  // Validate numeric ranges
  const validations = [
    { field: 'fasting_blood_glucose', min: 0, max: 600, name: 'Fasting Blood Glucose' },
    { field: 'hba1c', min: 0, max: 20, name: 'HbA1c' },
    { field: 'bp_systolic', min: 0, max: 300, name: 'Systolic BP' },
    { field: 'bp_diastolic', min: 0, max: 200, name: 'Diastolic BP' },
    { field: 'heart_rate', min: 0, max: 250, name: 'Heart Rate' },
    { field: 'weight', min: 0, max: 500, name: 'Weight' },
    { field: 'height', min: 0, max: 300, name: 'Height' },
    { field: 'bmi', min: 0, max: 100, name: 'BMI' },
    { field: 'total_cholesterol', min: 0, max: 1000, name: 'Total Cholesterol' },
    { field: 'ldl', min: 0, max: 500, name: 'LDL' },
    { field: 'hdl', min: 0, max: 200, name: 'HDL' },
    { field: 'triglycerides', min: 0, max: 5000, name: 'Triglycerides' },
    { field: 'egfr', min: 0, max: 200, name: 'eGFR' },
  ];

  for (const { field, min, max, name } of validations) {
    const value = row[field];
    if (value !== null && value !== undefined && typeof value === 'number') {
      if (value < min || value > max) {
        errors.push(`${name} out of valid range (${min}-${max}): ${value}`);
      }
    }
  }

  return {
    valid: errors.length === 0 || !strict,
    errors
  };
}

/**
 * Convert cleaned row to MedicalRecord format
 */
function convertToMedicalRecord(row: any, index: number): MedicalRecord {
  return {
    patientId: row.patient_id || '',
    recordId: `cleaned_${Date.now()}_${index}`,
    providerId: row.provider_id || '',
    visitDate: row.visit_date || new Date().toISOString().split('T')[0],
    visitType: (row.visit_type as any) || 'routine',
    
    vitals: {
      bloodPressureSystolic: row.bp_systolic || undefined,
      bloodPressureDiastolic: row.bp_diastolic || undefined,
      heartRate: row.heart_rate || undefined,
      temperature: row.temperature || undefined,
      weight: row.weight || undefined,
      height: row.height || undefined,
      bmi: row.bmi || undefined,
    },

    labResults: {
      fastingBloodGlucose: row.fasting_blood_glucose || undefined,
      hba1c: row.hba1c || undefined,
      randomBloodGlucose: row.random_blood_glucose || undefined,
      totalCholesterol: row.total_cholesterol || undefined,
      ldlCholesterol: row.ldl || undefined,
      hdlCholesterol: row.hdl || undefined,
      triglycerides: row.triglycerides || undefined,
      creatinine: row.creatinine || undefined,
      eGFR: row.egfr || undefined,
      urineAlbumin: row.urine_albumin || undefined,
    },

    symptoms: parseArrayField(row.symptoms),
    medications: parseMedications(row.medications),
    diagnosis: parseArrayField(row.diagnosis),
    notes: row.notes || '',
    nextVisitDate: row.next_visit_date || undefined,
  };
}

/**
 * Parse array fields (symptoms, diagnosis)
 */
function parseArrayField(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value.split(/[,;]/).map(s => s.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Parse medications field
 */
function parseMedications(value: any): Array<{ name: string; dosage: string; frequency: string; startDate: string }> {
  if (!value) return [];
  
  if (Array.isArray(value)) return value;
  
  if (typeof value === 'string') {
    // Try to parse medication strings
    const meds = value.split(/[,;]/).map(s => s.trim()).filter(Boolean);
    return meds.map(med => ({
      name: med,
      dosage: '',
      frequency: '',
      startDate: ''
    }));
  }
  
  return [];
}

/**
 * Export cleaned data to CSV format
 */
export function exportToCSV(data: MedicalRecord[]): string {
  if (data.length === 0) return '';

  const headers = [
    'visit_date', 'visit_type',
    'bp_systolic', 'bp_diastolic', 'heart_rate', 'weight', 'height', 'bmi',
    'fasting_blood_glucose', 'hba1c', 'random_blood_glucose',
    'total_cholesterol', 'ldl', 'hdl', 'triglycerides', 'creatinine', 'egfr', 'urine_albumin',
    'symptoms', 'medications', 'diagnosis', 'notes'
  ];

  const rows = data.map(record => [
    record.visitDate,
    record.visitType,
    record.vitals?.bloodPressureSystolic ?? '',
    record.vitals?.bloodPressureDiastolic ?? '',
    record.vitals?.heartRate ?? '',
    record.vitals?.weight ?? '',
    record.vitals?.height ?? '',
    record.vitals?.bmi ?? '',
    record.labResults?.fastingBloodGlucose ?? '',
    record.labResults?.hba1c ?? '',
    record.labResults?.randomBloodGlucose ?? '',
    record.labResults?.totalCholesterol ?? '',
    record.labResults?.ldlCholesterol ?? '',
    record.labResults?.hdlCholesterol ?? '',
    record.labResults?.triglycerides ?? '',
    record.labResults?.creatinine ?? '',
    record.labResults?.eGFR ?? '',
    record.labResults?.urineAlbumin ?? '',
    record.symptoms?.join('; ') ?? '',
    record.medications?.map(m => m.name).join('; ') ?? '',
    record.diagnosis?.join('; ') ?? '',
    record.notes ?? ''
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
}
