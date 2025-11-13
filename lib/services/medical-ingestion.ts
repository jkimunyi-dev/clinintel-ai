/**
 * Medical Data Ingestion Service
 * Converts parsed files to structured medical records in the database
 */

import { prisma } from '@/lib/db';

export interface IngestionResult {
  success: boolean;
  recordsCreated: number;
  labResultsCreated: number;
  diagnosesCreated: number;
  errors: string[];
}

/**
 * Ingest structured medical data into the database
 */
export async function ingestMedicalData(
  patientId: string,
  fileId: string,
  data: Array<{
    recordType: string;
    recordDate: string;
    data: any;
    source: string;
  }>
): Promise<IngestionResult> {
  const result: IngestionResult = {
    success: true,
    recordsCreated: 0,
    labResultsCreated: 0,
    diagnosesCreated: 0,
    errors: [],
  };

  try {
    for (const item of data) {
      try {
        const recordData = item.data || {};
        
        // Safely extract symptoms as array of strings
        const symptoms = extractSymptoms(recordData);
        
        // Safely extract allergies as array of strings
        const allergies = extractAllergies(recordData);
        
        // Safely extract vital signs as JSON
        const vitalSigns = extractVitalSigns(recordData);
        
        // Safely extract medications as JSON
        const medications = extractMedications(recordData);
        
        // Safely extract chief complaint
        const chiefComplaint = extractString(recordData.chiefComplaint);
        
        // Safely extract notes
        const notes = extractString(recordData.notes);
        
        // Safely extract provider
        const provider = extractString(recordData.provider);
        
        // Safely extract recommendations
        const recommendations = extractString(recordData.recommendations);
        
        // Safely extract next visit
        const nextVisit = extractString(recordData.next_visit || recordData.nextVisit);
        
        // Safely extract physical exam
        const physicalExam = extractString(recordData.physicalExam);
        
        // Safely extract family history
        const familyHistory = extractString(recordData.familyHistory);
        
        // Safely extract social history
        const socialHistory = extractString(recordData.socialHistory);
        
        // Combine notes with provider, recommendations, and next visit for storage
        const combinedNotes = [
          notes,
          provider ? `Provider: ${provider}` : null,
          recommendations ? `Recommendations: ${recommendations}` : null,
          nextVisit ? `Next Visit: ${nextVisit}` : null,
        ].filter(Boolean).join('\n\n');

        // Create medical record with proper schema fields
        const medicalRecord = await prisma.medicalRecord.create({
          data: {
            patientId,
            fileId,
            recordType: item.recordType,
            recordDate: new Date(item.recordDate),
            chiefComplaint,
            symptoms,
            vitalSigns,
            physicalExam,
            medications,
            allergies,
            familyHistory,
            socialHistory,
            notes: combinedNotes || null,
          },
        });

        result.recordsCreated++;

        // Extract and create lab results from the data
        const labCount = await createLabResults(medicalRecord.id, recordData);
        result.labResultsCreated += labCount;

        // Extract and create diagnoses from the data
        const diagnosisCount = await createDiagnoses(medicalRecord.id, recordData);
        result.diagnosesCreated += diagnosisCount;
        
      } catch (error: any) {
        result.errors.push(`Failed to ingest record: ${error.message}`);
      }
    }
  } catch (error: any) {
    result.success = false;
    result.errors.push(error.message);
  }

  return result;
}

/**
 * Safely extract symptoms from data
 */
function extractSymptoms(data: any): string[] {
  if (!data.symptoms) return [];
  
  if (Array.isArray(data.symptoms)) {
    return data.symptoms
      .map((s: any) => String(s || '').trim())
      .filter((s: string) => s.length > 0);
  }
  
  if (typeof data.symptoms === 'string') {
    return data.symptoms
      .split(/[,;]/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);
  }
  
  return [];
}

/**
 * Safely extract allergies from data
 */
function extractAllergies(data: any): string[] {
  if (!data.allergies) return [];
  
  if (Array.isArray(data.allergies)) {
    return data.allergies
      .map((a: any) => String(a || '').trim())
      .filter((a: string) => a.length > 0);
  }
  
  if (typeof data.allergies === 'string') {
    return data.allergies
      .split(/[,;]/)
      .map((a: string) => a.trim())
      .filter((a: string) => a.length > 0);
  }
  
  return [];
}

/**
 * Safely extract vital signs from data
 */
function extractVitalSigns(data: any): any {
  const vitals = data.vitals || {};
  
  // Clean up vitals - remove undefined/null values
  const cleanVitals: any = {};
  
  if (vitals.bloodPressureSystolic !== undefined && vitals.bloodPressureSystolic !== null) {
    cleanVitals.bloodPressureSystolic = Number(vitals.bloodPressureSystolic) || null;
  }
  
  if (vitals.bloodPressureDiastolic !== undefined && vitals.bloodPressureDiastolic !== null) {
    cleanVitals.bloodPressureDiastolic = Number(vitals.bloodPressureDiastolic) || null;
  }
  
  if (vitals.heartRate !== undefined && vitals.heartRate !== null) {
    cleanVitals.heartRate = Number(vitals.heartRate) || null;
  }
  
  if (vitals.temperature !== undefined && vitals.temperature !== null) {
    cleanVitals.temperature = Number(vitals.temperature) || String(vitals.temperature) || null;
  }
  
  if (vitals.weight !== undefined && vitals.weight !== null) {
    cleanVitals.weight = Number(vitals.weight) || null;
  }
  
  if (vitals.height !== undefined && vitals.height !== null) {
    cleanVitals.height = Number(vitals.height) || null;
  }
  
  if (vitals.bmi !== undefined && vitals.bmi !== null) {
    cleanVitals.bmi = Number(vitals.bmi) || null;
  }
  
  return Object.keys(cleanVitals).length > 0 ? cleanVitals : null;
}

/**
 * Safely extract medications from data
 */
function extractMedications(data: any): any {
  if (!data.medications) return null;
  
  if (Array.isArray(data.medications)) {
    const cleanMeds = data.medications.map((med: any) => {
      if (typeof med === 'string') {
        return { name: med, dosage: null, frequency: null, startDate: null };
      }
      return {
        name: extractString(med.name) || 'Unknown',
        dosage: extractString(med.dosage),
        frequency: extractString(med.frequency),
        startDate: extractString(med.startDate),
      };
    }).filter((med: any) => med.name && med.name !== 'Unknown');
    
    return cleanMeds.length > 0 ? cleanMeds : null;
  }
  
  return null;
}

/**
 * Safely extract string value
 */
function extractString(value: any): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  
  const str = String(value).trim();
  return str.length > 0 ? str : null;
}

/**
 * Create lab results from structured data
 */
async function createLabResults(
  medicalRecordId: string,
  data: any
): Promise<number> {
  let count = 0;

  // Check if lab results are in nested structure
  const labData = data.labResults || data;

  // Common lab test mappings - support both snake_case and camelCase
  const labTests = [
    { fields: ['hba1c'], name: 'HbA1c', unit: '%', range: '<7%' },
    { fields: ['fasting_blood_glucose', 'fastingBloodGlucose', 'fbg'], name: 'Fasting Blood Glucose', unit: 'mg/dL', range: '70-100' },
    { fields: ['random_blood_glucose', 'randomBloodGlucose'], name: 'Random Blood Glucose', unit: 'mg/dL', range: '<140' },
    { fields: ['total_cholesterol', 'totalCholesterol'], name: 'Total Cholesterol', unit: 'mg/dL', range: '<200' },
    { fields: ['ldl', 'ldl_cholesterol', 'ldlCholesterol'], name: 'LDL Cholesterol', unit: 'mg/dL', range: '<100' },
    { fields: ['hdl', 'hdl_cholesterol', 'hdlCholesterol'], name: 'HDL Cholesterol', unit: 'mg/dL', range: '>40' },
    { fields: ['triglycerides'], name: 'Triglycerides', unit: 'mg/dL', range: '<150' },
    { fields: ['creatinine', 'serum_creatinine'], name: 'Creatinine', unit: 'mg/dL', range: '0.7-1.3' },
    { fields: ['egfr', 'gfr', 'eGFR'], name: 'eGFR', unit: 'mL/min/1.73m²', range: '>60' },
    { fields: ['urine_albumin', 'urineAlbumin'], name: 'Urine Albumin', unit: 'mg/L', range: '<30' },
  ];

  for (const test of labTests) {
    // Try all field variations
    let value: any = undefined;
    
    for (const field of test.fields) {
      if (labData[field] !== undefined && labData[field] !== null && labData[field] !== '') {
        value = labData[field];
        break;
      }
    }
    
    if (value !== undefined && value !== null) {
      try {
        const valueStr = String(value);
        const numericValue = parseFloat(valueStr);
        
        // Skip if value cannot be parsed
        if (isNaN(numericValue)) {
          continue;
        }
        
        const isAbnormal = !isValueNormal(test.name, numericValue);
        const performedAt = data.visitDate || data.recordDate 
          ? new Date(data.visitDate || data.recordDate)
          : new Date();

        await prisma.labResult.create({
          data: {
            medicalRecordId,
            testName: test.name,
            testValue: valueStr,
            unit: test.unit,
            referenceRange: test.range,
            isAbnormal,
            performedAt,
          },
        });

        count++;
      } catch (error) {
        console.error(`Failed to create lab result for ${test.name}:`, error);
      }
    }
  }

  return count;
}

/**
 * Check if a lab value is within normal range
 */
function isValueNormal(testName: string, value: number): boolean {
  const thresholds: Record<string, { min: number; max: number }> = {
    'HbA1c': { min: 0, max: 7 },
    'Fasting Blood Glucose': { min: 70, max: 100 },
    'Random Blood Glucose': { min: 0, max: 140 },
    'Total Cholesterol': { min: 0, max: 200 },
    'LDL Cholesterol': { min: 0, max: 100 },
    'HDL Cholesterol': { min: 40, max: Infinity },
    'Triglycerides': { min: 0, max: 150 },
    'Creatinine': { min: 0.7, max: 1.3 },
    'eGFR': { min: 60, max: Infinity },
    'Urine Albumin': { min: 0, max: 30 },
  };

  const threshold = thresholds[testName];
  if (!threshold) return true;

  return value >= threshold.min && value <= threshold.max;
}

/**
 * Create diagnoses from structured data
 */
async function createDiagnoses(
  medicalRecordId: string,
  data: any
): Promise<number> {
  let count = 0;

  // Check for diagnosis fields - could be in data.diagnosis or data directly
  const diagnosisFields = ['diagnosis', 'diagnoses', 'condition', 'conditions'];
  
  for (const field of diagnosisFields) {
    if (data[field]) {
      const diagnoses = Array.isArray(data[field]) ? data[field] : [data[field]];
      
      for (const diagnosis of diagnoses) {
        if (!diagnosis || (typeof diagnosis === 'string' && !diagnosis.trim())) {
          continue;
        }
        
        const diagnosisStr = String(diagnosis).trim();
        
        if (diagnosisStr.length > 0) {
          try {
            // Try to extract ICD-10 code if present
            const icd10Match = diagnosisStr.match(/\b([A-Z]\d{2}\.?\d{0,2})\b/);
            const code = icd10Match ? icd10Match[1] : null;
            
            // Clean diagnosis description
            const description = code 
              ? diagnosisStr.replace(code, '').trim()
              : diagnosisStr;

            const diagnosedAt = data.visitDate || data.recordDate 
              ? new Date(data.visitDate || data.recordDate)
              : new Date();

            await prisma.diagnosis.create({
              data: {
                medicalRecordId,
                code,
                description,
                severity: null,
                diagnosedAt,
              },
            });

            count++;
          } catch (error) {
            console.error('Failed to create diagnosis:', error);
          }
        }
      }
    }
  }

  return count;
}

/**
 * Ingest OCR results from medical images
 */
export async function ingestOCRData(
  patientId: string,
  fileId: string,
  ocrResult: {
    text: string;
    parsedData?: any;
  }
): Promise<IngestionResult> {
  const result: IngestionResult = {
    success: true,
    recordsCreated: 0,
    labResultsCreated: 0,
    diagnosesCreated: 0,
    errors: [],
  };

  try {
    const recordData = ocrResult.parsedData || {};
    
    // Safely extract data
    const symptoms = extractSymptoms(recordData);
    const allergies = extractAllergies(recordData);
    const vitalSigns = extractVitalSigns(recordData);
    const medications = extractMedications(recordData);
    const chiefComplaint = extractString(recordData.chiefComplaint);
    const physicalExam = extractString(recordData.physicalExam);
    const familyHistory = extractString(recordData.familyHistory);
    const socialHistory = extractString(recordData.socialHistory);
    
    // Create notes that include raw OCR text
    const notes = extractString(recordData.notes) || ocrResult.text;
    
    // Create a general medical record with the OCR data
    const medicalRecord = await prisma.medicalRecord.create({
      data: {
        patientId,
        fileId,
        recordType: 'note',
        recordDate: new Date(),
        chiefComplaint,
        symptoms,
        vitalSigns,
        physicalExam,
        medications,
        allergies,
        familyHistory,
        socialHistory,
        notes,
      },
    });

    result.recordsCreated++;

    // If parsed data contains lab results, create them
    if (ocrResult.parsedData?.labResults) {
      for (const lab of ocrResult.parsedData.labResults) {
        try {
          if (!lab.test || !lab.value) continue;
          
          const numericValue = parseFloat(String(lab.value));
          if (isNaN(numericValue)) continue;
          
          await prisma.labResult.create({
            data: {
              medicalRecordId: medicalRecord.id,
              testName: lab.test,
              testValue: String(lab.value),
              unit: extractString(lab.unit) || '',
              referenceRange: extractString(lab.range) || null,
              isAbnormal: false, // Default to false, can be improved
              performedAt: new Date(),
            },
          });
          result.labResultsCreated++;
        } catch (error) {
          console.error('Failed to create lab result from OCR:', error);
        }
      }
    }

    // If parsed data contains diagnoses, create them
    if (ocrResult.parsedData?.diagnoses) {
      const diagnosisCount = await createDiagnoses(medicalRecord.id, ocrResult.parsedData);
      result.diagnosesCreated += diagnosisCount;
    }
  } catch (error: any) {
    result.success = false;
    result.errors.push(error.message);
  }

  return result;
}
