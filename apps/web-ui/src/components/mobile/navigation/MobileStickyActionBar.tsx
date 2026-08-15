import React from 'react';
import { Box, Button, CircularProgress } from '@mui/material';

export interface MobileStickyActionBarProps {
  primaryLabel: string;
  onPrimaryClick: () => void;
  primaryIcon?: React.ReactNode;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  secondaryLabel?: string;
  onSecondaryClick?: () => void;
  secondaryDisabled?: boolean;
  secondaryVariant?: 'outlined' | 'text';
  aboveBottomNav?: boolean;
  children?: React.ReactNode;
}

export const MobileStickyActionBar: React.FC<MobileStickyActionBarProps> = ({
  primaryLabel,
  onPrimaryClick,
  primaryIcon,
  primaryDisabled = false,
  primaryLoading = false,
  secondaryLabel,
  onSecondaryClick,
  secondaryDisabled = false,
  secondaryVariant = 'outlined',
  aboveBottomNav = true,
  children,
}) => {
  return (
    <Box
      className="mobile-glass-nav"
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: aboveBottomNav
          ? 'calc(var(--mobile-bottom-nav-height) + var(--safe-area-bottom))'
          : 0,
        pb: aboveBottomNav ? 1.5 : 'calc(var(--safe-area-bottom) + 12px)',
        pt: 1.5,
        px: 2,
        zIndex: 38,
        boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      {children}

      <Box sx={{ display: 'flex', gap: 1.5, width: '100%' }}>
        {secondaryLabel && (
          <Button
            onClick={onSecondaryClick}
            disabled={secondaryDisabled || primaryLoading}
            variant={secondaryVariant}
            sx={{
              flex: 1,
              py: 1.4,
              borderRadius: '14px',
              fontWeight: 700,
              fontSize: '0.92rem',
              textTransform: 'none',
              borderColor: '#cbd5e1',
              color: '#475569',
              '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' },
            }}
          >
            {secondaryLabel}
          </Button>
        )}

        <Button
          onClick={onPrimaryClick}
          disabled={primaryDisabled || primaryLoading}
          variant="contained"
          sx={{
            flex: secondaryLabel ? 2 : 1,
            py: 1.4,
            borderRadius: '14px',
            fontWeight: 700,
            fontSize: '0.92rem',
            textTransform: 'none',
            bgcolor: '#4f46e5',
            color: '#ffffff',
            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
            '&:hover, &:active': { bgcolor: '#4338ca' },
            '&.Mui-disabled': { bgcolor: '#e2e8f0', color: '#94a3b8' },
          }}
          startIcon={
            primaryLoading ? (
              <CircularProgress size={18} sx={{ color: '#ffffff' }} />
            ) : (
              primaryIcon
            )
          }
        >
          {primaryLoading ? 'Processing...' : primaryLabel}
        </Button>
      </Box>
    </Box>
  );
};

export default MobileStickyActionBar;
