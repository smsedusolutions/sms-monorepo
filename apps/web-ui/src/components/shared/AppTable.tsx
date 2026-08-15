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
            const firstCol = columns[0];
            const secondCol = columns.length > 1 ? columns[1] : undefined;

            const cardTitle = firstCol?.cell
              ? firstCol.cell(row)
              : firstCol?.selector
              ? String(firstCol.selector(row) || '')
              : 'Item';

            const cardSubtitle = secondCol?.cell
              ? secondCol.cell(row)
              : secondCol?.selector
              ? String(secondCol.selector(row) || '')
              : undefined;

            const metaItems: MobileCardMeta[] = [];
            columns.slice(2).forEach((col) => {
              if (col.name && col.name.toLowerCase() !== 'action' && col.name.toLowerCase() !== 'actions') {
                const val = col.cell ? col.cell(row) : col.selector ? col.selector(row) : null;
                if (val !== null && val !== undefined && val !== '') {
                  metaItems.push({
                    label: col.name,
                    value: val,
                  });
                }
              }
            });

            const actionCol = columns.find(
              (c) => c.name && (c.name.toLowerCase() === 'action' || c.name.toLowerCase() === 'actions')
            );
            const rightAction = actionCol?.cell ? actionCol.cell(row) : undefined;

            return (
              <MobileCardItem
                key={row.id || row._id || index}
                title={cardTitle}
                subtitle={cardSubtitle}
                metaItems={metaItems}
                rightAction={rightAction}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              />
            );
          })}
        </MobileCardList>

        {/* Mobile Pagination */}
        {pagination && totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2.5, mb: 2 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              shape="rounded"
              size="medium"
            />
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

