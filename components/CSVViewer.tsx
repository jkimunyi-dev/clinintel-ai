"use client";

import { useState } from 'react';
import { MedicalRecord } from '@/lib/medical-data/schema';

interface CSVViewerProps {
  fileId: string;
  fileName: string;
  metadata?: any;
}

export default function CSVViewer({ fileId, fileName, metadata }: CSVViewerProps) {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState<'table' | 'summary' | 'charts'>('summary');

  const loadCSVData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/files/${fileId}/data`);
      if (!response.ok) {
        throw new Error('Failed to load CSV data');
      }
      
      const data = await response.json();
      setRecords(data.records || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary statistics
  const summary = records.length > 0 ? calculateSummary(records) : null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {fileName}
        </h3>
        {metadata && (
          <div className="text-sm text-gray-600">
            <p>Rows: {metadata.rowCount || 0}</p>
            <p>Columns: {metadata.columnCount || 0}</p>
            {metadata.dateRange && (
              <p>Date Range: {metadata.dateRange.start} to {metadata.dateRange.end}</p>
            )}
          </div>
        )}
      </div>

      {/* View Toggle */}
      <div className="flex space-x-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setView('summary')}
          className={`px-4 py-2 font-medium ${
            view === 'summary'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900:text-white'
          }`}
        >
          Summary
        </button>
        <button
          onClick={() => {
            setView('table');
            if (records.length === 0) loadCSVData();
          }}
          className={`px-4 py-2 font-medium ${
            view === 'table'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900:text-white'
          }`}
        >
          Table View
        </button>
        <button
          onClick={() => {
            setView('charts');
            if (records.length === 0) loadCSVData();
          }}
          className={`px-4 py-2 font-medium ${
            view === 'charts'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900:text-white'
          }`}
        >
          Charts
        </button>
      </div>

      {/* Content */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading data...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {!loading && !error && view === 'summary' && summary && (
        <SummaryView summary={summary} metadata={metadata} />
      )}

      {!loading && !error && view === 'table' && records.length > 0 && (
        <TableView records={records} />
      )}

      {!loading && !error && view === 'charts' && records.length > 0 && (
        <ChartsView records={records} />
      )}
    </div>
  );
}

function SummaryView({ summary, metadata }: { summary: any; metadata: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <MetricCard
        title="Avg HbA1c"
        value={summary.avgHbA1c?.toFixed(1) || 'N/A'}
        unit="%"
        status={getHbA1cStatus(summary.avgHbA1c)}
        range="Target: <7.0%"
      />
      <MetricCard
        title="Avg Fasting Glucose"
        value={summary.avgFastingGlucose?.toFixed(0) || 'N/A'}
        unit="mg/dL"
        status={getGlucoseStatus(summary.avgFastingGlucose)}
        range="Normal: 70-100 mg/dL"
      />
      <MetricCard
        title="Avg Blood Pressure"
        value={`${summary.avgBPSystolic?.toFixed(0) || '?'}/${summary.avgBPDiastolic?.toFixed(0) || '?'}`}
        unit="mmHg"
        status={getBPStatus(summary.avgBPSystolic, summary.avgBPDiastolic)}
        range="Target: <120/80"
      />
      <MetricCard
        title="Avg BMI"
        value={summary.avgBMI?.toFixed(1) || 'N/A'}
        unit=""
        status={getBMIStatus(summary.avgBMI)}
        range="Normal: 18.5-24.9"
      />
      <MetricCard
        title="Total Visits"
        value={summary.totalVisits?.toString() || '0'}
        unit="visits"
        status="normal"
        range={metadata.dateRange ? `${metadata.dateRange.start} to ${metadata.dateRange.end}` : ''}
      />
      <MetricCard
        title="Avg eGFR"
        value={summary.avgEGFR?.toFixed(0) || 'N/A'}
        unit="mL/min/1.73m²"
        status={getEGFRStatus(summary.avgEGFR)}
        range="Normal: >90"
      />
    </div>
  );
}

function MetricCard({ title, value, unit, status, range }: {
  title: string;
  value: string;
  unit: string;
  status: 'good' | 'warning' | 'danger' | 'normal';
  range: string;
}) {
  const statusColors = {
    good: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    danger: 'bg-red-50 border-red-200',
    normal: 'bg-gray-50 border-gray-200',
  };

  const textColors = {
    good: 'text-green-800',
    warning: 'text-yellow-800',
    danger: 'text-red-800',
    normal: 'text-gray-800',
  };

  return (
    <div className={`border rounded-lg p-4 ${statusColors[status]}`}>
      <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
      <p className={`text-2xl font-bold ${textColors[status]}`}>
        {value} <span className="text-sm font-normal">{unit}</span>
      </p>
      <p className="text-xs text-gray-500 mt-1">{range}</p>
    </div>
  );
}

function TableView({ records }: { records: MedicalRecord[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">HbA1c</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Glucose</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">BP</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weight</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">BMI</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {records.map((record, idx) => (
            <tr key={idx} className="hover:bg-gray-50:bg-gray-800">
              <td className="px-4 py-3 text-sm text-gray-900">{record.visitDate}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{record.labResults.hba1c}%</td>
              <td className="px-4 py-3 text-sm text-gray-900">{record.labResults.fastingBloodGlucose} mg/dL</td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {record.vitals.bloodPressureSystolic}/{record.vitals.bloodPressureDiastolic}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">{record.vitals.weight} kg</td>
              <td className="px-4 py-3 text-sm text-gray-900">{record.vitals.bmi}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChartsView({ records }: { records: MedicalRecord[] }) {
  // Simple ASCII chart for now - can be replaced with a charting library
  const hba1cTrend = records.map(r => r.labResults.hba1c).filter((v): v is number => v !== undefined);
  
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">HbA1c Trend</h4>
        <p className="text-sm text-gray-600">
          Shows progression over {records.length} visits
        </p>
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Chart visualization would appear here (integrate Chart.js or similar)
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Trend: {hba1cTrend[0]}% → {hba1cTrend[hba1cTrend.length - 1]}%
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper functions for status determination
function getHbA1cStatus(value?: number): 'good' | 'warning' | 'danger' | 'normal' {
  if (!value) return 'normal';
  if (value < 5.7) return 'good';
  if (value < 6.5) return 'warning';
  return 'danger';
}

function getGlucoseStatus(value?: number): 'good' | 'warning' | 'danger' | 'normal' {
  if (!value) return 'normal';
  if (value <= 100) return 'good';
  if (value <= 125) return 'warning';
  return 'danger';
}

function getBPStatus(systolic?: number, diastolic?: number): 'good' | 'warning' | 'danger' | 'normal' {
  if (!systolic || !diastolic) return 'normal';
  if (systolic < 120 && diastolic < 80) return 'good';
  if (systolic < 130 && diastolic < 85) return 'warning';
  return 'danger';
}

function getBMIStatus(value?: number): 'good' | 'warning' | 'danger' | 'normal' {
  if (!value) return 'normal';
  if (value >= 18.5 && value < 25) return 'good';
  if (value >= 25 && value < 30) return 'warning';
  return 'danger';
}

function getEGFRStatus(value?: number): 'good' | 'warning' | 'danger' | 'normal' {
  if (!value) return 'normal';
  if (value >= 90) return 'good';
  if (value >= 60) return 'warning';
  return 'danger';
}

function calculateSummary(records: MedicalRecord[]) {
  const hba1cValues = records.map(r => r.labResults.hba1c).filter((v): v is number => v !== undefined);
  const glucoseValues = records.map(r => r.labResults.fastingBloodGlucose).filter((v): v is number => v !== undefined);
  const bpSystolicValues = records.map(r => r.vitals.bloodPressureSystolic).filter((v): v is number => v !== undefined);
  const bpDiastolicValues = records.map(r => r.vitals.bloodPressureDiastolic).filter((v): v is number => v !== undefined);
  const bmiValues = records.map(r => r.vitals.bmi).filter((v): v is number => v !== undefined);
  const egfrValues = records.map(r => r.labResults.eGFR).filter((v): v is number => v !== undefined);

  return {
    totalVisits: records.length,
    avgHbA1c: hba1cValues.length > 0 ? hba1cValues.reduce((a, b) => a + b) / hba1cValues.length : undefined,
    avgFastingGlucose: glucoseValues.length > 0 ? glucoseValues.reduce((a, b) => a + b) / glucoseValues.length : undefined,
    avgBPSystolic: bpSystolicValues.length > 0 ? bpSystolicValues.reduce((a, b) => a + b) / bpSystolicValues.length : undefined,
    avgBPDiastolic: bpDiastolicValues.length > 0 ? bpDiastolicValues.reduce((a, b) => a + b) / bpDiastolicValues.length : undefined,
    avgBMI: bmiValues.length > 0 ? bmiValues.reduce((a, b) => a + b) / bmiValues.length : undefined,
    avgEGFR: egfrValues.length > 0 ? egfrValues.reduce((a, b) => a + b) / egfrValues.length : undefined,
  };
}
