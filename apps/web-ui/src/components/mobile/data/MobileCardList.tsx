import React from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Skeleton,
  Button,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import InboxRoundedIcon from '@mui/icons-material/InboxRounded';

interface MobileCardListProps {
  children?: React.ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  onFilterClick?: () => void;
  filterActiveCount?: number;
  itemCount?: number;
  totalCount?: number;
  headerAction?: React.ReactNode;
  listTitle?: string;
}

export const MobileCardList: React.FC<MobileCardListProps> = ({
  children,
  isLoading = false,
  isError = false,
  onRetry,
  emptyTitle = 'No Items Found',
  emptyMessage = 'There are no records to display at this moment.',
  emptyAction,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  onFilterClick,
  filterActiveCount = 0,
  itemCount,
  totalCount,
  headerAction,
  listTitle,
}) => {
  const showSearch = typeof onSearchChange === 'function';

  return (
    <Box sx={{ width: '100%' }}>
      {/* Top Search & Filter Bar */}
      {(showSearch || onFilterClick || headerAction) && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          {showSearch && (
            <TextField
              fullWidth
              size="small"
              placeholder={searchPlaceholder}
              value={searchValue || ''}
              onChange={(e) => onSearchChange?.(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: searchValue ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => onSearchChange?.('')}>
                      <ClearRoundedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
                sx: {
                  borderRadius: '12px',
                  bgcolor: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                  '& fieldset': { borderColor: '#e2e8f0' },
                },
              }}
            />
          )}

          {onFilterClick && (
            <IconButton
              onClick={onFilterClick}
              sx={{
                bgcolor: filterActiveCount > 0 ? '#4f46e5' : '#ffffff',
                color: filterActiveCount > 0 ? '#ffffff' : '#64748b',
                borderRadius: '12px',
                border: '1px solid',
                borderColor: filterActiveCount > 0 ? '#4f46e5' : '#e2e8f0',
                p: 1.1,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                '&:active': { transform: 'scale(0.92)' },
              }}
            >
              <FilterListRoundedIcon sx={{ fontSize: 20 }} />
            </IconButton>
          )}

          {headerAction}
        </Box>
      )}

      {/* List Header & Count */}
      {(listTitle || typeof totalCount === 'number') && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.2, px: 0.5 }}>
          {listTitle && (
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '0.88rem',
                color: '#1e293b',
                fontFamily: '"Outfit", sans-serif',
              }}
            >
              {listTitle}
            </Typography>
          )}
          {typeof totalCount === 'number' && (
            <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
              {itemCount !== undefined ? `${itemCount} of ${totalCount}` : `${totalCount} total`}
            </Typography>
          )}
        </Box>
      )}

      {/* Loading Skeleton View */}
      {isLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {[1, 2, 3, 4, 5].map((key) => (
            <Box
              key={key}
              sx={{
                p: 2,
                bgcolor: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Skeleton variant="circular" width={42} height={42} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="65%" height={24} />
                  <Skeleton variant="text" width="40%" height={18} />
                </Box>
                <Skeleton variant="rounded" width={55} height={22} sx={{ borderRadius: '6px' }} />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, pt: 1, borderTop: '1px solid #f8fafc' }}>
                <Skeleton variant="text" width="30%" height={18} />
                <Skeleton variant="text" width="30%" height={18} />
              </Box>
            </Box>
          ))}
        </Box>
      ) : isError ? (
        /* Error State */
        <Box
          sx={{
            py: 6,
            px: 3,
            textAlign: 'center',
            bgcolor: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #fee2e2',
          }}
        >
          <Typography sx={{ color: '#ef4444', fontWeight: 700, mb: 1 }}>Failed to load data</Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.82rem', mb: 2 }}>
            There was a problem retrieving information. Please try again.
          </Typography>
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outlined"
              size="small"
              startIcon={<RefreshRoundedIcon />}
              sx={{ borderRadius: '10px', textTransform: 'none' }}
            >
              Retry
            </Button>
          )}
        </Box>
      ) : !children || (Array.isArray(children) && children.length === 0) ? (
        /* Empty State */
        <Box
          sx={{
            py: 6,
            px: 3,
            textAlign: 'center',
            bgcolor: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
              color: '#94a3b8',
            }}
          >
            <InboxRoundedIcon sx={{ fontSize: 32 }} />
          </Box>
          <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', mb: 0.5 }}>
            {emptyTitle}
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.82rem', mb: emptyAction ? 2.5 : 0, maxWidth: 280, mx: 'auto' }}>
            {emptyMessage}
          </Typography>
          {emptyAction}
        </Box>
      ) : (
        /* Children Cards List */
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>{children}</Box>
      )}
    </Box>
  );
};

export default MobileCardList;
