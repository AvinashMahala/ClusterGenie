import React, { useState, useMemo } from 'react';
import { EmptyState } from '../common';
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
  // additional features
  pagination?: boolean;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  allowColumnToggle?: boolean;
  dense?: boolean;
  // highlight row id (uses rowKey to match)
  highlightedRowId?: string | null;
  rowKey?: keyof T | string;
  highlightClassName?: string;
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
  pagination = false,
  defaultPageSize = 10,
  pageSizeOptions = [5, 10, 20],
  allowColumnToggle = false,
  dense = false,
  highlightedRowId = null,
  rowKey = 'id',
  highlightClassName = 'highlighted-row',
}: TabularSectionProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(defaultPageSize ?? 10);
  const [visibleCols, setVisibleCols] = useState<string[]>(columns.map(c => String(c.key)));

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

  // page slice
  const paginatedData = useMemo(() => {
    if (!pagination) return filteredAndSortedData;
    const start = (page - 1) * pageSize;
    return filteredAndSortedData.slice(start, start + pageSize);
  }, [filteredAndSortedData, page, pageSize, pagination]);

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

  const pageCount = Math.max(1, Math.ceil(filteredAndSortedData.length / pageSize));

  // auto-scroll to highlighted row when it appears
  React.useEffect(() => {
    if (!highlightedRowId) return;
    // Find element in DOM with data-row-id
    const id = String(highlightedRowId);
    const el = document.querySelector(`[data-row-id="${id}"]`);
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // add temporary pulse class (already handled by CSS via highlight class)
    }
  }, [highlightedRowId]);

  // visible columns + rows derived for simpler rendering
  const displayedColumns = columns.filter(c => visibleCols.includes(String(c.key)));
  const rows = pagination ? paginatedData : filteredAndSortedData;

  return (
    <div className={`tabular-section ${dense ? 'dense' : ''}`}>
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

        {allowColumnToggle && (
          <div className="column-toggle">
            <label>Columns</label>
            <div className="cols-list">
              {columns.map(col => (
                <label key={String(col.key)}>
                  <input type="checkbox" checked={visibleCols.includes(String(col.key))} onChange={() => {
                    const k = String(col.key);
                    setVisibleCols(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]);
                  }} />
                  {col.label}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      {filteredAndSortedData.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                {displayedColumns.map(column => {
                  if (!visibleCols.includes(String(column.key))) return null;
                  return (
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
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((item, index) => {
                const rk = String(item[rowKey as keyof T] ?? index);
                const isHighlighted = highlightedRowId && String(highlightedRowId) === rk;
                return (
                  <tr
                    key={rk}
                    data-row-id={rk}
                    className={`${onRowClick ? 'clickable' : ''} ${isHighlighted ? highlightClassName : ''}`.trim()}
                    onClick={onRowClick ? () => onRowClick(item) : undefined}
                  >
                    {displayedColumns.map(column => {
                      if (!visibleCols.includes(String(column.key))) return null;
                      return (
                        <td key={String(column.key)} className={column.className || ''}>
                          {getValue(item, column)}
                        </td>
                      );
                    })}
                  </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title={emptyStateTitle}
          description={emptyStateDescription}
          icon={emptyStateIcon}
        />
      )}

      {pagination && filteredAndSortedData.length > 0 && (
        <div className="pagination-controls">
          <div className="left">
            <label>Rows per page:
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                {(pageSizeOptions ?? [5, 10, 20]).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="right">
            <button onClick={() => setPage(1)} disabled={page === 1}>« First</button>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>‹ Prev</button>
            <span className="page-indicator">Page {page} of {pageCount}</span>
            <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page === pageCount}>Next ›</button>
            <button onClick={() => setPage(pageCount)} disabled={page === pageCount}>Last »</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TabularSection;