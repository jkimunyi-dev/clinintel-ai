/**
 * CSV Field Mapping System
 * Maps various column name formats to standardized medical schema fields
 */

export interface FieldMapping {
  standardField: string;
  alternativeNames: string[];
  dataType: 'date' | 'number' | 'string' | 'array';
  category: 'vitals' | 'labs' | 'medications' | 'demographics' | 'other';
  description: string;
}

/**
 * Comprehensive field mapping dictionary
 * Supports multiple naming conventions from different healthcare systems
 */
export const FIELD_MAPPINGS: FieldMapping[] = [
  // Date fields
  {
    standardField: 'visit_date',
    alternativeNames: ['date', 'visit_date', 'visitdate', 'date_of_visit', 'encounter_date', 'assessment_date', 'Date'],
    dataType: 'date',
    category: 'demographics',
    description: 'Date of clinical visit'
  },
  
  // Glucose/Diabetes metrics
  {
    standardField: 'fasting_blood_glucose',
    alternativeNames: [
      'fasting_blood_glucose', 'fasting_glucose', 'fbg', 'glucose_fasting', 
      'blood_glucose', 'glucose', 'bg', 'fasting_bg', 'fasting_blood_sugar',
      'Blood_Glucose_mg_dL', 'blood_glucose_mg_dl', 'glucose_mg_dl', 'FBG_mg_dL'
    ],
    dataType: 'number',
    category: 'labs',
    description: 'Fasting blood glucose in mg/dL'
  },
  {
    standardField: 'random_blood_glucose',
    alternativeNames: [
      'random_blood_glucose', 'random_glucose', 'rbg', 'glucose_random',
      'Random_Glucose', 'random_bg', 'RBG_mg_dL'
    ],
    dataType: 'number',
    category: 'labs',
    description: 'Random blood glucose in mg/dL'
  },
  {
    standardField: 'hba1c',
    alternativeNames: [
      'hba1c', 'HbA1c', 'a1c', 'hemoglobin_a1c', 'glycated_hemoglobin',
      'HbA1c_%', 'hba1c_%', 'hba1c_percent', 'A1C_%', 'HbA1C'
    ],
    dataType: 'number',
    category: 'labs',
    description: 'HbA1c percentage'
  },
  
  // Blood Pressure
  {
    standardField: 'bp_systolic',
    alternativeNames: [
      'bp_systolic', 'systolic', 'systolic_bp', 'sbp', 'blood_pressure_systolic',
      'BP_Systolic', 'Systolic_BP', 'SBP_mmHg', 'systolic_mmhg'
    ],
    dataType: 'number',
    category: 'vitals',
    description: 'Systolic blood pressure in mmHg'
  },
  {
    standardField: 'bp_diastolic',
    alternativeNames: [
      'bp_diastolic', 'diastolic', 'diastolic_bp', 'dbp', 'blood_pressure_diastolic',
      'BP_Diastolic', 'Diastolic_BP', 'DBP_mmHg', 'diastolic_mmhg'
    ],
    dataType: 'number',
    category: 'vitals',
    description: 'Diastolic blood pressure in mmHg'
  },
  
  // Body Measurements
  {
    standardField: 'weight',
    alternativeNames: [
      'weight', 'body_weight', 'wt', 'weight_kg', 'bodyweight',
      'Weight_kg', 'Weight', 'body_mass', 'weight_kilograms'
    ],
    dataType: 'number',
    category: 'vitals',
    description: 'Body weight in kg'
  },
  {
    standardField: 'height',
    alternativeNames: [
      'height', 'body_height', 'ht', 'height_cm', 'stature',
      'Height_cm', 'Height', 'height_centimeters'
    ],
    dataType: 'number',
    category: 'vitals',
    description: 'Height in cm'
  },
  {
    standardField: 'bmi',
    alternativeNames: [
      'bmi', 'body_mass_index', 'BMI', 'body_mass_idx', 'bmi_kg_m2'
    ],
    dataType: 'number',
    category: 'vitals',
    description: 'Body Mass Index'
  },
  
  // Other Vitals
  {
    standardField: 'heart_rate',
    alternativeNames: [
      'heart_rate', 'hr', 'pulse', 'pulse_rate', 'heartrate',
      'Heart_Rate', 'HR_bpm', 'pulse_bpm', 'heart_rate_bpm'
    ],
    dataType: 'number',
    category: 'vitals',
    description: 'Heart rate in bpm'
  },
  {
    standardField: 'temperature',
    alternativeNames: [
      'temperature', 'temp', 'body_temperature', 'body_temp',
      'Temperature_F', 'temp_f', 'temp_fahrenheit', 'temperature_fahrenheit'
    ],
    dataType: 'number',
    category: 'vitals',
    description: 'Body temperature in Fahrenheit'
  },
  
  // Lipid Panel
  {
    standardField: 'total_cholesterol',
    alternativeNames: [
      'total_cholesterol', 'cholesterol', 'total_chol', 'chol_total', 'tc',
      'Cholesterol_Total', 'cholesterol_mg_dl', 'total_cholesterol_mg_dl'
    ],
    dataType: 'number',
    category: 'labs',
    description: 'Total cholesterol in mg/dL'
  },
  {
    standardField: 'ldl',
    alternativeNames: [
      'ldl', 'ldl_cholesterol', 'ldl_chol', 'low_density_lipoprotein',
      'LDL', 'LDL_mg_dL', 'ldl_mg_dl', 'bad_cholesterol'
    ],
    dataType: 'number',
    category: 'labs',
    description: 'LDL cholesterol in mg/dL'
  },
  {
    standardField: 'hdl',
    alternativeNames: [
      'hdl', 'hdl_cholesterol', 'hdl_chol', 'high_density_lipoprotein',
      'HDL', 'HDL_mg_dL', 'hdl_mg_dl', 'good_cholesterol'
    ],
    dataType: 'number',
    category: 'labs',
    description: 'HDL cholesterol in mg/dL'
  },
  {
    standardField: 'triglycerides',
    alternativeNames: [
      'triglycerides', 'trig', 'trigs', 'tg', 'triglyceride',
      'Triglycerides', 'TG_mg_dL', 'triglycerides_mg_dl'
    ],
    dataType: 'number',
    category: 'labs',
    description: 'Triglycerides in mg/dL'
  },
  
  // Kidney Function
  {
    standardField: 'creatinine',
    alternativeNames: [
      'creatinine', 'creat', 'cr', 'serum_creatinine',
      'Creatinine', 'creatinine_mg_dl', 'serum_creat'
    ],
    dataType: 'number',
    category: 'labs',
    description: 'Serum creatinine in mg/dL'
  },
  {
    standardField: 'egfr',
    alternativeNames: [
      'egfr', 'gfr', 'estimated_gfr', 'e_gfr', 'glomerular_filtration_rate',
      'eGFR', 'eGFR_ml_min', 'egfr_ml_min_1_73m2'
    ],
    dataType: 'number',
    category: 'labs',
    description: 'Estimated GFR in mL/min/1.73m²'
  },
  {
    standardField: 'urine_albumin',
    alternativeNames: [
      'urine_albumin', 'albumin_urine', 'urine_protein', 'microalbumin',
      'Urine_Albumin', 'albumin_mg_g', 'uacr'
    ],
    dataType: 'number',
    category: 'labs',
    description: 'Urine albumin in mg/g'
  },
  
  // Medications & Treatment
  {
    standardField: 'insulin_dose',
    alternativeNames: [
      'insulin_dose', 'insulin', 'insulin_units', 'daily_insulin',
      'Insulin_Dose_units', 'insulin_dose_units', 'total_insulin'
    ],
    dataType: 'number',
    category: 'medications',
    description: 'Insulin dose in units'
  },
  {
    standardField: 'medications',
    alternativeNames: [
      'medications', 'meds', 'medication', 'drugs', 'prescriptions',
      'Medications', 'current_medications', 'medication_list'
    ],
    dataType: 'array',
    category: 'medications',
    description: 'List of medications'
  },
  
  // Lifestyle Factors
  {
    standardField: 'exercise_minutes',
    alternativeNames: [
      'exercise_minutes', 'exercise', 'physical_activity', 'activity_minutes',
      'Exercise_Minutes', 'exercise_min', 'daily_exercise', 'exercise_duration'
    ],
    dataType: 'number',
    category: 'other',
    description: 'Exercise duration in minutes'
  },
  {
    standardField: 'diet_score',
    alternativeNames: [
      'diet_score', 'dietary_score', 'nutrition_score', 'diet_adherence',
      'Diet_Score', 'diet_compliance', 'nutrition_compliance'
    ],
    dataType: 'number',
    category: 'other',
    description: 'Diet adherence score'
  },
  
  // Clinical Notes
  {
    standardField: 'symptoms',
    alternativeNames: [
      'symptoms', 'symptom', 'complaints', 'chief_complaint', 'presenting_symptoms',
      'Symptoms', 'patient_symptoms', 'clinical_symptoms'
    ],
    dataType: 'array',
    category: 'other',
    description: 'Patient symptoms'
  },
  {
    standardField: 'diagnosis',
    alternativeNames: [
      'diagnosis', 'diagnoses', 'dx', 'icd10', 'condition',
      'Diagnosis', 'primary_diagnosis', 'clinical_diagnosis'
    ],
    dataType: 'array',
    category: 'other',
    description: 'Clinical diagnoses'
  },
  {
    standardField: 'notes',
    alternativeNames: [
      'notes', 'clinical_notes', 'comments', 'remarks', 'observations',
      'Notes', 'doctor_notes', 'physician_notes', 'clinical_comments'
    ],
    dataType: 'string',
    category: 'other',
    description: 'Clinical notes'
  },
  
  // Visit Information
  {
    standardField: 'visit_type',
    alternativeNames: [
      'visit_type', 'encounter_type', 'visittype', 'appointment_type',
      'Visit_Type', 'visit_category', 'encounter_category'
    ],
    dataType: 'string',
    category: 'demographics',
    description: 'Type of visit'
  },
  
  // Provider Information
  {
    standardField: 'provider',
    alternativeNames: [
      'provider', 'doctor', 'physician', 'provider_name', 'attending_physician',
      'Provider', 'doctor_name', 'clinician', 'practitioner', 'attending_doctor'
    ],
    dataType: 'string',
    category: 'demographics',
    description: 'Healthcare provider name'
  },
  
  // Recommendations
  {
    standardField: 'recommendations',
    alternativeNames: [
      'recommendations', 'recommendation', 'treatment_plan', 'plan', 'care_plan',
      'Recommendations', 'treatment_recommendations', 'clinical_recommendations',
      'follow_up_plan', 'action_plan'
    ],
    dataType: 'string',
    category: 'other',
    description: 'Clinical recommendations and treatment plan'
  },
  
  // Next Visit
  {
    standardField: 'next_visit',
    alternativeNames: [
      'next_visit', 'next_appointment', 'follow_up_date', 'next_visit_date',
      'Next_Visit', 'followup_date', 'return_visit', 'next_appt'
    ],
    dataType: 'date',
    category: 'demographics',
    description: 'Next scheduled visit date'
  }
];

/**
 * Map CSV column name to standard field name
 */
export function mapFieldName(csvColumnName: string): {
  standardField: string;
  mapping: FieldMapping | null;
  confidence: 'exact' | 'high' | 'low' | 'none';
} {
  const normalized = csvColumnName.toLowerCase().trim().replace(/\s+/g, '_');
  
  // Try exact match first
  for (const mapping of FIELD_MAPPINGS) {
    if (mapping.alternativeNames.map(n => n.toLowerCase()).includes(normalized)) {
      return {
        standardField: mapping.standardField,
        mapping,
        confidence: 'exact'
      };
    }
  }
  
  // Try fuzzy match
  for (const mapping of FIELD_MAPPINGS) {
    for (const altName of mapping.alternativeNames) {
      if (normalized.includes(altName.toLowerCase()) || altName.toLowerCase().includes(normalized)) {
        return {
          standardField: mapping.standardField,
          mapping,
          confidence: 'high'
        };
      }
    }
  }
  
  // No match found - keep original
  return {
    standardField: normalized,
    mapping: null,
    confidence: 'none'
  };
}

/**
 * Map entire CSV header row to standard fields
 */
export function mapCSVHeaders(headers: string[]): {
  mappedHeaders: string[];
  mappings: Array<{
    original: string;
    standard: string;
    confidence: string;
    category?: string;
  }>;
  unmapped: string[];
} {
  const mappedHeaders: string[] = [];
  const mappings: Array<any> = [];
  const unmapped: string[] = [];
  
  for (const header of headers) {
    const result = mapFieldName(header);
    mappedHeaders.push(result.standardField);
    
    mappings.push({
      original: header,
      standard: result.standardField,
      confidence: result.confidence,
      category: result.mapping?.category
    });
    
    if (result.confidence === 'none') {
      unmapped.push(header);
    }
  }
  
  return {
    mappedHeaders,
    mappings,
    unmapped
  };
}

/**
 * Get standard field by category
 */
export function getFieldsByCategory(category: FieldMapping['category']): FieldMapping[] {
  return FIELD_MAPPINGS.filter(m => m.category === category);
}

/**
 * Validate if required fields are present
 */
export function validateRequiredFields(mappedHeaders: string[]): {
  valid: boolean;
  missing: string[];
  present: string[];
} {
  const requiredFields = ['visit_date', 'fasting_blood_glucose', 'hba1c'];
  const present: string[] = [];
  const missing: string[] = [];
  
  for (const field of requiredFields) {
    if (mappedHeaders.includes(field)) {
      present.push(field);
    } else {
      missing.push(field);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing,
    present
  };
}
