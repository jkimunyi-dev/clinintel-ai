/**
 * Scalable Medical Data Schema
 * Designed to work across different diseases and conditions
 */

export interface MedicalRecord {
  // Patient identifiers
  patientId: string;
  recordId: string;
  
  // Visit information
  visitDate: string; // ISO date string
  visitType: 'routine' | 'emergency' | 'follow-up' | 'specialist';
  providerId: string;
  
  // Vital signs (common across all conditions)
  vitals: {
    bloodPressureSystolic?: number; // mmHg
    bloodPressureDiastolic?: number; // mmHg
    heartRate?: number; // bpm
    temperature?: number; // Fahrenheit
    weight?: number; // kg
    height?: number; // cm
    bmi?: number;
    oxygenSaturation?: number; // %
  };
  
  // Laboratory results (condition-specific)
  labResults: {
    // Diabetes-specific
    fastingBloodGlucose?: number; // mg/dL
    hba1c?: number; // %
    randomBloodGlucose?: number; // mg/dL
    
    // Lipid panel
    totalCholesterol?: number; // mg/dL
    ldlCholesterol?: number; // mg/dL
    hdlCholesterol?: number; // mg/dL
    triglycerides?: number; // mg/dL
    
    // Kidney function
    creatinine?: number; // mg/dL
    eGFR?: number; // mL/min/1.73m²
    urineAlbumin?: number; // mg/g
    
    // Liver function
    alt?: number; // U/L
    ast?: number; // U/L
    
    // Other common tests
    hemoglobin?: number; // g/dL
    whiteBloodCellCount?: number; // cells/μL
  };
  
  // Medications
  medications?: Array<{
    name: string;
    dosage: string;
    frequency: string;
    startDate: string;
  }>;
  
  // Symptoms and complaints
  symptoms?: string[];
  chiefComplaint?: string;
  
  // Clinical notes
  notes?: string;
  diagnosis?: string[];
  
  // Follow-up
  nextVisitDate?: string;
  recommendations?: string[];
}

/**
 * CSV column mapping for diabetes monitoring
 * Maps CSV headers to MedicalRecord fields
 */
export const DIABETES_CSV_SCHEMA = {
  // Required columns
  required: [
    'visit_date',
    'fasting_blood_glucose',
    'hba1c',
  ],
  
  // Column mappings
  columns: {
    // Visit info
    'visit_date': 'visitDate',
    'visit_type': 'visitType',
    
    // Vitals
    'bp_systolic': 'vitals.bloodPressureSystolic',
    'bp_diastolic': 'vitals.bloodPressureDiastolic',
    'heart_rate': 'vitals.heartRate',
    'weight': 'vitals.weight',
    'height': 'vitals.height',
    'bmi': 'vitals.bmi',
    
    // Lab results
    'fasting_blood_glucose': 'labResults.fastingBloodGlucose',
    'hba1c': 'labResults.hba1c',
    'random_blood_glucose': 'labResults.randomBloodGlucose',
    'total_cholesterol': 'labResults.totalCholesterol',
    'ldl': 'labResults.ldlCholesterol',
    'hdl': 'labResults.hdlCholesterol',
    'triglycerides': 'labResults.triglycerides',
    'creatinine': 'labResults.creatinine',
    'egfr': 'labResults.eGFR',
    'urine_albumin': 'labResults.urineAlbumin',
    
    // Clinical
    'symptoms': 'symptoms',
    'medications': 'medications',
    'notes': 'notes',
    'diagnosis': 'diagnosis',
  },
};

/**
 * Normal ranges for diabetes-related metrics
 */
export const DIABETES_NORMAL_RANGES = {
  fastingBloodGlucose: { min: 70, max: 100, unit: 'mg/dL', preDiabetes: { min: 100, max: 125 } },
  hba1c: { min: 0, max: 5.6, unit: '%', preDiabetes: { min: 5.7, max: 6.4 } },
  bloodPressureSystolic: { min: 90, max: 120, unit: 'mmHg' },
  bloodPressureDiastolic: { min: 60, max: 80, unit: 'mmHg' },
  bmi: { min: 18.5, max: 24.9, overweight: { min: 25, max: 29.9 }, obese: { min: 30 } },
  totalCholesterol: { min: 0, max: 200, unit: 'mg/dL' },
  ldlCholesterol: { min: 0, max: 100, unit: 'mg/dL' },
  hdlCholesterol: { min: 40, max: 1000, unit: 'mg/dL' },
  triglycerides: { min: 0, max: 150, unit: 'mg/dL' },
  eGFR: { min: 90, max: 1000, unit: 'mL/min/1.73m²' },
};
