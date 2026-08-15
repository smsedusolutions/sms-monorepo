import React from 'react';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { AppTable } from '../../shared/AppTable';
import type { AppTableProps } from '../../shared/AppTable';
import MobileCardList from './MobileCardList';
import MobileCardItem from './MobileCardItem';
import type { MobileCardMeta } from './MobileCardItem';
import { Box, Pagination } from '@mui/material';

export interface MobileAdaptiveTableProps<T> extends AppTableProps<T> {
  mobileTitleKey?: keyof T | ((row: T) => React.ReactNode);
  mobileSubtitleKey?: keyof T | ((row: T) => React.ReactNode);
  mobileAvatarKey?: keyof T | ((row: T) => React.ReactNode);
  renderMobileCard?: (row: T, index: number) => React.ReactNode;
}

export const MobileAdaptiveTable = <T extends Record<string, any>>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No records found',
  title,
  actions,
  onRowClick,
  pagination = true,
  paginationPerPage = 10,
  paginationTotalRows,
  paginationServer = false,
  onChangePage,
  mobileTitleKey,
  mobileSubtitleKey,
  mobileAvatarKey,
  renderMobileCard,
  ...props
}: MobileAdaptiveTableProps<T>) => {
  const isMobile = useIsMobile();
  const [currentPage, setCurrentPage] = React.useState(1);

  // If on desktop, render standard AppTable
  if (!isMobile) {
    return (
      <AppTable<T>
        columns={columns}
        data={data}
        isLoading={isLoading}
        emptyMessage={emptyMessage}
        title={title}
        actions={actions}
        onRowClick={onRowClick}
        pagination={pagination}
        paginationPerPage={paginationPerPage}
        paginationTotalRows={paginationTotalRows}
        paginationServer={paginationServer}
        onChangePage={onChangePage}
        {...props}
      />
    );
  }

  // Mobile View
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
      {/* Mobile Top Header (Title + Actions) */}
      {(title || actions) && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          {title && (
            <Box sx={{ fontWeight: 800, fontSize: '1.25rem', color: '#0f172a', fontFamily: '"Outfit", sans-serif' }}>
              {title}
            </Box>
          )}
          {actions && <Box sx={{ display: 'flex', gap: 1 }}>{actions}</Box>}
        </Box>
      )}

      {/* Mobile Cards List */}
      <MobileCardList
        isLoading={isLoading}
        emptyTitle="No Data Found"
        emptyMessage={emptyMessage}
        totalCount={totalItems}
        itemCount={displayedData.length}
      >
        {displayedData.map((row, index) => {
          if (renderMobileCard) {
            return (
              <React.Fragment key={row.id || row._id || index}>
                {renderMobileCard(row, index)}
              </React.Fragment>
            );
          }

          // Extract title
          let cardTitle: React.ReactNode = '';
          if (typeof mobileTitleKey === 'function') {
            cardTitle = mobileTitleKey(row);
          } else if (mobileTitleKey) {
            cardTitle = String(row[mobileTitleKey] || '');
          } else if (columns.length > 0) {
            const firstCol = columns[0];
            cardTitle = firstCol.cell ? firstCol.cell(row) : firstCol.selector ? String(firstCol.selector(row) || '') : '';
          }

          // Extract subtitle
          let cardSubtitle: React.ReactNode = '';
          if (typeof mobileSubtitleKey === 'function') {
            cardSubtitle = mobileSubtitleKey(row);
          } else if (mobileSubtitleKey) {
            cardSubtitle = String(row[mobileSubtitleKey] || '');
          } else if (columns.length > 1) {
            const secondCol = columns[1];
            cardSubtitle = secondCol.cell ? secondCol.cell(row) : secondCol.selector ? String(secondCol.selector(row) || '') : '';
          }

          // Extract avatar
          let cardAvatar: React.ReactNode = null;
          let avatarText = '';
          if (typeof mobileAvatarKey === 'function') {
            cardAvatar = mobileAvatarKey(row);
          } else if (mobileAvatarKey) {
            avatarText = String(row[mobileAvatarKey] || '');
          } else if (typeof cardTitle === 'string' && cardTitle) {
            avatarText = cardTitle;
          }

          // Extract metadata from remaining columns
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

          // Check if there's an action column
          const actionCol = columns.find(
            (c) => c.name && (c.name.toLowerCase() === 'action' || c.name.toLowerCase() === 'actions')
          );
          const rightAction = actionCol?.cell ? actionCol.cell(row) : undefined;

          return (
            <MobileCardItem
              key={row.id || row._id || index}
              title={cardTitle}
              subtitle={cardSubtitle}
              avatar={cardAvatar}
              avatarText={avatarText}
              metaItems={metaItems}
              rightAction={rightAction}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            />
          );
        })}
      </MobileCardList>

      {/* Pagination Controls */}
      {pagination && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2 }}>
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
};

export default MobileAdaptiveTable;
