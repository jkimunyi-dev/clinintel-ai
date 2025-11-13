/**
 * OCR Integration for Medical Document Processing
 * Supports Tesseract.js (local) and Google Cloud Vision (cloud)
 */

import { createWorker, Worker } from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  blocks?: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>;
}

/**
 * Extract text from image using Tesseract.js (local processing)
 */
export async function extractTextFromImage(
  imageBuffer: Buffer,
  options?: {
    language?: string;
    tessedit_pageseg_mode?: string;
  }
): Promise<OCRResult> {
  const worker: Worker = await createWorker(options?.language || 'eng');

  try {
    const result = await worker.recognize(imageBuffer);
    
    return {
      text: result.data.text,
      confidence: result.data.confidence,
      blocks: result.data.blocks?.map(block => ({
        text: block.text,
        confidence: block.confidence,
        bbox: block.bbox,
      })),
    };
  } finally {
    await worker.terminate();
  }
}

/**
 * Extract text from image using Google Cloud Vision API
 * Requires GOOGLE_CLOUD_VISION_API_KEY environment variable
 */
export async function extractTextWithGoogleVision(
  imageBuffer: Buffer
): Promise<OCRResult> {
  const vision = await import('@google-cloud/vision');
  
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GOOGLE_CLOUD_VISION_API_KEY) {
    throw new Error('Google Cloud Vision API credentials not configured');
  }

  const client = new vision.ImageAnnotatorClient();

  try {
    const [result] = await client.textDetection(imageBuffer);
    const detections = result.textAnnotations;

    if (!detections || detections.length === 0) {
      return { text: '', confidence: 0 };
    }

    // First annotation contains the full text
    const fullText = detections[0]?.description || '';
    const confidence = detections[0]?.confidence || 0;

    return {
      text: fullText,
      confidence: confidence * 100,
    };
  } catch (error) {
    console.error('Google Vision API error:', error);
    throw error;
  }
}

/**
 * Parse medical data from OCR text
 * Attempts to extract structured information from medical documents
 */
export function parseMedicalText(text: string): {
  patientInfo?: {
    name?: string;
    dob?: string;
    id?: string;
  };
  vitals?: Record<string, string>;
  labResults?: Array<{ test: string; value: string; unit?: string; range?: string }>;
  medications?: string[];
  diagnoses?: string[];
  rawText: string;
} {
  const result: any = { rawText: text };

  // Extract patient name (common patterns)
  const nameMatch = text.match(/(?:Patient Name|Name):\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i);
  if (nameMatch) {
    result.patientInfo = result.patientInfo || {};
    result.patientInfo.name = nameMatch[1];
  }

  // Extract date of birth
  const dobMatch = text.match(/(?:DOB|Date of Birth):\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i);
  if (dobMatch) {
    result.patientInfo = result.patientInfo || {};
    result.patientInfo.dob = dobMatch[1];
  }

  // Extract patient ID/MRN
  const idMatch = text.match(/(?:Patient ID|MRN|Medical Record):\s*([A-Z0-9-]+)/i);
  if (idMatch) {
    result.patientInfo = result.patientInfo || {};
    result.patientInfo.id = idMatch[1];
  }

  // Extract vitals (blood pressure, heart rate, etc.)
  const vitals: Record<string, string> = {};
  
  const bpMatch = text.match(/(?:BP|Blood Pressure):\s*(\d+\/\d+)/i);
  if (bpMatch) vitals.bloodPressure = bpMatch[1];
  
  const hrMatch = text.match(/(?:HR|Heart Rate):\s*(\d+)/i);
  if (hrMatch) vitals.heartRate = hrMatch[1];
  
  const tempMatch = text.match(/(?:Temp|Temperature):\s*([\d.]+)/i);
  if (tempMatch) vitals.temperature = tempMatch[1];
  
  const weightMatch = text.match(/(?:Weight):\s*([\d.]+)\s*(?:kg|lbs)?/i);
  if (weightMatch) vitals.weight = weightMatch[1];

  if (Object.keys(vitals).length > 0) {
    result.vitals = vitals;
  }

  // Extract lab results (HbA1c, glucose, cholesterol, etc.)
  const labResults: Array<{ test: string; value: string; unit?: string; range?: string }> = [];
  
  // Common diabetes lab patterns
  const hba1cMatch = text.match(/HbA1c:?\s*([\d.]+)\s*%?/i);
  if (hba1cMatch) {
    labResults.push({ test: 'HbA1c', value: hba1cMatch[1], unit: '%', range: '<7%' });
  }

  const glucoseMatch = text.match(/(?:Fasting )?Glucose:?\s*(\d+)\s*(?:mg\/dL)?/i);
  if (glucoseMatch) {
    labResults.push({ test: 'Glucose', value: glucoseMatch[1], unit: 'mg/dL', range: '70-100' });
  }

  const cholesterolMatch = text.match(/(?:Total )?Cholesterol:?\s*(\d+)\s*(?:mg\/dL)?/i);
  if (cholesterolMatch) {
    labResults.push({ test: 'Cholesterol', value: cholesterolMatch[1], unit: 'mg/dL', range: '<200' });
  }

  if (labResults.length > 0) {
    result.labResults = labResults;
  }

  // Extract medications (lines containing "mg", "tablet", "daily", etc.)
  const medicationLines = text.split('\n').filter(line => 
    /\d+\s*mg|tablet|capsule|daily|twice daily|bid|tid/i.test(line) &&
    line.length < 200
  );
  if (medicationLines.length > 0) {
    result.medications = medicationLines;
  }

  // Extract diagnoses (lines after "Diagnosis" or "Assessment")
  const diagnosisSection = text.match(/(?:Diagnosis|Assessment|Impression):([\s\S]+?)(?:\n\n|$)/i);
  if (diagnosisSection) {
    const diagnoses = diagnosisSection[1]
      .split('\n')
      .map(d => d.trim())
      .filter(d => d.length > 0 && d.length < 200);
    if (diagnoses.length > 0) {
      result.diagnoses = diagnoses;
    }
  }

  return result;
}

/**
 * Choose best OCR method based on environment and requirements
 */
export async function extractText(
  imageBuffer: Buffer,
  preferCloud: boolean = false
): Promise<OCRResult> {
  // Use Google Cloud Vision if available and preferred
  if (preferCloud && (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_CLOUD_VISION_API_KEY)) {
    try {
      return await extractTextWithGoogleVision(imageBuffer);
    } catch (error) {
      console.warn('Google Vision failed, falling back to Tesseract:', error);
    }
  }

  // Fall back to Tesseract.js (local processing)
  return await extractTextFromImage(imageBuffer);
}
