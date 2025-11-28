import React, { useState, useMemo } from 'react';
import './TabularSection.scss';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  className?: string;
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface TabularSectionProps<T> {
  title: string;
  icon: React.ReactNode;
  count?: number;
  actions?: React.ReactNode;
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  filterOptions?: FilterOption[];
  filterKey?: keyof T;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  emptyStateIcon?: React.ReactNode;
  onRowClick?: (item: T) => void;
}

function TabularSection<T extends Record<string, any>>({
  title,
  icon,
  count,
  actions,
  columns,
  data,
  searchPlaceholder = 'Search...',
  filterOptions,
  filterKey,
  emptyStateTitle = 'No items found',
  emptyStateDescription = 'Get started by creating your first item.',
  emptyStateIcon,
  onRowClick,
}: TabularSectionProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply status filter
    if (statusFilter && filterKey) {
      filtered = filtered.filter(item => item[filterKey] === statusFilter);
    }

    // Apply sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortColumn as keyof T];
        const bValue = b[sortColumn as keyof T];

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, statusFilter, sortColumn, sortDirection, filterKey]);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const getValue = (item: T, column: Column<T>) => {
    if (column.render) {
      return column.render(item[column.key as keyof T], item);
    }
    return item[column.key as keyof T];
  };

  return (
    <div className="tabular-section">
      {/* Section Header */}
      <div className="section-header">
        <div className="section-info">
          <div className="section-icon">
            {icon}
          </div>
          <div className="section-details">
            <h2 className="section-title">{title}</h2>
            {count !== undefined && (
              <span className="section-count">{count}</span>
            )}
          </div>
        </div>
        {actions && (
          <div className="section-actions">
            {actions}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-container">
          <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        {filterOptions && filterOptions.length > 0 && (
          <div className="filter-container">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="status-filter"
            >
              <option value="">All Status</option>
              {filterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      {filteredAndSortedData.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map(column => (
                  <th
                    key={String(column.key)}
                    className={`${column.sortable ? 'sortable' : ''} ${column.className || ''}`}
                    onClick={column.sortable ? () => handleSort(String(column.key)) : undefined}
                  >
                    <div className="header-content">
                      <span>{column.label}</span>
                      {column.sortable && sortColumn === String(column.key) && (
                        <svg
                          className={`sort-icon ${sortDirection}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedData.map((item, index) => (
                <tr
                  key={index}
                  className={onRowClick ? 'clickable' : ''}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                >
                  {columns.map(column => (
                    <td key={String(column.key)} className={column.className || ''}>
                      {getValue(item, column)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            {emptyStateIcon || (
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-5v2m0 0v2m0-2h2m-2 0h-2" />
              </svg>
            )}
          </div>
          <h3>{emptyStateTitle}</h3>
          <p>{emptyStateDescription}</p>
        </div>
      )}
    </div>
  );
}

export default TabularSection;