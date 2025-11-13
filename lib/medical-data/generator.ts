import { MedicalRecord } from './schema';

/**
 * Generate 6 years of diabetic patient medical records
 * Patient: John Diabetic (fictional)
 * Condition: Type 2 Diabetes diagnosed 6 years ago
 */
export function generateDiabeticPatientData(patientId: string): MedicalRecord[] {
  const records: MedicalRecord[] = [];
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 6);
  
  // Generate quarterly visits (4 per year) for 6 years = 24 visits
  for (let year = 0; year < 6; year++) {
    for (let quarter = 0; quarter < 4; quarter++) {
      const visitDate = new Date(startDate);
      visitDate.setFullYear(startDate.getFullYear() + year);
      visitDate.setMonth(quarter * 3);
      
      // Simulate disease progression and management
      const yearProgress = year / 6;
      const isControlled = year >= 3; // Better control after 3 years
      
      records.push(generateVisitRecord(patientId, visitDate, year, quarter, isControlled));
    }
  }
  
  return records;
}

function generateVisitRecord(
  patientId: string,
  date: Date,
  year: number,
  quarter: number,
  isControlled: boolean
): MedicalRecord {
  const recordId = `REC-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  
  // Simulate weight loss over time (started at 95kg, target 80kg)
  const baseWeight = 95 - (year * 2.5);
  const weight = baseWeight + (Math.random() * 2 - 1);
  const height = 175; // cm
  const bmi = Number((weight / ((height / 100) ** 2)).toFixed(1));
  
  // HbA1c improves over time with treatment
  const baseHbA1c = isControlled ? 6.2 : 8.5 - (year * 0.3);
  const hba1c = Number((baseHbA1c + (Math.random() * 0.6 - 0.3)).toFixed(1));
  
  // Fasting glucose correlates with HbA1c
  const baseFastingGlucose = isControlled ? 105 : 140 - (year * 5);
  const fastingBloodGlucose = Math.round(baseFastingGlucose + (Math.random() * 20 - 10));
  
  // Blood pressure (hypertension common with diabetes)
  const bpSystolic = Math.round(130 + (Math.random() * 20 - 10));
  const bpDiastolic = Math.round(80 + (Math.random() * 10 - 5));
  
  // Lipid panel
  const totalCholesterol = Math.round(200 + (Math.random() * 40 - 20));
  const ldl = Math.round(120 - (year * 5) + (Math.random() * 20 - 10));
  const hdl = Math.round(45 + (year * 1.5) + (Math.random() * 5 - 2.5));
  const triglycerides = Math.round(180 - (year * 10) + (Math.random() * 30 - 15));
  
  // Kidney function (monitor for diabetic nephropathy)
  const egfr = Math.round(95 - (year * 2) + (Math.random() * 5 - 2.5));
  const creatinine = Number((1.1 + (year * 0.05) + (Math.random() * 0.1 - 0.05)).toFixed(2));
  const urineAlbumin = Math.round(20 + (year * 3) + (Math.random() * 10 - 5));
  
  // Determine visit type
  const visitType = quarter === 0 ? 'routine' : 
                   (quarter === 2 && year < 2) ? 'emergency' : 
                   'follow-up';
  
  // Medications evolve over time
  const medications = getMedicationsForYear(year, isControlled);
  
  // Symptoms based on control
  const symptoms = getSymptomsForControl(isControlled, quarter);
  
  // Diagnosis
  const diagnosis = getDiagnosisForYear(year);
  
  // Clinical notes
  const notes = generateClinicalNotes(year, quarter, isControlled, hba1c, fastingBloodGlucose);
  
  // Recommendations
  const recommendations = getRecommendationsForControl(isControlled, hba1c, bmi);
  
  return {
    patientId,
    recordId,
    visitDate: date.toISOString().split('T')[0],
    visitType,
    providerId: 'DR-001',
    
    vitals: {
      bloodPressureSystolic: bpSystolic,
      bloodPressureDiastolic: bpDiastolic,
      heartRate: Math.round(72 + (Math.random() * 10 - 5)),
      temperature: Number((98.6 + (Math.random() * 1 - 0.5)).toFixed(1)),
      weight,
      height,
      bmi,
      oxygenSaturation: Math.round(97 + (Math.random() * 2)),
    },
    
    labResults: {
      fastingBloodGlucose,
      hba1c,
      randomBloodGlucose: Math.round(fastingBloodGlucose + 30 + (Math.random() * 20)),
      totalCholesterol,
      ldlCholesterol: ldl,
      hdlCholesterol: hdl,
      triglycerides,
      creatinine,
      eGFR: egfr,
      urineAlbumin,
      alt: Math.round(25 + (Math.random() * 10 - 5)),
      ast: Math.round(28 + (Math.random() * 10 - 5)),
      hemoglobin: Number((14 + (Math.random() * 1 - 0.5)).toFixed(1)),
      whiteBloodCellCount: Math.round(7000 + (Math.random() * 2000 - 1000)),
    },
    
    medications,
    symptoms,
    chiefComplaint: symptoms[0] || 'Routine diabetes follow-up',
    notes,
    diagnosis,
    nextVisitDate: getNextVisitDate(date),
    recommendations,
  };
}

function getMedicationsForYear(year: number, isControlled: boolean): Array<{ name: string; dosage: string; frequency: string; startDate: string }> {
  const meds = [
    { name: 'Metformin', dosage: '1000mg', frequency: 'Twice daily', startDate: '2019-01-15' },
  ];
  
  if (year >= 1) {
    meds.push({ name: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily at bedtime', startDate: '2020-03-10' });
  }
  
  if (year >= 2 && !isControlled) {
    meds.push({ name: 'Glipizide', dosage: '5mg', frequency: 'Once daily before breakfast', startDate: '2021-06-15' });
  }
  
  if (year >= 3) {
    meds.push({ name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', startDate: '2022-02-20' });
  }
  
  return meds;
}

function getSymptomsForControl(isControlled: boolean, quarter: number): string[] {
  if (isControlled) {
    return quarter === 0 ? ['Routine check-up', 'No acute complaints'] : ['Feeling well', 'Good energy levels'];
  }
  
  const symptoms = ['Increased thirst', 'Frequent urination', 'Fatigue', 'Blurred vision', 'Slow wound healing'];
  return symptoms.slice(0, Math.floor(Math.random() * 3) + 2);
}

function getDiagnosisForYear(year: number): string[] {
  const diagnoses = ['Type 2 Diabetes Mellitus'];
  
  if (year >= 1) diagnoses.push('Dyslipidemia');
  if (year >= 2) diagnoses.push('Essential Hypertension');
  if (year >= 4) diagnoses.push('Diabetic Retinopathy - Mild');
  
  return diagnoses;
}

function generateClinicalNotes(year: number, quarter: number, isControlled: boolean, hba1c: number, fbg: number): string {
  const yearsSinceDiagnosis = year;
  
  if (isControlled) {
    return `Patient shows excellent diabetes management. HbA1c at ${hba1c}% (target <7%). Fasting glucose ${fbg} mg/dL. Compliant with medication regimen. Continue current treatment plan. Regular monitoring of renal function and eye exams recommended.`;
  }
  
  if (year < 2) {
    return `Patient diagnosed with Type 2 Diabetes ${yearsSinceDiagnosis} year(s) ago. HbA1c elevated at ${hba1c}%. Fasting glucose ${fbg} mg/dL. Discussed lifestyle modifications: diet, exercise, weight loss. Started on Metformin. Patient counseled on home glucose monitoring.`;
  }
  
  return `Follow-up visit for Type 2 Diabetes. HbA1c ${hba1c}%. Some difficulty with glycemic control. Reinforced importance of dietary compliance and regular exercise. Medication adherence discussed. Will monitor closely.`;
}

function getRecommendationsForControl(isControlled: boolean, hba1c: number, bmi: number): string[] {
  const recommendations = [];
  
  if (hba1c > 7) {
    recommendations.push('Intensify glucose monitoring - check fasting glucose daily');
    recommendations.push('Consider medication adjustment if HbA1c remains >7% in 3 months');
  }
  
  if (bmi > 25) {
    recommendations.push('Continue weight loss efforts - target 5-10% reduction');
    recommendations.push('Nutritionist consultation for meal planning');
  }
  
  if (!isControlled) {
    recommendations.push('Increase physical activity to 150 minutes/week');
    recommendations.push('Limit refined carbohydrates and sugary beverages');
  }
  
  recommendations.push('Annual comprehensive eye exam');
  recommendations.push('Annual foot examination');
  recommendations.push('Monitor blood pressure at home');
  
  return recommendations;
}

function getNextVisitDate(currentDate: Date): string {
  const nextDate = new Date(currentDate);
  nextDate.setMonth(nextDate.getMonth() + 3);
  return nextDate.toISOString().split('T')[0];
}

/**
 * Convert medical records to CSV format
 */
export function convertToCSV(records: MedicalRecord[]): string {
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
    'medications',
    'diagnosis',
    'notes',
  ];
  
  const rows = records.map(record => [
    record.visitDate,
    record.visitType,
    record.vitals.bloodPressureSystolic,
    record.vitals.bloodPressureDiastolic,
    record.vitals.heartRate,
    record.vitals.weight,
    record.vitals.height,
    record.vitals.bmi,
    record.labResults.fastingBloodGlucose,
    record.labResults.hba1c,
    record.labResults.randomBloodGlucose,
    record.labResults.totalCholesterol,
    record.labResults.ldlCholesterol,
    record.labResults.hdlCholesterol,
    record.labResults.triglycerides,
    record.labResults.creatinine,
    record.labResults.eGFR,
    record.labResults.urineAlbumin,
    record.symptoms?.join('; ') || '',
    record.medications?.map(m => `${m.name} ${m.dosage}`).join('; ') || '',
    record.diagnosis?.join('; ') || '',
    record.notes || '',
  ]);
  
  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
}
