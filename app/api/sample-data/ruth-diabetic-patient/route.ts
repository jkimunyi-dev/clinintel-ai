import { NextRequest, NextResponse } from 'next/server';
import { MedicalRecord } from '@/lib/medical-data/schema';

/**
 * Generate 13 years of diabetic patient medical records for Ruth
 * Patient: Ruth Diabetes (fictional)
 * Condition: Type 2 Diabetes diagnosed 13 years ago
 */
function generateRuthDiabeticData(): MedicalRecord[] {
  const records: MedicalRecord[] = [];
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 13);

  // Ruth's progression over 13 years (52 quarterly visits)
  for (let year = 1; year <= 13; year++) {
    for (let quarter = 1; quarter <= 4; quarter++) {
      const visitDate = new Date(startDate);
      visitDate.setFullYear(visitDate.getFullYear() + year - 1);
      visitDate.setMonth((quarter - 1) * 3);

      // Disease progression: Early years well-controlled, then fluctuating
      const isWellControlled = 
        year <= 3 ? true :  // Years 1-3: Well controlled
        year <= 7 ? (quarter % 2 === 0) : // Years 4-7: Fluctuating
        year <= 10 ? false : // Years 8-10: Poorly controlled
        (quarter <= 2); // Years 11-13: Improving with new treatment

      records.push(generateRuthVisitRecord(visitDate, year, quarter, isWellControlled));
    }
  }

  return records;
}

function generateRuthVisitRecord(
  date: Date,
  year: number,
  quarter: number,
  isWellControlled: boolean
): MedicalRecord {
  // Base values for Ruth (55 years old at diagnosis, now 68)
  const age = 55 + year;
  const baseWeight = 78; // kg
  const height = 162; // cm

  // HbA1c progression
  let hba1c: number;
  if (isWellControlled) {
    hba1c = 6.2 + Math.random() * 0.8; // 6.2-7.0%
  } else {
    hba1c = 7.5 + Math.random() * 2.0; // 7.5-9.5%
  }

  // Weight changes over time (gradual increase then decrease with lifestyle changes)
  const weightChange = year <= 7 ? year * 0.8 : year * 0.8 - (year - 7) * 1.2;
  const weight = baseWeight + weightChange + (Math.random() - 0.5) * 2;
  const bmi = weight / Math.pow(height / 100, 2);

  // Fasting blood glucose correlates with HbA1c
  const fbg = 70 + (hba1c - 5) * 30 + (Math.random() - 0.5) * 20;

  // Blood pressure - increases over time, then improves with treatment
  const bpSystolic = year <= 8 ? 125 + year * 2 : 145 - (year - 8) * 3;
  const bpDiastolic = year <= 8 ? 78 + year * 1 : 88 - (year - 8) * 2;

  // Cholesterol management
  const totalCholesterol = isWellControlled ? 180 + Math.random() * 30 : 210 + Math.random() * 40;
  const ldl = isWellControlled ? 95 + Math.random() * 20 : 120 + Math.random() * 30;
  const hdl = 48 + Math.random() * 12;

  // Renal function - gradual decline typical of long-term diabetes
  const creatinine = 0.8 + (year - 1) * 0.03 + Math.random() * 0.1;
  const egfr = Math.max(45, 95 - (year - 1) * 3 - Math.random() * 5);

  return {
    recordId: `RUTH-REC-${year}-Q${quarter}`,
    patientId: 'RUTH-001',
    visitDate: date.toISOString().split('T')[0],
    visitType: quarter === 1 ? 'routine' : 'follow-up',
    
    vitals: {
      bloodPressureSystolic: Math.round(bpSystolic),
      bloodPressureDiastolic: Math.round(bpDiastolic),
      heartRate: 68 + Math.round(Math.random() * 12),
      weight: Math.round(weight * 10) / 10,
      height: height,
      bmi: Math.round(bmi * 10) / 10,
      temperature: 36.5 + Math.random() * 0.6,
    },

    labResults: {
      fastingBloodGlucose: Math.round(fbg),
      hba1c: Math.round(hba1c * 10) / 10,
      randomBloodGlucose: Math.round(fbg + 30 + Math.random() * 40),
      totalCholesterol: Math.round(totalCholesterol),
      ldlCholesterol: Math.round(ldl),
      hdlCholesterol: Math.round(hdl),
      triglycerides: Math.round(120 + Math.random() * 80),
      creatinine: Math.round(creatinine * 100) / 100,
      eGFR: Math.round(egfr),
      urineAlbumin: year > 8 ? Math.round(20 + (year - 8) * 5 + Math.random() * 15) : Math.round(Math.random() * 15),
    },

    medications: getRuthMedicationsForYear(year, isWellControlled),
    
    symptoms: getRuthSymptomsForControl(isWellControlled, year, quarter),
    
    diagnosis: getRuthDiagnosisForYear(year),
    
    notes: generateRuthClinicalNotes(year, quarter, isWellControlled, hba1c, fbg, egfr),
    
    providerId: 'Dr. Sarah Johnson, MD',
    
    recommendations: getRuthRecommendationsForControl(isWellControlled, hba1c, bmi, year),
  };
}

function getRuthMedicationsForYear(year: number, isWellControlled: boolean): Array<{ name: string; dosage: string; frequency: string; startDate: string }> {
  const meds: Array<{ name: string; dosage: string; frequency: string; startDate: string }> = [];
  const startYear = new Date().getFullYear() - 13;

  // Metformin - started year 1
  if (year >= 1) {
    meds.push({
      name: 'Metformin',
      dosage: year <= 3 ? '1000mg' : '2000mg',
      frequency: year <= 3 ? 'Once daily' : 'Twice daily',
      startDate: `${startYear}`,
    });
  }

  // Added Glimepiride year 4
  if (year >= 4) {
    meds.push({
      name: 'Glimepiride',
      dosage: '2mg',
      frequency: 'Once daily',
      startDate: `${startYear + 3}`,
    });
  }

  // Added Empagliflozin (SGLT2i) year 8
  if (year >= 8) {
    meds.push({
      name: 'Empagliflozin',
      dosage: '10mg',
      frequency: 'Once daily',
      startDate: `${startYear + 7}`,
    });
  }

  // Started insulin year 11
  if (year >= 11) {
    meds.push({
      name: 'Insulin Glargine',
      dosage: '20 units',
      frequency: 'Once daily at bedtime',
      startDate: `${startYear + 10}`,
    });
  }

  // Lipid management
  if (year >= 2) {
    meds.push({
      name: 'Atorvastatin',
      dosage: '20mg',
      frequency: 'Once daily',
      startDate: `${startYear + 1}`,
    });
  }

  // Blood pressure control
  if (year >= 5) {
    meds.push({
      name: 'Lisinopril',
      dosage: year >= 9 ? '20mg' : '10mg',
      frequency: 'Once daily',
      startDate: `${startYear + 4}`,
    });
  }

  // Aspirin for cardiovascular protection
  if (year >= 3) {
    meds.push({
      name: 'Aspirin',
      dosage: '81mg',
      frequency: 'Once daily',
      startDate: `${startYear + 2}`,
    });
  }

  return meds;
}

function getRuthSymptomsForControl(isWellControlled: boolean, year: number, quarter: number): string[] {
  if (isWellControlled) {
    return year > 10 ? ['Mild fatigue occasionally', 'Well-controlled overall'] : ['None reported', 'Feeling well'];
  }

  const symptoms: string[] = [];
  if (year > 6) symptoms.push('Increased thirst');
  if (year > 7) symptoms.push('Frequent urination');
  if (!isWellControlled && quarter % 2 === 1) symptoms.push('Fatigue');
  if (year > 9) symptoms.push('Occasional blurred vision');
  if (year > 10) symptoms.push('Tingling in feet');

  return symptoms.length > 0 ? symptoms : ['Mild symptoms'];
}

function getRuthDiagnosisForYear(year: number): string[] {
  const diagnoses = ['Type 2 Diabetes Mellitus'];

  if (year >= 2) diagnoses.push('Dyslipidemia');
  if (year >= 5) diagnoses.push('Hypertension');
  if (year >= 9) diagnoses.push('Diabetic Nephropathy - Early Stage');
  if (year >= 11) diagnoses.push('Diabetic Peripheral Neuropathy');
  if (year >= 12) diagnoses.push('Diabetic Retinopathy - Background');

  return diagnoses;
}

function generateRuthClinicalNotes(
  year: number,
  quarter: number,
  isWellControlled: boolean,
  hba1c: number,
  fbg: number,
  egfr: number
): string {
  let notes = `Year ${year}, Quarter ${quarter} visit. `;

  if (isWellControlled) {
    notes += `Patient shows good diabetes control with HbA1c of ${hba1c.toFixed(1)}%. `;
    notes += `Fasting glucose ${fbg.toFixed(0)} mg/dL within acceptable range. `;
  } else {
    notes += `Suboptimal diabetes control noted. HbA1c elevated at ${hba1c.toFixed(1)}%. `;
    notes += `Fasting glucose ${fbg.toFixed(0)} mg/dL indicates need for treatment adjustment. `;
  }

  if (year >= 9) {
    notes += `Renal function monitoring: eGFR ${egfr.toFixed(0)} mL/min/1.73m². `;
  }

  if (year >= 11 && quarter === 1) {
    notes += `Annual eye exam completed - background retinopathy noted, stable. `;
  }

  if (year >= 11) {
    notes += `Foot exam shows decreased sensation bilaterally. Patient educated on daily foot care. `;
  }

  notes += `Patient adherent to medication regimen. `;

  return notes;
}

function getRuthRecommendationsForControl(
  isWellControlled: boolean,
  hba1c: number,
  bmi: number,
  year: number
): string[] {
  const recommendations: string[] = [];

  if (!isWellControlled) {
    recommendations.push('Increase medication compliance monitoring');
    recommendations.push('Consider medication adjustment at next visit');
  }

  if (bmi > 27) {
    recommendations.push('Continue with weight management program');
    recommendations.push('Dietary consultation recommended');
  }

  recommendations.push('Continue self-monitoring of blood glucose');
  recommendations.push('Maintain regular exercise - 30 minutes daily walking');

  if (year >= 9) {
    recommendations.push('Annual nephropathy screening');
  }

  if (year >= 11) {
    recommendations.push('Annual dilated eye exam');
    recommendations.push('Daily foot inspection and proper foot care');
  }

  recommendations.push('Follow Mediterranean diet pattern');
  recommendations.push('Schedule follow-up in 3 months');

  return recommendations;
}

function getNextVisitDate(currentDate: Date): string {
  const nextVisit = new Date(currentDate);
  nextVisit.setMonth(nextVisit.getMonth() + 3);
  return nextVisit.toISOString().split('T')[0];
}

function convertRuthToCSV(records: MedicalRecord[]): string {
  const headers = [
    'visit_date',
    'visit_type',
    'bp_systolic',
    'bp_diastolic',
    'heart_rate',
    'weight',
    'height',
    'bmi',
    'temperature',
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
    'notes',
    'diagnosis',
    'provider',
    'recommendations',
    'next_visit',
  ];

  const rows = records.map(record => {
    const medications = record.medications
      ?.map(m => `${m.name} ${m.dosage} ${m.frequency}`)
      .join('; ') || '';

    return [
      record.visitDate,
      record.visitType || '',
      record.vitals?.bloodPressureSystolic || '',
      record.vitals?.bloodPressureDiastolic || '',
      record.vitals?.heartRate || '',
      record.vitals?.weight || '',
      record.vitals?.height || '',
      record.vitals?.bmi || '',
      record.vitals?.temperature || '',
      record.labResults?.fastingBloodGlucose || '',
      record.labResults?.hba1c || '',
      record.labResults?.randomBloodGlucose || '',
      record.labResults?.totalCholesterol || '',
      record.labResults?.ldlCholesterol || '',
      record.labResults?.hdlCholesterol || '',
      record.labResults?.triglycerides || '',
      record.labResults?.creatinine || '',
      record.labResults?.eGFR || '',
      record.labResults?.urineAlbumin || '',
      record.symptoms?.join('; ') || '',
      medications,
      record.notes || '',
      record.diagnosis?.join('; ') || '',
      record.providerId || '',
      record.recommendations?.join('; ') || '',
      '',  // nextVisit - not in schema
    ].map(field => {
      const str = String(field);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
  });

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

/**
 * GET /api/sample-data/ruth-diabetic-patient
 * Generate and download Ruth's 13-year diabetes CSV
 */
export async function GET(request: NextRequest) {
  try {
    const records = generateRuthDiabeticData();
    const csvContent = convertRuthToCSV(records);

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="ruth_diabetic_13years.csv"',
      },
    });
  } catch (error) {
    console.error('Error generating Ruth sample data:', error);
    return NextResponse.json(
      { error: 'Failed to generate sample data' },
      { status: 500 }
    );
  }
}
