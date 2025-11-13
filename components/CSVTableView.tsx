"use client";

import { useState, useMemo } from 'react';
import { MedicalRecord } from '@/lib/medical-data/schema';

interface CSVTableViewProps {
  data: MedicalRecord[];
  fileName: string;
  fieldMappings?: Array<{
    original: string;
    standard: string;
    confidence: string;
    category?: string;
  }>;
}

type SortDirection = 'asc' | 'desc' | null;

export default function CSVTableView({ data, fileName, fieldMappings }: CSVTableViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [filterText, setFilterText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Extract all unique columns from the data
  const columns = useMemo(() => {
    if (data.length === 0) return [];
    
    const cols = new Set<string>();
    
    data.forEach(record => {
      // Add basic fields
      cols.add('visitDate');
      cols.add('visitType');
      
      // Add vitals
      if (record.vitals) {
        Object.keys(record.vitals).forEach(key => {
          if (record.vitals[key as keyof typeof record.vitals] !== undefined) {
            cols.add(`vitals.${key}`);
          }
        });
      }
      
      // Add lab results
      if (record.labResults) {
        Object.keys(record.labResults).forEach(key => {
          if (record.labResults[key as keyof typeof record.labResults] !== undefined) {
            cols.add(`labResults.${key}`);
          }
        });
      }
      
      // Add other fields
      if (record.symptoms && record.symptoms.length > 0) cols.add('symptoms');
      if (record.medications && record.medications.length > 0) cols.add('medications');
      if (record.diagnosis && record.diagnosis.length > 0) cols.add('diagnosis');
      if (record.notes) cols.add('notes');
    });
    
    return Array.from(cols);
  }, [data]);

  // Get display name for column
  const getColumnDisplay = (column: string): string => {
    const mapping = fieldMappings?.find(m => m.standard === column.replace('vitals.', '').replace('labResults.', ''));
    if (mapping) {
      return mapping.original;
    }
    
    // Format column name
    return column
      .replace('vitals.', '')
      .replace('labResults.', '')
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get cell value
  const getCellValue = (record: MedicalRecord, column: string): any => {
    if (column.startsWith('vitals.')) {
      const key = column.replace('vitals.', '') as keyof typeof record.vitals;
      return record.vitals?.[key];
    }
    if (column.startsWith('labResults.')) {
      const key = column.replace('labResults.', '') as keyof typeof record.labResults;
      return record.labResults?.[key];
    }
    if (column === 'visitDate') return record.visitDate;
    if (column === 'visitType') return record.visitType;
    if (column === 'symptoms') return record.symptoms?.join(', ');
    if (column === 'medications') return record.medications?.map(m => m.name).join(', ');
    if (column === 'diagnosis') return record.diagnosis?.join(', ');
    if (column === 'notes') return record.notes;
    return null;
  };

  // Get column category
  const getColumnCategory = (column: string): string => {
    if (column.startsWith('vitals.')) return 'vitals';
    if (column.startsWith('labResults.')) return 'labs';
    if (column === 'visitDate' || column === 'visitType') return 'visit';
    if (['symptoms', 'diagnosis', 'notes'].includes(column)) return 'clinical';
    if (column === 'medications') return 'medications';
    return 'other';
  };

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = data;

    // Filter by text
    if (filterText) {
      filtered = filtered.filter(record => {
        return columns.some(col => {
          const value = getCellValue(record, col);
          return value?.toString().toLowerCase().includes(filterText.toLowerCase());
        });
      });
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      const categoryColumns = columns.filter(col => getColumnCategory(col) === selectedCategory);
      // Keep records that have any value in the selected category
      filtered = filtered.filter(record => {
        return categoryColumns.some(col => {
          const value = getCellValue(record, col);
          return value !== null && value !== undefined && value !== '';
        });
      });
    }

    // Sort
    if (sortColumn && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = getCellValue(a, sortColumn);
        const bVal = getCellValue(b, sortColumn);
        
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        const aStr = aVal.toString();
        const bStr = bVal.toString();
        return sortDirection === 'asc' 
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      });
    }

    return filtered;
  }, [data, filterText, selectedCategory, sortColumn, sortDirection, columns]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = processedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle sort
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => {
        if (prev === 'asc') return 'desc';
        if (prev === 'desc') return null;
        return 'asc';
      });
      if (sortDirection === 'desc') {
        setSortColumn(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: columns.length,
      visit: 0,
      vitals: 0,
      labs: 0,
      medications: 0,
      clinical: 0,
      other: 0
    };
    
    columns.forEach(col => {
      const category = getColumnCategory(col);
      counts[category] = (counts[category] || 0) + 1;
    });
    
    return counts;
  }, [columns]);

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No data available to display
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search all columns..."
            value={filterText}
            onChange={(e) => {
              setFilterText(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Items per page */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Show:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-gray-600">per page</span>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'All Fields', color: 'gray' },
          { id: 'visit', label: 'Visit Info', color: 'blue' },
          { id: 'vitals', label: 'Vitals', color: 'green' },
          { id: 'labs', label: 'Lab Results', color: 'purple' },
          { id: 'medications', label: 'Medications', color: 'orange' },
          { id: 'clinical', label: 'Clinical Notes', color: 'red' },
        ].map(({ id, label, color }) => {
          const count = categoryCounts[id] || 0;
          if (id !== 'all' && count === 0) return null;
          
          return (
            <button
              key={id}
              onClick={() => {
                setSelectedCategory(id);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === id
                  ? `bg-${color}-600 text-white`
                  : `bg-${color}-100${color}-900/20 text-${color}-700${color}-400 hover:bg-${color}-200:bg-${color}-900/40`
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          Showing {paginatedData.length} of {processedData.length} records
          {filterText && ` (filtered from ${data.length} total)`}
        </div>
        <div>
          {columns.length} columns
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10">
                #
              </th>
              {columns.map((column) => {
                const category = getColumnCategory(column);
                const categoryColors: Record<string, string> = {
                  visit: 'text-blue-700',
                  vitals: 'text-green-700',
                  labs: 'text-purple-700',
                  medications: 'text-orange-700',
                  clinical: 'text-red-700',
                  other: 'text-gray-700'
                };
                
                return (
                  <th
                    key={column}
                    className={`px-4 py-3 text-left font-semibold cursor-pointer hover:bg-gray-100:bg-gray-700 ${categoryColors[category]}`}
                    onClick={() => handleSort(column)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{getColumnDisplay(column)}</span>
                      {sortColumn === column && (
                        <span className="text-blue-600">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedData.map((record, idx) => (
              <tr
                key={idx}
                className="hover:bg-gray-50:bg-gray-800/50 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-gray-900 sticky left-0 bg-white">
                  {(currentPage - 1) * itemsPerPage + idx + 1}
                </td>
                {columns.map((column) => {
                  const value = getCellValue(record, column);
                  const displayValue = value !== null && value !== undefined 
                    ? typeof value === 'number'
                      ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
                      : value.toString()
                    : '-';
                  
                  return (
                    <td
                      key={column}
                      className="px-4 py-3 text-gray-700 max-w-xs truncate"
                      title={displayValue}
                    >
                      {displayValue}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50:bg-gray-700 transition-colors"
          >
            Previous
          </button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 hover:bg-gray-50:bg-gray-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50:bg-gray-700 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
