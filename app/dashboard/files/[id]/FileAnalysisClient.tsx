"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CSVViewer from "@/components/CSVViewer";
import CSVTableView from "@/components/CSVTableView";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface FileAnalysisClientProps {
  file: any;
  userId: string;
}

export default function FileAnalysisClient({ file, userId }: FileAnalysisClientProps) {
  const router = useRouter();
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportSuccess, setReportSuccess] = useState("");
  const [generatedReports, setGeneratedReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'table' | 'reports'>('overview');

  // Load existing reports on mount
  useEffect(() => {
    if (file.Patient?.id) {
      fetchReports();
    }
  }, [file.Patient?.id]);

  const fetchReports = async () => {
    try {
      const response = await fetch(`/api/reports?patientId=${file.Patient.id}`);
      if (response.ok) {
        const data = await response.json();
        setGeneratedReports(data.reports || []);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    }
  };

    const handleGenerateReport = async (reportType: string) => {
    if (!file.Patient?.id) {
      setReportError("Patient information not found");
      return;
    }

    setIsGeneratingReport(true);
    setReportError("");
    setReportSuccess("");

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: file.Patient.id,
          reportType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate report");
      }

      setReportSuccess(`${data.report.title} generated successfully!`);
      setSelectedReport(data.report);
      setActiveTab('reports');
      
      // Refresh reports list
      await fetchReports();

      // Auto-clear success message after 5 seconds
      setTimeout(() => setReportSuccess(""), 5000);
    } catch (error: any) {
      setReportError(error.message || "An error occurred while generating the report");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ANALYZED":
        return "bg-green-100 text-green-800";
      case "PROCESSING":
        return "bg-yellow-100 text-yellow-800";
      case "UPLOADED":
        return "bg-blue-100 text-blue-800";
      case "ERROR":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
          <Link href="/dashboard/files" className="hover:text-blue-600:text-blue-400">
            Files
          </Link>
          <span>/</span>
          <span>{file.fileName}</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          File Analysis
        </h1>
        <p className="text-gray-600 mt-2">
          Detailed view and analysis options for uploaded medical data
        </p>
      </div>

      {/* Success/Error Messages */}
      {reportSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">{reportSuccess}</p>
        </div>
      )}

      {reportError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{reportError}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300:text-gray-300'
            }`}
          >
            Overview & Stats
          </button>
          {file.medicalRecords && file.medicalRecords.length > 0 && (
            <button
              onClick={() => setActiveTab('table')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'table'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300:text-gray-300'
              }`}
            >
              Table View ({file.medicalRecords.length} records)
            </button>
          )}
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300:text-gray-300'
            }`}
          >
            AI Reports {generatedReports.length > 0 && `(${generatedReports.length})`}
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* File Information Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              File Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">File Name</p>
                <p className="text-gray-900 font-medium mt-1">{file.fileName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Patient</p>
                <p className="text-gray-900 font-medium mt-1">
                  {file.Patient?.name || "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">File Type</p>
                <p className="text-gray-900 font-medium mt-1">{file.fileType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">File Size</p>
                <p className="text-gray-900 font-medium mt-1">
                  {formatFileSize(file.fileSize)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Upload Date</p>
                <p className="text-gray-900 font-medium mt-1">
                  {new Date(file.uploadDate).toLocaleDateString()} at{" "}
                  {new Date(file.uploadDate).toLocaleTimeString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${getStatusColor(
                    file.status
                  )}`}
                >
                  {file.status}
                </span>
              </div>
            </div>

            {/* Data Cleaning Summary */}
            {file.metadata?.cleaning && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Data Cleaning Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600">Original Rows</p>
                    <p className="text-2xl font-bold text-blue-900 mt-1">
                      {file.metadata.cleaning.originalRows}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600">Cleaned Rows</p>
                    <p className="text-2xl font-bold text-green-900 mt-1">
                      {file.metadata.cleaning.cleanedRows}
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-yellow-600">Rows Removed</p>
                    <p className="text-2xl font-bold text-yellow-900 mt-1">
                      {file.metadata.cleaning.rowsRemoved}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-600">Success Rate</p>
                    <p className="text-2xl font-bold text-purple-900 mt-1">
                      {((file.metadata.cleaning.cleanedRows / file.metadata.cleaning.originalRows) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                {file.metadata.cleaning.warnings && file.metadata.cleaning.warnings.length > 0 && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-yellow-800 mb-2">
                      Cleaning Warnings ({file.metadata.cleaning.warnings.length})
                    </h4>
                    <ul className="text-sm text-yellow-700 space-y-1 max-h-40 overflow-y-auto">
                      {file.metadata.cleaning.warnings.slice(0, 10).map((warning: string, idx: number) => (
                        <li key={idx}>{warning}</li>
                      ))}
                      {file.metadata.cleaning.warnings.length > 10 && (
                        <li className="italic">... and {file.metadata.cleaning.warnings.length - 10} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Medical Records Summary */}
            {file.medicalRecords && file.medicalRecords.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Extracted Data Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600">Medical Records</p>
                    <p className="text-2xl font-bold text-blue-900 mt-1">
                      {file.medicalRecords.length}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600">Lab Results</p>
                    <p className="text-2xl font-bold text-green-900 mt-1">
                      {file.medicalRecords.reduce(
                        (sum: number, record: any) => sum + (record.labResults?.length || 0),
                    0
                  )}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600">Diagnoses</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  {file.medicalRecords.reduce(
                    (sum: number, record: any) => sum + (record.diagnoses?.length || 0),
                    0
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Report Generation Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Generate Analysis Reports
        </h2>
        <p className="text-gray-600 mb-6">
          Create comprehensive medical reports based on the uploaded data
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => handleGenerateReport("summary")}
            disabled={isGeneratingReport}
            className="flex flex-col items-start p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-900 mb-1">
              Summary Report
            </h3>
            <p className="text-sm text-gray-600 text-left">
              Overview of patient data with key metrics and statistics
            </p>
          </button>

          <button
            onClick={() => handleGenerateReport("analytics")}
            disabled={isGeneratingReport}
            className="flex flex-col items-start p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-2xl mb-2">📈</div>
            <h3 className="font-semibold text-gray-900 mb-1">
              Analytics Report
            </h3>
            <p className="text-sm text-gray-600 text-left">
              Lab trends, patterns, and changes over time
            </p>
          </button>

          <button
            onClick={() => handleGenerateReport("risk-assessment")}
            disabled={isGeneratingReport}
            className="flex flex-col items-start p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-2xl mb-2">⚠️</div>
            <h3 className="font-semibold text-gray-900 mb-1">
              Risk Assessment
            </h3>
            <p className="text-sm text-gray-600 text-left">
              Identify potential health risks based on patient data
            </p>
          </button>

          <button
            onClick={() => handleGenerateReport("trend-analysis")}
            disabled={isGeneratingReport}
            className="flex flex-col items-start p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-2xl mb-2">📉</div>
            <h3 className="font-semibold text-gray-900 mb-1">
              Trend Analysis
            </h3>
            <p className="text-sm text-gray-600 text-left">
              Detailed trend analysis with volatility calculations
            </p>
          </button>
        </div>
      </div>

      {/* Data Visualization */}
      {file.fileType === "text/csv" && file.status === "ANALYZED" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <CSVViewer
            fileId={file.id}
            fileName={file.fileName}
            metadata={file.metadata}
          />
        </div>
      )}

      {/* Metadata Display */}
      {file.metadata && Object.keys(file.metadata).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            File Metadata
          </h2>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
            {JSON.stringify(file.metadata, null, 2)}
          </pre>
        </div>
      )}
    </>
  )}

  {/* Table View Tab */}
  {activeTab === 'table' && (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Interactive Data Table
            </h2>
            <p className="text-gray-600 mt-1">
              View, filter, and sort medical records with field mapping details
            </p>
          </div>
          
          {/* Field Mapping Info */}
          {file.metadata?.cleaning?.fieldMappings && file.metadata.cleaning.fieldMappings.length > 0 && (
            <div className="bg-blue-50 px-4 py-2 rounded-lg">
              <p className="text-sm text-blue-700">
                <span className="font-semibold">{file.metadata.cleaning.fieldMappings.length}</span> fields automatically mapped
              </p>
            </div>
          )}
        </div>

        {/* Field Mappings Display */}
        {file.metadata?.cleaning?.fieldMappings && file.metadata.cleaning.fieldMappings.length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Field Mappings Applied
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {file.metadata.cleaning.fieldMappings.map((mapping: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-xs bg-white px-3 py-2 rounded border border-gray-200"
                >
                  <span className="text-gray-600">{mapping.original}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium text-gray-900">{mapping.standard}</span>
                  <span className={`ml-auto px-2 py-0.5 rounded text-xs font-medium ${
                    mapping.confidence === 'exact'
                      ? 'bg-green-100 text-green-700'
                      : mapping.confidence === 'high'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {mapping.confidence}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Table */}
        <CSVTableView
          data={file.medicalRecords}
          fileName={file.fileName}
          fieldMappings={file.metadata?.cleaning?.fieldMappings}
        />
      </div>
    </>
  )}

  {/* Reports Tab */}
  {activeTab === 'reports' && (
    <>
      {/* Generate Reports Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          AI-Powered Medical Reports
        </h2>
        <p className="text-gray-600 mb-6">
          Generate intelligent analysis reports using advanced AI
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => handleGenerateReport("summary")}
            disabled={isGeneratingReport}
            className="flex flex-col items-start p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-900 mb-1">
              Summary Report
            </h3>
            <p className="text-sm text-gray-600 text-left">
              AI-powered overview with key metrics and clinical insights
            </p>
          </button>

          <button
            onClick={() => handleGenerateReport("analytics")}
            disabled={isGeneratingReport}
            className="flex flex-col items-start p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-2xl mb-2">📈</div>
            <h3 className="font-semibold text-gray-900 mb-1">
              Analytics Report
            </h3>
            <p className="text-sm text-gray-600 text-left">
              Statistical analysis of trends, patterns, and correlations
            </p>
          </button>

          <button
            onClick={() => handleGenerateReport("risk_assessment")}
            disabled={isGeneratingReport}
            className="flex flex-col items-start p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-2xl mb-2">⚠️</div>
            <h3 className="font-semibold text-gray-900 mb-1">
              Risk Assessment
            </h3>
            <p className="text-sm text-gray-600 text-left">
              AI-identified health risks with evidence-based recommendations
            </p>
          </button>

          <button
            onClick={() => handleGenerateReport("trend_analysis")}
            disabled={isGeneratingReport}
            className="flex flex-col items-start p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-2xl mb-2">📉</div>
            <h3 className="font-semibold text-gray-900 mb-1">
              Trend Analysis
            </h3>
            <p className="text-sm text-gray-600 text-left">
              Detailed time-series analysis with predictive indicators
            </p>
          </button>
        </div>
      </div>

      {/* Selected Report Viewer */}
      {selectedReport && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedReport.title}
              </h2>
              <p className="text-sm text-gray-600">
                Generated {new Date(selectedReport.createdAt).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => setSelectedReport(null)}
              className="text-gray-400 hover:text-gray-600:text-gray-300"
            >
              ✕
            </button>
          </div>

          <div className="prose max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {selectedReport.content}
            </ReactMarkdown>
          </div>

          {selectedReport.insights && selectedReport.insights.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Key Insights
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                {selectedReport.insights.map((insight: string, idx: number) => (
                  <li key={idx}>{insight}</li>
                ))}
              </ul>
            </div>
          )}

          {selectedReport.recommendations && selectedReport.recommendations.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Recommendations
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                {selectedReport.recommendations.map((rec: string, idx: number) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Reports List */}
      {generatedReports.length > 0 && !selectedReport && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Previous Reports ({generatedReports.length})
          </h2>
          <div className="space-y-4">
            {generatedReports.map((report: any) => (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500:border-blue-500 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {report.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(report.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-blue-600">View →</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {generatedReports.length === 0 && !selectedReport && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Reports Generated Yet
          </h3>
          <p className="text-gray-600">
            Generate your first AI-powered report using the buttons above
          </p>
        </div>
      )}
    </>
  )}
    </div>
  );
}
