import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { generateMedicalReport, ReportType } from '@/lib/services/ai-report-generator';

// GET /api/reports - Get all reports for a patient
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

    if (!patientId) {
      return NextResponse.json(
        { error: 'patientId is required' },
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

    const reports = await prisma.report.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Get reports error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/reports - Generate a new report
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { patientId, reportType } = await request.json();

    if (!patientId || !reportType) {
      return NextResponse.json(
        { error: 'patientId and reportType are required' },
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

    // Get cleaned medical records for the patient
    const medicalRecords = await prisma.medicalRecord.findMany({
      where: { patientId },
      include: {
        LabResult: true,
        Diagnosis: true,
      },
      orderBy: { recordDate: 'desc' },
    });

    if (medicalRecords.length === 0) {
      return NextResponse.json(
        { error: 'No medical records found for this patient' },
        { status: 404 }
      );
    }

    // Convert database records to MedicalRecord format for AI processing
    const cleanedData = medicalRecords.map(record => {
      return {
        patientId: record.patientId,
        recordId: record.id,
        providerId: '',
        visitDate: record.recordDate.toISOString().split('T')[0],
        visitType: record.recordType as any,
        vitals: (record.vitalSigns as any) || {},
        labResults: record.LabResult.reduce((acc: any, lab) => {
          const key = lab.testName.toLowerCase().replace(/\s+/g, '_');
          acc[key] = parseFloat(lab.testValue) || lab.testValue;
          return acc;
        }, {}),
        medications: (record.medications as any) || [],
        symptoms: record.symptoms || [],
        diagnosis: record.Diagnosis.map(d => d.description || d.code || ''),
        notes: record.notes || '',
      };
    });

    // Map report type to AI service format
    const reportTypeMapping: Record<string, ReportType> = {
      'summary': 'summary',
      'analytics': 'analytics',
      'risk_assessment': 'risk-assessment',
      'trend_analysis': 'trend-analysis'
    };

    const aiReportType = reportTypeMapping[reportType];
    if (!aiReportType) {
      return NextResponse.json(
        { error: 'Invalid report type' },
        { status: 400 }
      );
    }

    // Generate AI-powered report
    const generatedReport = await generateMedicalReport(cleanedData, {
      reportType: aiReportType,
      patientName: patient.name,
      patientAge: patient.dateOfBirth 
        ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : undefined,
      patientGender: patient.gender || undefined,
      includeRecommendations: true
    });

    // Extract insights and recommendations from content
    const insights = extractInsights(generatedReport.content);
    const recommendations = extractRecommendations(generatedReport.content);

    // Save report to database
    const savedReport = await prisma.report.create({
      data: {
        patientId,
        reportType,
        title: generatedReport.title,
        content: generatedReport.content,
        insights,
        recommendations,
        riskScore: extractRiskScore(generatedReport.content),
        generatedBy: 'ai',
      },
    });

    return NextResponse.json({ report: savedReport }, { status: 201 });
  } catch (error) {
    console.error('Generate report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Helper: Extract insights from report content
 */
function extractInsights(content: string): string[] {
  const insights: string[] = [];
  
  // Look for insights section
  const insightsMatch = content.match(/##?\s*(?:Key\s+)?(?:Observations?|Insights?)[:\n]+([\s\S]*?)(?=\n##|$)/i);
  if (insightsMatch) {
    const section = insightsMatch[1];
    const bulletPoints = section.match(/[-*]\s+(.+)/g);
    if (bulletPoints) {
      insights.push(...bulletPoints.map(bp => bp.replace(/^[-*]\s+/, '').trim()));
    }
  }

  return insights.slice(0, 10); // Limit to 10 insights
}

/**
 * Helper: Extract recommendations from report content
 */
function extractRecommendations(content: string): string[] {
  const recommendations: string[] = [];
  
  // Look for recommendations section
  const recsMatch = content.match(/##?\s*(?:Recommendations?|Risk\s+Mitigation)[:\n]+([\s\S]*?)(?=\n##|$)/i);
  if (recsMatch) {
    const section = recsMatch[1];
    const bulletPoints = section.match(/[-*]\s+(.+)/g);
    if (bulletPoints) {
      recommendations.push(...bulletPoints.map(bp => bp.replace(/^[-*]\s+/, '').trim()));
    }
  }

  return recommendations.slice(0, 10); // Limit to 10 recommendations
}

/**
 * Helper: Extract risk score from report content
 */
function extractRiskScore(content: string): number | null {
  // Look for risk level indicators
  if (content.includes('🔴 High') || content.toLowerCase().includes('high risk')) {
    return 75;
  } else if (content.includes('🟡 Medium') || content.toLowerCase().includes('medium risk')) {
    return 50;
  } else if (content.includes('🟢 Low') || content.toLowerCase().includes('low risk')) {
    return 25;
  }
  
  return null;
}

/**
 * Generate a summary report of patient's medical history
 */
async function generateSummaryReport(patientId: string) {
  const medicalRecords = await prisma.medicalRecord.findMany({
    where: { patientId },
    include: {
      LabResult: true,
      Diagnosis: true,
    },
    orderBy: { recordDate: 'desc' },
  });

  const totalRecords = medicalRecords.length;
  const recordTypes = Array.from(new Set(medicalRecords.map(r => r.recordType)));
  const dateRange = medicalRecords.length > 0 ? {
    start: medicalRecords[medicalRecords.length - 1].recordDate,
    end: medicalRecords[0].recordDate,
  } : null;

  // Count lab results and diagnoses
  const totalLabResults = medicalRecords.reduce((sum, r) => sum + r.LabResult.length, 0);
  const totalDiagnoses = medicalRecords.reduce((sum, r) => sum + r.Diagnosis.length, 0);

  // Get unique diagnoses
  const allDiagnoses = medicalRecords.flatMap(r => r.Diagnosis);
  const uniqueDiagnoses = Array.from(
    new Map(allDiagnoses.map(d => [d.description, d])).values()
  );

  const insights = [
    `Patient has ${totalRecords} medical records on file`,
    `${totalLabResults} lab results recorded`,
    `${totalDiagnoses} diagnoses documented`,
    `${uniqueDiagnoses.length} unique conditions identified`,
  ];

  if (dateRange) {
    const daysDiff = Math.floor(
      (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)
    );
    insights.push(`Medical history spans ${daysDiff} days (${Math.floor(daysDiff / 365)} years)`);
  }

  return {
    title: 'Medical History Summary',
    content: {
      totalRecords,
      recordTypes,
      dateRange,
      totalLabResults,
      totalDiagnoses,
      uniqueDiagnoses: uniqueDiagnoses.map(d => ({
        name: d.description,
        code: d.code,
        severity: d.severity,
      })),
    },
    insights,
    recommendations: [
      'Ensure all medical records are up to date',
      'Schedule regular follow-ups based on chronic conditions',
    ],
    riskScore: null,
  };
}

/**
 * Generate analytics report with trends and patterns
 */
async function generateAnalyticsReport(patientId: string) {
  const medicalRecords = await prisma.medicalRecord.findMany({
    where: { patientId },
    include: {
      LabResult: true,
    },
    orderBy: { recordDate: 'asc' },
  });

  // Analyze lab trends
  const labTrends: any = {};
  const commonTests = ['HbA1c', 'Fasting Blood Glucose', 'Total Cholesterol', 'LDL Cholesterol', 'HDL Cholesterol'];

  for (const testName of commonTests) {
    const results = medicalRecords
      .flatMap(r => r.LabResult.filter(l => l.testName === testName))
      .map(l => ({
        date: medicalRecords.find(r => r.LabResult.some(lr => lr.id === l.id))?.recordDate,
        value: parseFloat(l.testValue) || 0,
      }))
      .filter(r => r.value > 0);

    if (results.length > 0) {
      const values = results.map(r => r.value);
      const trend = calculateTrend(values);
      
      labTrends[testName] = {
        count: results.length,
        latest: values[values.length - 1],
        average: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        trend: trend > 0.05 ? 'increasing' : trend < -0.05 ? 'decreasing' : 'stable',
        trendValue: trend,
      };
    }
  }

  const insights = [];
  
  // Generate insights based on trends
  for (const [test, data] of Object.entries(labTrends) as any) {
    if (data.trend === 'increasing') {
      insights.push(`${test} is trending upward (${(data.trendValue * 100).toFixed(1)}% increase)`);
    } else if (data.trend === 'decreasing') {
      insights.push(`${test} is trending downward (${(Math.abs(data.trendValue) * 100).toFixed(1)}% decrease)`);
    }

    if (test === 'HbA1c' && data.latest > 7) {
      insights.push(`HbA1c is above target at ${data.latest.toFixed(1)}%`);
    }
  }

  return {
    title: 'Analytics & Trends Report',
    content: {
      labTrends,
      totalDataPoints: medicalRecords.length,
      analysisTimeframe: medicalRecords.length > 0 ? {
        start: medicalRecords[0].recordDate,
        end: medicalRecords[medicalRecords.length - 1].recordDate,
      } : null,
    },
    insights,
    recommendations: [
      'Monitor trending lab values closely',
      'Consider lifestyle interventions for worsening metrics',
      'Schedule follow-up tests for abnormal trends',
    ],
    riskScore: null,
  };
}

/**
 * Generate risk assessment report
 */
async function generateRiskAssessment(patientId: string) {
  const [patient, medicalRecords, diagnoses] = await Promise.all([
    prisma.patient.findUnique({ where: { id: patientId } }),
    prisma.medicalRecord.findMany({
      where: { patientId },
      include: { LabResult: true },
      orderBy: { recordDate: 'desc' },
      take: 10, // Last 10 records
    }),
    prisma.diagnosis.findMany({
      where: {
        MedicalRecord: { patientId },
      },
    }),
  ]);

  let riskScore = 0;
  const riskFactors: string[] = [];

  // Age risk
  if (patient?.dateOfBirth) {
    const age = Math.floor(
      (Date.now() - patient.dateOfBirth.getTime()) / (1000 * 60 * 60 * 24 * 365)
    );
    if (age > 65) {
      riskScore += 10;
      riskFactors.push(`Age ${age} (increased risk for chronic conditions)`);
    }
  }

  // Diabetes risk
  const hasDiabetes = diagnoses.some(d => 
    d.description.toLowerCase().includes('diabetes')
  );
  if (hasDiabetes) {
    riskScore += 20;
    riskFactors.push('Type 2 Diabetes (requires ongoing management)');

    // Check HbA1c control
    const latestHbA1c = medicalRecords
      .flatMap(r => r.LabResult.filter(l => l.testName === 'HbA1c'))
      .map(l => parseFloat(l.testValue))
      .filter(v => !isNaN(v))[0];

    if (latestHbA1c) {
      if (latestHbA1c > 9) {
        riskScore += 15;
        riskFactors.push(`Poor diabetes control (HbA1c: ${latestHbA1c}%)`);
      } else if (latestHbA1c > 7) {
        riskScore += 8;
        riskFactors.push(`Suboptimal diabetes control (HbA1c: ${latestHbA1c}%)`);
      }
    }
  }

  // Cardiovascular risk
  const hasCardiovascular = diagnoses.some(d =>
    /hypertension|heart|cardiac|cardiovascular/i.test(d.description)
  );
  if (hasCardiovascular) {
    riskScore += 15;
    riskFactors.push('Cardiovascular disease history');
  }

  // Cholesterol risk
  const latestLDL = medicalRecords
    .flatMap(r => r.LabResult.filter(l => l.testName === 'LDL Cholesterol'))
    .map(l => parseFloat(l.testValue))
    .filter(v => !isNaN(v))[0];

  if (latestLDL && latestLDL > 160) {
    riskScore += 10;
    riskFactors.push(`High LDL cholesterol (${latestLDL} mg/dL)`);
  }

  // Kidney function risk
  const latestEGFR = medicalRecords
    .flatMap(r => r.LabResult.filter(l => l.testName === 'eGFR'))
    .map(l => parseFloat(l.testValue))
    .filter(v => !isNaN(v))[0];

  if (latestEGFR && latestEGFR < 60) {
    riskScore += 12;
    riskFactors.push(`Reduced kidney function (eGFR: ${latestEGFR})`);
  }

  const riskLevel = riskScore > 50 ? 'High' : riskScore > 25 ? 'Moderate' : 'Low';

  const insights = [
    `Overall risk score: ${riskScore}/100 (${riskLevel} risk)`,
    `${riskFactors.length} risk factors identified`,
    ...riskFactors.map(f => `⚠️ ${f}`),
  ];

  const recommendations = [];
  if (riskScore > 50) {
    recommendations.push('Immediate medical review recommended');
    recommendations.push('Develop comprehensive management plan');
  } else if (riskScore > 25) {
    recommendations.push('Regular monitoring advised');
    recommendations.push('Consider preventive interventions');
  }

  recommendations.push('Maintain healthy lifestyle');
  recommendations.push('Adhere to prescribed medications');

  return {
    title: 'Risk Assessment Report',
    content: {
      riskScore,
      riskLevel,
      riskFactors,
      categoryScores: {
        age: patient?.dateOfBirth ? 10 : 0,
        diabetes: hasDiabetes ? 20 : 0,
        cardiovascular: hasCardiovascular ? 15 : 0,
        metabolic: (latestLDL && latestLDL > 160) ? 10 : 0,
        renal: (latestEGFR && latestEGFR < 60) ? 12 : 0,
      },
    },
    insights,
    recommendations,
    riskScore,
  };
}

/**
 * Generate trend analysis report
 */
async function generateTrendAnalysis(patientId: string) {
  const medicalRecords = await prisma.medicalRecord.findMany({
    where: { patientId },
    include: { LabResult: true },
    orderBy: { recordDate: 'asc' },
  });

  const trends: any = {};
  const testNames = ['HbA1c', 'Fasting Blood Glucose', 'eGFR', 'Total Cholesterol'];

  for (const testName of testNames) {
    const timeSeries = medicalRecords
      .flatMap((r, idx) => 
        r.LabResult
          .filter(l => l.testName === testName)
          .map(l => ({
            date: r.recordDate,
            value: parseFloat(l.testValue),
            index: idx,
          }))
      )
      .filter(d => !isNaN(d.value))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (timeSeries.length >= 3) {
      const values = timeSeries.map(t => t.value);
      const trendSlope = calculateTrend(values);
      const volatility = calculateVolatility(values);

      trends[testName] = {
        dataPoints: timeSeries,
        trend: trendSlope > 0.05 ? 'increasing' : trendSlope < -0.05 ? 'decreasing' : 'stable',
        slope: trendSlope,
        volatility,
        firstValue: values[0],
        lastValue: values[values.length - 1],
        percentChange: ((values[values.length - 1] - values[0]) / values[0] * 100).toFixed(1),
      };
    }
  }

  const insights = [];
  for (const [test, data] of Object.entries(trends) as any) {
    insights.push(`${test}: ${data.trend} trend (${data.percentChange > 0 ? '+' : ''}${data.percentChange}% change)`);
    
    if (data.volatility > 15) {
      insights.push(`${test} shows high variability - consider more frequent monitoring`);
    }
  }

  return {
    title: 'Trend Analysis Report',
    content: { trends },
    insights,
    recommendations: [
      'Continue tracking key metrics regularly',
      'Address any concerning trends with targeted interventions',
      'Maintain consistent testing schedule for accurate trend analysis',
    ],
    riskScore: null,
  };
}

/**
 * Calculate linear trend (slope) from values
 */
function calculateTrend(values: number[]): number {
  if (values.length < 2) return 0;

  const n = values.length;
  const xSum = (n * (n - 1)) / 2;
  const ySum = values.reduce((a, b) => a + b, 0);
  const xySum = values.reduce((sum, y, x) => sum + x * y, 0);
  const x2Sum = (n * (n - 1) * (2 * n - 1)) / 6;

  const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
  const avgValue = ySum / n;

  // Return normalized slope (percentage change per data point)
  return slope / avgValue;
}

/**
 * Calculate coefficient of variation (volatility)
 */
function calculateVolatility(values: number[]): number {
  if (values.length < 2) return 0;

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  return (stdDev / mean) * 100; // Coefficient of variation as percentage
}
