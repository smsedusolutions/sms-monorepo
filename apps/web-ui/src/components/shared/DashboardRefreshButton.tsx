import React, { useState } from 'react';
import { Button, IconButton, Tooltip, Box, keyframes } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useQueryClient } from '@tanstack/react-query';

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

interface DashboardRefreshButtonProps {
  /** Optional custom refresh handler (e.g. calling specific refetch functions) */
  onRefresh?: () => Promise<any> | void;
  /** Specific query keys to invalidate if not using a custom onRefresh */
  queryKeys?: string[][];
  /** Whether to show text label or icon only. Default is auto (text on md+, icon on xs/sm) */
  variant?: 'button' | 'icon' | 'auto';
  /** Extra sx styles */
  sx?: object;
}

export const DashboardRefreshButton: React.FC<DashboardRefreshButtonProps> = ({
  onRefresh,
  queryKeys,
  variant = 'auto',
  sx = {},
}) => {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);

    try {
      if (onRefresh) {
        await Promise.resolve(onRefresh());
      } else if (queryKeys && queryKeys.length > 0) {
        await Promise.all(queryKeys.map((key) => queryClient.invalidateQueries({ queryKey: key })));
      } else {
        await queryClient.invalidateQueries();
      }
    } catch (err) {
      console.warn("Error refreshing dashboard queries:", err);
    } finally {
      // Ensure smooth animation lasts at least 600ms
      setTimeout(() => {
        setIsRefreshing(false);
      }, 600);
    }
  };

  const refreshIcon = (
    <RefreshIcon
      sx={{
        fontSize: { xs: 18, sm: 20 },
        animation: isRefreshing ? `${spin} 0.8s linear infinite` : 'none',
        transition: 'transform 0.2s ease',
      }}
    />
  );

  if (variant === 'icon') {
    return (
      <Tooltip title={isRefreshing ? 'Refreshing...' : 'Refresh dashboard data'} arrow>
        <span>
          <IconButton
            size="small"
            onClick={handleRefresh}
            disabled={isRefreshing}
            sx={{
              p: 1,
              bgcolor: '#f1f5f9',
              color: '#334155',
              border: '1px solid #e2e8f0',
              borderRadius: 2,
              '&:hover': {
                bgcolor: '#e2e8f0',
                color: '#0f172a',
              },
              ...sx,
            }}
          >
            {refreshIcon}
          </IconButton>
        </span>
      </Tooltip>
    );
  }

  if (variant === 'button') {
    return (
      <Button
        variant="outlined"
        size="small"
        onClick={handleRefresh}
        disabled={isRefreshing}
        startIcon={refreshIcon}
        sx={{
          textTransform: 'none',
          fontWeight: 600,
          fontSize: { xs: '0.78rem', sm: '0.825rem' },
          borderRadius: 2,
          borderColor: '#e2e8f0',
          color: '#334155',
          bgcolor: '#ffffff',
          px: 1.5,
          py: 0.5,
          '&:hover': {
            bgcolor: '#f8fafc',
            borderColor: '#cbd5e1',
            color: '#0f172a',
          },
          ...sx,
        }}
      >
        {isRefreshing ? 'Refreshing...' : 'Refresh'}
      </Button>
    );
  }

  // Auto variant (Icon on mobile, Button on sm+)
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
      {/* Mobile view: Icon button */}
      <Tooltip title={isRefreshing ? 'Refreshing...' : 'Refresh dashboard data'} arrow>
        <span>
          <IconButton
            size="small"
            onClick={handleRefresh}
            disabled={isRefreshing}
            sx={{
              display: { xs: 'inline-flex', sm: 'none' },
              p: 0.85,
              bgcolor: '#f8fafc',
              color: '#475569',
              border: '1px solid #e2e8f0',
              borderRadius: 2,
              '&:hover': {
                bgcolor: '#f1f5f9',
                color: '#0f172a',
              },
              ...sx,
            }}
          >
            {refreshIcon}
          </IconButton>
        </span>
      </Tooltip>

      {/* Desktop view: Button with label */}
      <Button
        variant="outlined"
        size="small"
        onClick={handleRefresh}
        disabled={isRefreshing}
        startIcon={refreshIcon}
        sx={{
          display: { xs: 'none', sm: 'inline-flex' },
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.825rem',
          borderRadius: 2,
          borderColor: '#e2e8f0',
          color: '#475569',
          bgcolor: '#ffffff',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          px: 1.75,
          py: 0.55,
          '&:hover': {
            bgcolor: '#f8fafc',
            borderColor: '#cbd5e1',
            color: '#0f172a',
          },
          ...sx,
        }}
      >
        {isRefreshing ? 'Refreshing...' : 'Refresh'}
      </Button>
    </Box>
  );
};

export default DashboardRefreshButton;
