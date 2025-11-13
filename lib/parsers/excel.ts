/**
 * Excel/CSV Parser for Medical Data
 * Converts Excel and CSV files to structured JSON
 */

import * as XLSX from 'xlsx';

export interface ExcelParseResult {
  success: boolean;
  data?: any[];
  headers?: string[];
  sheetNames?: string[];
  rowCount?: number;
  columnCount?: number;
  errors?: string[];
  metadata?: {
    dateRange?: { start: string; end: string };
    patientId?: string;
  };
}

/**
 * Parse Excel file (.xlsx, .xls) to JSON
 */
export async function parseExcelFile(
  buffer: Buffer,
  options?: {
    sheet?: string | number; // Sheet name or index (default: first sheet)
    range?: string; // Cell range (e.g., 'A1:Z100')
    header?: number; // Row number for headers (0-indexed, default: 0)
  }
): Promise<ExcelParseResult> {
  try {
    // Read the Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    
    // Get sheet name
    const sheetName = typeof options?.sheet === 'string' 
      ? options.sheet 
      : workbook.SheetNames[options?.sheet || 0];
    
    if (!sheetName || !workbook.Sheets[sheetName]) {
      return {
        success: false,
        errors: ['Sheet not found'],
      };
    }

    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      raw: false, // Format dates and numbers as strings
      defval: '', // Default value for empty cells
      header: options?.header,
    });

    // Extract headers
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const headers: string[] = [];
    
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: options?.header || 0, c: col });
      const cell = worksheet[cellAddress];
      headers.push(cell ? String(cell.v) : `Column${col + 1}`);
    }

    // Calculate metadata
    const metadata = calculateExcelMetadata(jsonData, headers);

    return {
      success: true,
      data: jsonData,
      headers,
      sheetNames: workbook.SheetNames,
      rowCount: jsonData.length,
      columnCount: headers.length,
      metadata,
    };
  } catch (error: any) {
    console.error('Excel parse error:', error);
    return {
      success: false,
      errors: [error.message || 'Failed to parse Excel file'],
    };
  }
}

/**
 * Parse CSV file to JSON
 */
export async function parseCSVFile(
  buffer: Buffer,
  options?: {
    delimiter?: string; // Default: auto-detect
    header?: number; // Row number for headers (default: 0)
  }
): Promise<ExcelParseResult> {
  try {
    // Use XLSX to parse CSV (it handles CSV well)
    const workbook = XLSX.read(buffer, { 
      type: 'buffer',
      raw: false,
      cellDates: true,
    });

    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
      raw: false,
      defval: '',
      header: options?.header,
    });

    // Extract headers
    const range = XLSX.utils.decode_range(firstSheet['!ref'] || 'A1');
    const headers: string[] = [];
    
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: options?.header || 0, c: col });
      const cell = firstSheet[cellAddress];
      headers.push(cell ? String(cell.v) : `Column${col + 1}`);
    }

    const metadata = calculateExcelMetadata(jsonData, headers);

    return {
      success: true,
      data: jsonData,
      headers,
      rowCount: jsonData.length,
      columnCount: headers.length,
      metadata,
    };
  } catch (error: any) {
    console.error('CSV parse error:', error);
    return {
      success: false,
      errors: [error.message || 'Failed to parse CSV file'],
    };
  }
}

/**
 * Calculate metadata from parsed data
 */
function calculateExcelMetadata(data: any[], headers: string[]): any {
  const metadata: any = {};

  if (data.length === 0) return metadata;

  // Try to detect date columns and find date range
  const dateColumns = headers.filter(h => 
    /date|time|visit|appointment/i.test(h)
  );

  if (dateColumns.length > 0) {
    const dateCol = dateColumns[0];
    const dates = data
      .map(row => row[dateCol])
      .filter(d => d && !isNaN(Date.parse(d)))
      .map(d => new Date(d))
      .sort((a, b) => a.getTime() - b.getTime());

    if (dates.length > 0) {
      metadata.dateRange = {
        start: dates[0].toISOString().split('T')[0],
        end: dates[dates.length - 1].toISOString().split('T')[0],
      };
    }
  }

  // Try to detect patient ID
  const idColumns = headers.filter(h => 
    /patient.*id|mrn|medical.*record/i.test(h)
  );

  if (idColumns.length > 0) {
    const idCol = idColumns[0];
    const patientIds = data.map(row => row[idCol]).filter(Boolean);
    if (patientIds.length > 0) {
      metadata.patientId = patientIds[0];
    }
  }

  return metadata;
}

/**
 * Convert medical data from Excel/CSV to structured MedicalRecord format
 */
export function convertToMedicalRecords(
  data: any[],
  headers: string[]
): Array<{
  recordType: string;
  recordDate: string;
  data: any;
  source: 'csv' | 'excel';
}> {
  const records: any[] = [];

  for (const row of data) {
    // Try to determine record type and date
    let recordDate: string | undefined;
    let recordType = 'general';

    // Find date field
    const dateFields = ['visit_date', 'date', 'visitDate', 'appointment_date', 'recordDate'];
    for (const field of dateFields) {
      const key = headers.find(h => h.toLowerCase().replace(/\s+/g, '_') === field.toLowerCase());
      if (key && row[key]) {
        const parsed = Date.parse(row[key]);
        if (!isNaN(parsed)) {
          recordDate = new Date(parsed).toISOString();
          break;
        }
      }
    }

    if (!recordDate) {
      recordDate = new Date().toISOString();
    }

    // Determine record type based on columns
    if (headers.some(h => /glucose|hba1c|cholesterol|lab/i.test(h))) {
      recordType = 'lab_result';
    } else if (headers.some(h => /blood.*pressure|heart.*rate|temperature|vitals/i.test(h))) {
      recordType = 'vitals';
    } else if (headers.some(h => /diagnosis|condition|disease/i.test(h))) {
      recordType = 'diagnosis';
    } else if (headers.some(h => /medication|prescription|drug/i.test(h))) {
      recordType = 'prescription';
    }

    // Normalize the data
    const normalizedData: any = {};
    
    for (const header of headers) {
      const value = row[header];
      if (value !== undefined && value !== '') {
        // Normalize header to camelCase
        const normalizedKey = header
          .toLowerCase()
          .replace(/[^a-z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
        normalizedData[normalizedKey] = value;
      }
    }

    records.push({
      recordType,
      recordDate,
      data: normalizedData,
      source: 'csv', // Will be updated by caller if Excel
    });
  }

  return records;
}

/**
 * Auto-detect file type and parse accordingly
 */
export async function parseFile(
  buffer: Buffer,
  filename: string,
  options?: any
): Promise<ExcelParseResult> {
  const ext = filename.toLowerCase().split('.').pop();

  if (ext === 'csv') {
    return parseCSVFile(buffer, options);
  } else if (ext === 'xlsx' || ext === 'xls') {
    return parseExcelFile(buffer, options);
  } else {
    return {
      success: false,
      errors: [`Unsupported file type: ${ext}`],
    };
  }
}
