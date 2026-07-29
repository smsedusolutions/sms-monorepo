import React from 'react';
import { Breadcrumbs, Typography, Box, Chip } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';
import { useNavigate } from 'react-router-dom';
import { useBreadcrumbs } from '../../hooks/useBreadcrumbs';

interface AppBreadcrumbsProps {
  /** Optional custom title override for header section */
  showPageHeader?: boolean;
}

export const AppBreadcrumbs: React.FC<AppBreadcrumbsProps> = () => {
  const { items, isDashboard } = useBreadcrumbs();
  const navigate = useNavigate();

  // If on Dashboard, optionally show simple indicator or full breadcrumb
  if (items.length === 0) return null;

  return (
    <Box
      sx={{
        mb: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1,
      }}
    >
      <Breadcrumbs
        separator={<NavigateNextIcon sx={{ fontSize: '1rem', color: '#94a3b8' }} />}
        aria-label="breadcrumb"
        sx={{
          '& .MuiBreadcrumbs-ol': {
            flexWrap: 'wrap',
            alignItems: 'center',
          },
        }}
      >
        {items.map((item, index) => {
          const isFirst = index === 0;
          const isCurrent = item.isCurrent;

          if (isCurrent) {
            return (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.6,
                }}
              >
                {isFirst && <HomeIcon sx={{ fontSize: '1.1rem', color: '#3b82f6' }} />}
                <Typography
                  variant="body2"
                  sx={{
                    color: '#1e293b',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
            );
          }

          return (
            <Box
              key={index}
              onClick={() => item.path && navigate(item.path)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.6,
                cursor: item.path ? 'pointer' : 'default',
                color: '#64748b',
                fontSize: '0.875rem',
                fontWeight: 500,
                borderRadius: '6px',
                px: 0.8,
                py: 0.3,
                ml: isFirst ? -0.8 : 0,
                transition: 'all 0.2s ease',
                '&:hover': item.path
                  ? {
                      color: '#3b82f6',
                      backgroundColor: 'rgba(59, 130, 246, 0.08)',
                    }
                  : {},
              }}
            >
              {isFirst && <HomeIcon sx={{ fontSize: '1.1rem', color: 'inherit' }} />}
              <Typography
                variant="body2"
                sx={{
                  color: 'inherit',
                  fontWeight: 'inherit',
                  fontSize: 'inherit',
                }}
              >
                {item.label}
              </Typography>
            </Box>
          );
        })}
      </Breadcrumbs>

      {!isDashboard && (
        <Chip
          label="Back to Dashboard"
          icon={<HomeIcon sx={{ fontSize: '1rem !important' }} />}
          size="small"
          onClick={() => navigate(items[0]?.path || '/')}
          sx={{
            cursor: 'pointer',
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            fontWeight: 600,
            fontSize: '0.75rem',
            border: '1px solid #bfdbfe',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: '#dbeafe',
              borderColor: '#93c5fd',
              transform: 'translateY(-1px)',
            },
          }}
        />
      )}
    </Box>
  );
};

export default AppBreadcrumbs;
