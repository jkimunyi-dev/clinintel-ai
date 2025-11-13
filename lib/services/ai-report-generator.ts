/**
 * AI-Powered Medical Report Generation Service
 * Uses DeepSeek API with specialized prompts for different report types
 */

import { sendChatCompletion, ChatMessage } from '@/lib/ai/deepseek';
import { MedicalRecord } from '@/lib/medical-data/schema';

export type ReportType = 'summary' | 'analytics' | 'risk-assessment' | 'trend-analysis';

export interface ReportGenerationOptions {
  reportType: ReportType;
  patientName?: string;
  patientAge?: number;
  patientGender?: string;
  medicalHistory?: string;
  includeRecommendations?: boolean;
}

export interface GeneratedReport {
  reportType: ReportType;
  title: string;
  content: string;
  summary: string;
  generatedAt: string;
  dataPoints: number;
}

/**
 * Generate AI-powered medical report from cleaned CSV data
 */
export async function generateMedicalReport(
  cleanedData: MedicalRecord[],
  options: ReportGenerationOptions
): Promise<GeneratedReport> {
  
  const { reportType, patientName, patientAge, patientGender, medicalHistory } = options;

  // Prepare data summary
  const dataSummary = prepareDataSummary(cleanedData);
  
  // Get specialized prompt for report type
  const prompt = getPromptForReportType(reportType, dataSummary, {
    patientName,
    patientAge,
    patientGender,
    medicalHistory
  });

  // Generate report using DeepSeek
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: getSystemPrompt(reportType)
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  const response = await sendChatCompletion(messages, {
    model: 'deepseek-chat',
    temperature: 0.3, // Lower temperature for more consistent medical analysis
    maxTokens: 3000
  });

  const content = response.choices[0]?.message?.content || 'Report generation failed';

  // Extract summary (first paragraph or first 200 chars)
  const summary = extractSummary(content);

  return {
    reportType,
    title: getReportTitle(reportType),
    content,
    summary,
    generatedAt: new Date().toISOString(),
    dataPoints: cleanedData.length
  };
}

/**
 * Get system prompt for each report type
 */
function getSystemPrompt(reportType: ReportType): string {
  const basePrompt = `You are an expert medical data analyst specializing in clinical decision support. 
You analyze patient medical records with precision and provide evidence-based insights.
Format your responses in clear, structured markdown with:
- **Bold** for key metrics and findings
- Bullet points for lists
- Tables for comparative data
- Clear section headings

Always maintain HIPAA compliance and patient confidentiality.`;

  const specificPrompts: Record<ReportType, string> = {
    'summary': `${basePrompt}

For SUMMARY REPORTS, focus on:
- Concise overview of patient's medical status
- Key health metrics and their current values
- Notable trends (improving/declining)
- Critical alerts or concerns
- Recent visit summaries`,

    'analytics': `${basePrompt}

For ANALYTICS REPORTS, focus on:
- Statistical analysis of lab trends over time
- Identification of patterns and correlations
- Comparative analysis (current vs. historical)
- Seasonal variations if applicable
- Data quality and completeness assessment`,

    'risk-assessment': `${basePrompt}

For RISK ASSESSMENT REPORTS, focus on:
- Identification of current and potential health risks
- Risk stratification (high/medium/low)
- Evidence-based risk factors from the data
- Preventive measures and early interventions
- Comorbidity considerations`,

    'trend-analysis': `${basePrompt}

For TREND ANALYSIS REPORTS, focus on:
- Detailed time-series analysis of key metrics
- Rate of change calculations
- Volatility and stability metrics
- Predictive indicators
- Control status (controlled/uncontrolled periods)
- Correlation between different lab values`
  };

  return specificPrompts[reportType];
}

/**
 * Get specialized prompt for each report type
 */
function getPromptForReportType(
  reportType: ReportType,
  dataSummary: DataSummary,
  patientInfo: any
): string {
  
  const patientContext = buildPatientContext(patientInfo);
  const dataContext = buildDataContext(dataSummary);

  const prompts: Record<ReportType, string> = {
    'summary': `# Generate Summary Report

${patientContext}

## Medical Data Overview
${dataContext}

## Task
Create a comprehensive summary report that includes:

1. **Patient Status Overview**
   - Current health status based on latest measurements
   - Key metrics summary (HbA1c, glucose, BP, BMI, etc.)
   - Overall trend direction (improving/stable/declining)

2. **Recent Findings** (last 3 months)
   - Latest lab results with interpretation
   - Notable changes from previous visits
   - Medication adherence indicators

3. **Health Metrics Dashboard**
   - Create a summary table of key metrics with:
     - Current value
     - Target/normal range
     - Status (✓ Within range, ⚠ Borderline, ✗ Out of range)
     - Trend (↑ Increasing, → Stable, ↓ Decreasing)

4. **Key Observations**
   - Important findings or patterns
   - Areas of concern
   - Positive developments

5. **Quick Stats**
   - Total visits in dataset
   - Date range covered
   - Completeness of data

Format the report in clean markdown with clear sections and visual elements (tables, bullet points, emojis for status indicators).`,

    'analytics': `# Generate Analytics Report

${patientContext}

## Medical Data Overview
${dataContext}

## Task
Perform detailed statistical analysis and create an analytics report that includes:

1. **Temporal Trends Analysis**
   - Time-series analysis of key lab values (HbA1c, glucose, cholesterol)
   - Moving averages and smoothed trends
   - Identify inflection points and significant changes

2. **Pattern Recognition**
   - Recurring patterns (seasonal, cyclical)
   - Correlations between different metrics (e.g., weight vs. glucose)
   - Visit frequency patterns

3. **Comparative Analysis**
   | Metric | First Quarter | Latest Quarter | Change | % Change |
   |--------|---------------|----------------|---------|----------|
   | (Populate with actual data comparisons)

4. **Statistical Summary**
   - Mean, median, standard deviation for key metrics
   - Range (min/max) with dates
   - Coefficient of variation (stability metric)

5. **Data Quality Assessment**
   - Completeness percentage for each field
   - Missing data patterns
   - Outliers or anomalies detected

6. **Insights & Correlations**
   - Notable correlations found
   - Medication changes and their impact on lab values
   - External factors mentioned in notes

Provide actionable insights based on the statistical analysis.`,

    'risk-assessment': `# Generate Risk Assessment Report

${patientContext}

## Medical Data Overview
${dataContext}

## Task
Conduct comprehensive risk assessment and create a report that includes:

1. **Risk Summary**
   - Overall risk level: 🔴 High / 🟡 Medium / 🟢 Low
   - Primary risk factors identified
   - Risk trend (increasing/stable/decreasing)

2. **Cardiovascular Risk**
   - Based on: BP, cholesterol, BMI, diabetes control
   - Risk factors present:
     - Hypertension (Y/N)
     - Dyslipidemia (Y/N)
     - Obesity (Y/N)
     - Poor glycemic control (Y/N)
   - 10-year CVD risk estimate (if applicable)

3. **Diabetes Complication Risk**
   - Retinopathy risk (based on HbA1c duration)
   - Nephropathy risk (based on eGFR, albumin)
   - Neuropathy risk indicators
   - Foot complication risk

4. **Metabolic Risk Assessment**
   - Hypoglycemia risk indicators
   - Hyperglycemia patterns
   - Metabolic syndrome criteria

5. **Risk Factor Details**
   For each identified risk, provide:
   - Current value vs. target
   - Duration of exposure
   - Severity classification
   - Associated complications

6. **Risk Mitigation Recommendations**
   - Prioritized interventions (High/Medium/Low priority)
   - Lifestyle modifications
   - Medication adjustments to consider
   - Monitoring frequency recommendations

7. **Red Flags** 🚩
   - Immediate concerns requiring attention
   - Deteriorating trends
   - Critical lab values

Use risk stratification frameworks and evidence-based guidelines.`,

    'trend-analysis': `# Generate Detailed Trend Analysis Report

${patientContext}

## Medical Data Overview
${dataContext}

## Task
Perform advanced trend analysis and create a detailed report that includes:

1. **Executive Summary**
   - Overall trend direction for key metrics
   - Control status timeline
   - Notable trend changes

2. **HbA1c Trend Analysis**
   - Time series plot description (trajectory over time)
   - Rate of change: X% per [time period]
   - Volatility score: Calculate coefficient of variation
   - Control periods: dates when HbA1c was at target (<7%)
   - Uncontrolled periods: dates when HbA1c was high (>7%)
   - Best/worst values with dates

3. **Glucose Trends**
   - Fasting glucose patterns
   - Variability analysis (high/low fluctuations)
   - Hypoglycemia episodes detected
   - Hyperglycemia patterns

4. **Blood Pressure Trends**
   - Systolic/diastolic trends
   - Hypertension episodes
   - Control achievement timeline
   - White coat effect indicators (if applicable)

5. **Weight & BMI Trajectory**
   - Weight change over time (kg gained/lost)
   - BMI trend and classification changes
   - Correlation with glucose control

6. **Lipid Profile Evolution**
   - Total cholesterol, LDL, HDL, triglycerides trends
   - Achievement of lipid targets
   - Medication impact analysis

7. **Kidney Function Monitoring**
   - eGFR trend (stable/declining)
   - Creatinine trajectory
   - CKD stage changes (if applicable)

8. **Volatility Metrics**
   Create a table:
   | Metric | Mean | Std Dev | CV% | Stability |
   |--------|------|---------|-----|-----------|
   | (Calculate for each metric)

   Stability classification: Stable (<15% CV), Moderate (15-25%), Highly variable (>25%)

9. **Predictive Indicators**
   - Based on current trends, project likely values for next 3-6 months
   - Early warning signs of deterioration
   - Positive momentum indicators

10. **Trend Insights**
    - What's working well (stable/improving metrics)
    - Areas needing attention (deteriorating trends)
    - Inflection points where trends changed
    - Potential causative factors for trend changes

Use statistical methods and provide quantitative analysis throughout.`
  };

  return prompts[reportType];
}

/**
 * Prepare data summary for AI analysis
 */
interface DataSummary {
  recordCount: number;
  dateRange: { start: string; end: string };
  latestRecord: MedicalRecord;
  averages: {
    hba1c?: number;
    fastingGlucose?: number;
    systolicBP?: number;
    diastolicBP?: number;
    bmi?: number;
    totalCholesterol?: number;
    ldl?: number;
    hdl?: number;
    triglycerides?: number;
    egfr?: number;
  };
  trends: {
    hba1cTrend: string;
    glucoseTrend: string;
    weightTrend: string;
  };
  outOfRangeCount: Record<string, number>;
}

function prepareDataSummary(data: MedicalRecord[]): DataSummary {
  if (data.length === 0) {
    throw new Error('No data provided for analysis');
  }

  // Sort by date
  const sortedData = [...data].sort((a, b) => 
    new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime()
  );

  const latest = sortedData[sortedData.length - 1];
  const earliest = sortedData[0];

  // Calculate averages
  const calculateAverage = (field: (record: MedicalRecord) => number | undefined): number | undefined => {
    const values = sortedData.map(field).filter((v): v is number => v !== undefined);
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : undefined;
  };

  const averages = {
    hba1c: calculateAverage(r => r.labResults.hba1c),
    fastingGlucose: calculateAverage(r => r.labResults.fastingBloodGlucose),
    systolicBP: calculateAverage(r => r.vitals.bloodPressureSystolic),
    diastolicBP: calculateAverage(r => r.vitals.bloodPressureDiastolic),
    bmi: calculateAverage(r => r.vitals.bmi),
    totalCholesterol: calculateAverage(r => r.labResults.totalCholesterol),
    ldl: calculateAverage(r => r.labResults.ldlCholesterol),
    hdl: calculateAverage(r => r.labResults.hdlCholesterol),
    triglycerides: calculateAverage(r => r.labResults.triglycerides),
    egfr: calculateAverage(r => r.labResults.eGFR),
  };

  // Calculate trends (simplified: compare first half vs second half)
  const midpoint = Math.floor(sortedData.length / 2);
  const firstHalf = sortedData.slice(0, midpoint);
  const secondHalf = sortedData.slice(midpoint);

  const getTrend = (field: (record: MedicalRecord) => number | undefined): string => {
    const firstAvg = calculateAverage(field);
    const secondAvg = firstHalf.length > 0 && secondHalf.length > 0 
      ? (secondHalf.map(field).filter((v): v is number => v !== undefined).reduce((a, b) => a + b, 0) / 
         secondHalf.map(field).filter((v): v is number => v !== undefined).length)
      : undefined;
    
    if (!firstAvg || !secondAvg) return 'Unknown';
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (Math.abs(change) < 5) return 'Stable';
    return change > 0 ? 'Increasing' : 'Decreasing';
  };

  const trends = {
    hba1cTrend: getTrend(r => r.labResults.hba1c),
    glucoseTrend: getTrend(r => r.labResults.fastingBloodGlucose),
    weightTrend: getTrend(r => r.vitals.weight),
  };

  // Count out-of-range values
  const outOfRangeCount: Record<string, number> = {
    highHbA1c: sortedData.filter(r => (r.labResults.hba1c ?? 0) > 7).length,
    highGlucose: sortedData.filter(r => (r.labResults.fastingBloodGlucose ?? 0) > 130).length,
    highBP: sortedData.filter(r => (r.vitals.bloodPressureSystolic ?? 0) > 140).length,
    lowEGFR: sortedData.filter(r => (r.labResults.eGFR ?? 100) < 60).length,
  };

  return {
    recordCount: data.length,
    dateRange: {
      start: earliest.visitDate,
      end: latest.visitDate
    },
    latestRecord: latest,
    averages,
    trends,
    outOfRangeCount
  };
}

/**
 * Build patient context for prompt
 */
function buildPatientContext(info: any): string {
  const parts = [];
  
  if (info.patientName) parts.push(`**Patient**: ${info.patientName}`);
  if (info.patientAge) parts.push(`**Age**: ${info.patientAge} years`);
  if (info.patientGender) parts.push(`**Gender**: ${info.patientGender}`);
  if (info.medicalHistory) parts.push(`**Medical History**: ${info.medicalHistory}`);
  
  return parts.length > 0 ? parts.join('\n') : '**Patient**: Anonymous Patient';
}

/**
 * Build data context for prompt
 */
function buildDataContext(summary: DataSummary): string {
  const { recordCount, dateRange, latestRecord, averages, trends, outOfRangeCount } = summary;

  return `
**Records Analyzed**: ${recordCount} visits
**Date Range**: ${dateRange.start} to ${dateRange.end}

### Latest Visit (${latestRecord.visitDate})
- HbA1c: ${latestRecord.labResults.hba1c ?? 'N/A'}%
- Fasting Glucose: ${latestRecord.labResults.fastingBloodGlucose ?? 'N/A'} mg/dL
- BP: ${latestRecord.vitals.bloodPressureSystolic ?? 'N/A'}/${latestRecord.vitals.bloodPressureDiastolic ?? 'N/A'} mmHg
- BMI: ${latestRecord.vitals.bmi ?? 'N/A'}
- Weight: ${latestRecord.vitals.weight ?? 'N/A'} kg
- eGFR: ${latestRecord.labResults.eGFR ?? 'N/A'} mL/min/1.73m²

### Average Values (All Visits)
- HbA1c: ${averages.hba1c?.toFixed(2) ?? 'N/A'}%
- Fasting Glucose: ${averages.fastingGlucose?.toFixed(1) ?? 'N/A'} mg/dL
- Systolic BP: ${averages.systolicBP?.toFixed(1) ?? 'N/A'} mmHg
- Diastolic BP: ${averages.diastolicBP?.toFixed(1) ?? 'N/A'} mmHg
- BMI: ${averages.bmi?.toFixed(1) ?? 'N/A'}
- Total Cholesterol: ${averages.totalCholesterol?.toFixed(1) ?? 'N/A'} mg/dL
- LDL: ${averages.ldl?.toFixed(1) ?? 'N/A'} mg/dL
- HDL: ${averages.hdl?.toFixed(1) ?? 'N/A'} mg/dL

### Observed Trends
- HbA1c: ${trends.hba1cTrend}
- Glucose: ${trends.glucoseTrend}
- Weight: ${trends.weightTrend}

### Out-of-Range Occurrences
- High HbA1c (>7%): ${outOfRangeCount.highHbA1c} visits
- High Fasting Glucose (>130 mg/dL): ${outOfRangeCount.highGlucose} visits
- High Blood Pressure (>140 mmHg): ${outOfRangeCount.highBP} visits
- Low eGFR (<60): ${outOfRangeCount.lowEGFR} visits

### Medications (Latest)
${latestRecord.medications && latestRecord.medications.length > 0 
  ? latestRecord.medications.map(m => `- ${m.name} (${m.dosage})`).join('\n')
  : '- No medications recorded'}

### Recent Symptoms
${latestRecord.symptoms && latestRecord.symptoms.length > 0
  ? latestRecord.symptoms.map(s => `- ${s}`).join('\n')
  : '- No symptoms recorded'}
`;
}

/**
 * Extract summary from report content
 */
function extractSummary(content: string): string {
  // Try to find executive summary or first paragraph
  const summaryMatch = content.match(/##?\s*(?:Executive )?Summary[:\n]+([\s\S]*?)(?=\n##|$)/i);
  if (summaryMatch) {
    return summaryMatch[1].trim().slice(0, 300);
  }

  // Otherwise, take first 200 characters
  const firstParagraph = content.split('\n\n')[0];
  return firstParagraph.slice(0, 200) + (firstParagraph.length > 200 ? '...' : '');
}

/**
 * Get report title
 */
function getReportTitle(reportType: ReportType): string {
  const titles: Record<ReportType, string> = {
    'summary': 'Patient Summary Report',
    'analytics': 'Medical Analytics Report',
    'risk-assessment': 'Health Risk Assessment',
    'trend-analysis': 'Detailed Trend Analysis'
  };
  return titles[reportType];
}

/**
 * Stream report generation (for real-time updates)
 */
export async function streamMedicalReport(
  cleanedData: MedicalRecord[],
  options: ReportGenerationOptions
): Promise<ReadableStream> {
  const { reportType, patientName, patientAge, patientGender, medicalHistory } = options;

  const dataSummary = prepareDataSummary(cleanedData);
  const prompt = getPromptForReportType(reportType, dataSummary, {
    patientName,
    patientAge,
    patientGender,
    medicalHistory
  });

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: getSystemPrompt(reportType)
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  // This would use streamChatCompletion from deepseek.ts
  // For now, return a simple implementation
  const encoder = new TextEncoder();
  
  return new ReadableStream({
    async start(controller) {
      try {
        const response = await sendChatCompletion(messages, {
          model: 'deepseek-chat',
          temperature: 0.3,
          maxTokens: 3000
        });

        const content = response.choices[0]?.message?.content || '';
        controller.enqueue(encoder.encode(content));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    }
  });
}
