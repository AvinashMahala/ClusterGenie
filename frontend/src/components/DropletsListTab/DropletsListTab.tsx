// frontend/src/components/DropletsListTab/DropletsListTab.tsx

import { useMemo } from 'react';
import type { Droplet } from '../../models';
import TabularSection, { type Column, type FilterOption } from '../TabularSection';
import { StatusBadge } from '../common';
import './DropletsListTab.scss';

export interface DropletsListTabProps {
  droplets: Droplet[];
  loading: boolean;
  onRefresh: () => void;
  onDelete: (id: string) => void;
}

export function DropletsListTab({ droplets, loading, onRefresh, onDelete }: DropletsListTabProps) {
  const statusFilterOptions: FilterOption[] = useMemo(() => {
    const statuses = [...new Set(droplets.map(d => d.status))];
    return statuses.map(status => ({
      value: status,
      label: status.charAt(0).toUpperCase() + status.slice(1)
    }));
  }, [droplets]);

  const columns: Column<Droplet>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value, droplet) => (
        <div className="droplet-name-cell">
          <div className="droplet-name">{value}</div>
          <div className="droplet-id">ID: {droplet.id}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      className: 'status-cell',
      render: (value) => <StatusBadge status={value as string} />
    },
    {
      key: 'region',
      label: 'Region',
      sortable: true
    },
    {
      key: 'size',
      label: 'Size',
      sortable: true
    },
    {
      key: 'image',
      label: 'Image',
      sortable: true,
      className: 'image-cell'
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value) => new Date(value as string).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'actions-cell',
      render: (_, droplet) => (
        <div className="action-buttons">
          <button
            className="action-btn action-view"
            title="View Details"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
          </button>
          <button
            className="action-btn action-edit"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
          </button>
          <button
            className="action-btn action-delete"
            onClick={() => onDelete(droplet.id)}
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      )
    }
  ];

  const sectionIcon = (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
    </svg>
  );

  const sectionActions = (
    <button
      className="refresh-button"
      onClick={onRefresh}
      disabled={loading}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
      </svg>
    </button>
  );

  const emptyStateIcon = (
    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
    </svg>
  );

  return (
    <div className="droplets-tab">
      <TabularSection
        title="Your Droplets"
        icon={sectionIcon}
        count={droplets.length}
        actions={sectionActions}
        columns={columns}
        data={droplets}
        searchPlaceholder="Search droplets..."
        filterOptions={statusFilterOptions}
        filterKey="status"
        emptyStateTitle="No droplets found"
        emptyStateDescription={
          droplets.length === 0
            ? "Create your first droplet to get started with cloud infrastructure"
            : "Try adjusting your search or filter criteria"
        }
        emptyStateIcon={emptyStateIcon}
      />
    </div>
  );
}
