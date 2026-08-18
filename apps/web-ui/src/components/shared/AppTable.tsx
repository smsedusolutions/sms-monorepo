import React from 'react';
import DataTableBase, { type TableColumn } from 'react-data-table-component';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Pagination,
} from '@mui/material';
import { customTableStyles } from '../../style/dataTableTheme';
import { useIsMobile } from '../../hooks/useIsMobile';
import MobileCardList from '../mobile/data/MobileCardList';
import MobileCardItem from '../mobile/data/MobileCardItem';
import type { MobileCardMeta } from '../mobile/data/MobileCardItem';

export interface AppTableColumn<T> {
  name: string;
  selector?: (row: T) => any;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  center?: boolean;
  right?: boolean;
}

export interface AppTableProps<T> {
  title?: string;
  columns: AppTableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  selectableRows?: boolean;
  onSelectedRowsChange?: (selected: { selectedRows: T[] }) => void;
  actions?: React.ReactNode;
  pagination?: boolean;
  paginationPerPage?: number;
  paginationServer?: boolean;
  paginationTotalRows?: number;
  onChangePage?: (page: number) => void;
  onChangeRowsPerPage?: (currentRowsPerPage: number, currentPage: number) => void;
}

export const AppTable = <T extends Record<string, any>>({
  title,
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No data found',
  onRowClick,
  selectableRows = false,
  onSelectedRowsChange,
  actions,
  pagination = true,
  paginationPerPage = 10,
  paginationServer = false,
  paginationTotalRows = 0,
  onChangePage,
  onChangeRowsPerPage,
}: AppTableProps<T>) => {
  const isMobile = useIsMobile();
  const [currentPage, setCurrentPage] = React.useState(1);

  const transformedColumns: TableColumn<T>[] = columns.map((col) => ({
    name: col.name,
    selector: col.selector as any,
    cell: col.cell,
    sortable: col.sortable,
    width: col.width,
    minWidth: col.minWidth,
    maxWidth: col.maxWidth,
    center: col.center,
    right: col.right,
  }));

  const LoadingComponent = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
      <CircularProgress size={40} />
      <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
        Loading data...
      </Typography>
    </Box>
  );

  const NoDataComponent = () => (
    <Box sx={{ py: 8, textAlign: 'center' }}>
      <Typography color="text.secondary">{emptyMessage}</Typography>
    </Box>
  );

  // Mobile Native Rendering
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
      <Box sx={{ width: '100%' }}>
        {/* Mobile Header */}
        {(title || actions) && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            {title && (
              <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', color: '#0f172a', fontFamily: '"Outfit", sans-serif' }}>
                {title}
              </Typography>
            )}
            {actions && <Box sx={{ display: 'flex', gap: 1 }}>{actions}</Box>}
          </Box>
        )}

        {/* Mobile Card List */}
        <MobileCardList
          isLoading={isLoading}
          emptyTitle="No Data Found"
          emptyMessage={emptyMessage}
          totalCount={totalItems}
          itemCount={displayedData.length}
        >
          {displayedData.map((row, index) => {
            const selectCol = columns.find(
              (c) => c.name && (c.name.toLowerCase() === 'select' || c.name.toLowerCase() === 'checkbox')
            );
            const actionCol = columns.find(
              (c) =>
                c.name &&
                ['action', 'actions', 'view', 'edit', 'operations'].includes(c.name.toLowerCase())
            );
            const statusCol = columns.find(
              (c) =>
                c.name &&
                ['status', 'account status', 'ledger status', 'state'].includes(c.name.toLowerCase())
            );

            const contentCols = columns.filter(
              (c) => c !== selectCol && c !== actionCol && c !== statusCol
            );

            const titleCol = contentCols[0] || columns[0];
            const subtitleCol =
              contentCols.length > 1 && !contentCols[0]?.cell ? contentCols[1] : undefined;

            const cardTitle = titleCol?.cell
              ? titleCol.cell(row)
              : titleCol?.selector
              ? String(titleCol.selector(row) || '')
              : 'Item';

            const cardSubtitle = subtitleCol?.cell
              ? subtitleCol.cell(row)
              : subtitleCol?.selector
              ? String(subtitleCol.selector(row) || '')
              : undefined;

            const cardBadge = statusCol?.cell
              ? statusCol.cell(row)
              : statusCol?.selector
              ? String(statusCol.selector(row) || '')
              : undefined;

            const cardAvatar = selectCol?.cell ? (
              <Box
                sx={{ display: 'flex', alignItems: 'center', mr: -0.5 }}
                onClick={(e) => e.stopPropagation()}
              >
                {selectCol.cell(row)}
              </Box>
            ) : undefined;

            const metaItems: MobileCardMeta[] = [];
            contentCols.forEach((col) => {
              if (col !== titleCol && col !== subtitleCol) {
                const val = col.cell ? col.cell(row) : col.selector ? col.selector(row) : null;
                if (val !== null && val !== undefined && val !== '') {
                  metaItems.push({
                    label: col.name,
                    value: val,
                  });
                }
              }
            });

            const rightAction = actionCol?.cell
              ? actionCol.cell(row)
              : actionCol?.selector
              ? String(actionCol.selector(row) || '')
              : undefined;

            return (
              <MobileCardItem
                key={row.id || row._id || row.studentId || row.studentFeeAccountId || index}
                avatar={cardAvatar}
                title={cardTitle}
                subtitle={cardSubtitle}
                badge={cardBadge}
                metaItems={metaItems}
                rightAction={rightAction}
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
              pb: 8,
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
      </Box>
    );
  }

  // Desktop Rendering
  return (
    <Box sx={{ width: '100%' }}>
      {(title || actions) && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
          {title && (
            <Typography variant="h5" fontWeight={700}>
              {title}
            </Typography>
          )}
          {actions}
        </Box>
      )}

      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <DataTableBase<T>
          columns={transformedColumns}
          data={data}
          progressPending={isLoading}
          progressComponent={<LoadingComponent />}
          noDataComponent={<NoDataComponent />}
          customStyles={customTableStyles}
          selectableRows={selectableRows}
          onSelectedRowsChange={onSelectedRowsChange}
          onRowClicked={onRowClick}
          highlightOnHover
          pointerOnHover={!!onRowClick}
          responsive
          pagination={pagination}
          paginationPerPage={paginationPerPage}
          paginationServer={paginationServer}
          paginationTotalRows={paginationTotalRows}
          onChangePage={onChangePage}
          onChangeRowsPerPage={onChangeRowsPerPage}
          paginationRowsPerPageOptions={[10, 20, 50, 100]}
        />
      </Paper>
    </Box>
  );
};

