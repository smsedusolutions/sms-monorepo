import React from 'react';
import DataTableBase, { type TableColumn } from 'react-data-table-component';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Chip,
  Paper,
  Pagination,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { customTableStyles } from '../../style/dataTableTheme';
import { useIsMobile } from '../../hooks/useIsMobile';
import MobileCardList from '../mobile/data/MobileCardList';
import MobileCardItem, { type MobileCardMeta } from '../mobile/data/MobileCardItem';
import MobileFAB from '../mobile/navigation/MobileFAB';

// Column definition - maintain backward compatibility
export interface Column<T> {
  id: keyof T | string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
  format?: (value: T[keyof T], row: T) => React.ReactNode;
  hide?: 'sm' | 'md'; // Hide column on small/medium screens
  sortable?: boolean;
}

interface DataTableProps<T> {
  title: string;
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  error?: string | null;
  onAddClick?: () => void;
  addButtonLabel?: string;
  emptyMessage?: string;
  getRowKey?: (row: T) => string;
  onRowClick?: (row: T) => void;
  pagination?: boolean;
  paginationPerPage?: number;
  paginationServer?: boolean;
  paginationTotalRows?: number;
  onChangePage?: (page: number) => void;
  onChangeRowsPerPage?: (limit: number, page: number) => void;
  renderHeaderActions?: () => React.ReactNode;
}

// Transform our Column type to react-data-table-component's TableColumn
function transformColumns<T>(columns: Column<T>[]): TableColumn<T>[] {
  return columns.map((col) => ({
    name: col.label,
    selector: (row: T) => {
      const value = (row as Record<string, unknown>)[col.id as string];
      return value as string | number;
    },
    cell: col.format
      ? (row: T) => {
        const value = (row as Record<string, unknown>)[col.id as string];
        return col.format!(value as T[keyof T], row);
      }
      : undefined,
    sortable: col.sortable ?? true,
    minWidth: col.minWidth ? `${col.minWidth}px` : undefined,
    right: col.align === 'right' ? true : undefined,
    center: col.align === 'center' ? true : undefined,
    omit: false,
    hide: col.hide === 'sm' ? 600 : col.hide === 'md' ? 900 : undefined,
  }));
}

function DataTable<T>({
  title,
  columns,
  data,
  isLoading = false,
  error = null,
  onAddClick,
  addButtonLabel = 'Add New',
  emptyMessage = 'No data found',
  onRowClick,
  pagination = true,
  paginationPerPage = 10,
  paginationServer = false,
  paginationTotalRows,
  onChangePage,
  onChangeRowsPerPage,
  renderHeaderActions,
}: DataTableProps<T>) {
  const isMobile = useIsMobile();
  const [currentPage, setCurrentPage] = React.useState(1);

  const transformedColumns = transformColumns(columns);

  // Custom loading component
  const LoadingComponent = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
      <CircularProgress size={40} />
      <Typography variant="body2" sx={{ mt: 2 }}>
        Loading...
      </Typography>
    </Box>
  );

  // Custom no data component
  const NoDataComponent = () => (
    <Box sx={{ py: 4, textAlign: 'center' }}>
      <Typography color="text.secondary">{error || emptyMessage}</Typography>
    </Box>
  );

  // Mobile Render Mode
  if (isMobile) {
    const totalItems = paginationServer ? paginationTotalRows || data.length : data.length;
    const totalPages = Math.ceil(totalItems / paginationPerPage) || 1;

    const displayedData = paginationServer
      ? data
      : pagination
        ? data.slice((currentPage - 1) * paginationPerPage, currentPage * paginationPerPage)
        : data;

    const handlePageChange = (_: any, page: number) => {
      setCurrentPage(page);
      if (onChangePage) {
        onChangePage(page);
      }
    };

    return (
      <Box sx={{ width: '100%', pb: onAddClick ? 8 : 2 }}>
        {/* Mobile Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          {title && (
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: '1.25rem',
                color: '#0f172a',
                fontFamily: '"Outfit", sans-serif',
              }}
            >
              {title}
            </Typography>
          )}

          {renderHeaderActions && <Box sx={{ display: 'flex', gap: 1 }}>{renderHeaderActions()}</Box>}
        </Box>

        {/* Mobile Cards List */}
        <MobileCardList
          isLoading={isLoading}
          isError={Boolean(error)}
          emptyTitle="No Records Found"
          emptyMessage={error || emptyMessage}
          totalCount={totalItems}
          itemCount={displayedData.length}
        >
          {displayedData.map((row: any, index: number) => {
            // Pick title from the first non-id column or first column
            const titleCol = columns.find((c) => c.id !== 'id' && c.id !== 'actions') || columns[0];
            const subtitleCol = columns.find((c) => c !== titleCol && c.id !== 'actions' && c.id !== 'status');
            const statusCol = columns.find((c) => c.id === 'status');
            const actionCol = columns.find((c) => c.id === 'actions');

            const cardTitle = titleCol?.format
              ? titleCol.format(row[titleCol.id], row)
              : row[titleCol?.id as string] || 'Item';

            const cardSubtitle = subtitleCol?.format
              ? subtitleCol.format(row[subtitleCol.id], row)
              : subtitleCol?.id
                ? row[subtitleCol.id as string]
                : undefined;

            const cardBadge = statusCol?.format
              ? statusCol.format(row[statusCol.id], row)
              : row.status
                ? <StatusChip status={row.status} />
                : undefined;

            const rightAction = actionCol?.format
              ? actionCol.format(row[actionCol.id], row)
              : undefined;

            // Extract metadata from other columns
            const metaItems: MobileCardMeta[] = [];
            columns.forEach((col) => {
              if (
                col !== titleCol &&
                col !== subtitleCol &&
                col !== statusCol &&
                col !== actionCol &&
                col.id !== 'id'
              ) {
                const val = col.format ? col.format(row[col.id], row) : row[col.id as string];
                if (val !== undefined && val !== null && val !== '') {
                  metaItems.push({
                    label: col.label,
                    value: val,
                  });
                }
              }
            });

            return (
              <MobileCardItem
                key={row.id || row.studentId || row.teacherId || row.classId || row.schoolId || index}
                title={cardTitle}
                subtitle={cardSubtitle}
                badge={cardBadge}
                rightAction={rightAction}
                metaItems={metaItems}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              />
            );
          })}
        </MobileCardList>

        {/* Mobile Pagination */}
        {pagination && totalPages > 1 && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              mt: 2.5,
              mb: 1,
              pb: onAddClick ? 9 : 8,
              gap: 0.75,
            }}
          >
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              shape="rounded"
              size="small"
              siblingCount={0}
              boundaryCount={1}
              sx={{
                '& .MuiPagination-ul': {
                  flexWrap: 'nowrap',
                  justifyContent: 'center',
                },
                '& .MuiPaginationItem-root': {
                  minWidth: 30,
                  height: 30,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  margin: '0 2px',
                  borderRadius: '8px',
                },
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
              Page {currentPage} of {totalPages} ({totalItems} total)
            </Typography>
          </Box>
        )}

        {/* Mobile Floating Action Button (FAB) for Add */}
        {onAddClick && (
          <MobileFAB
            onClick={onAddClick}
            label={addButtonLabel}
          />
        )}
      </Box>
    );
  }

  // Desktop Render Mode
  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      {(title || onAddClick) && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          {title && (
            <Typography variant="h5" fontWeight={600} color="text.primary">
              {title}
            </Typography>
          )}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {renderHeaderActions && renderHeaderActions()}
            {onAddClick && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onAddClick}
                sx={{
                  textTransform: 'none',
                  borderRadius: 1,
                  px: 3,
                }}
              >
                {addButtonLabel}
              </Button>
            )}
          </Box>
        </Box>
      )}

      {/* Table */}
      <Paper
        sx={{
          borderRadius: 1,
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <DataTableBase<T>
          columns={transformedColumns}
          data={data}
          progressPending={isLoading}
          progressComponent={<LoadingComponent />}
          noDataComponent={<NoDataComponent />}
          customStyles={customTableStyles}
          pagination={pagination}
          paginationPerPage={paginationPerPage}
          paginationRowsPerPageOptions={[10, 20, 30, 50]}
          paginationServer={paginationServer}
          paginationTotalRows={paginationTotalRows}
          onChangePage={onChangePage}
          onChangeRowsPerPage={onChangeRowsPerPage}
          highlightOnHover
          pointerOnHover={!!onRowClick}
          onRowClicked={onRowClick}
          responsive
        />
      </Paper>
    </Box>
  );
}

// Helper component for status chips
export const StatusChip: React.FC<{ status: 'active' | 'inactive' }> = ({ status }) => (
  <Chip
    label={status}
    size="small"
    color={status === 'active' ? 'success' : 'default'}
    sx={{ textTransform: 'capitalize' }}
  />
);

export default DataTable;
