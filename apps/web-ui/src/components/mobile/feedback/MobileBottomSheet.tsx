import React from 'react';
import { Drawer, Box, Typography, IconButton } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

export interface MobileBottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: string | number;
  hideCloseButton?: boolean;
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxHeight = '90dvh',
  hideCloseButton = false,
}) => {
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          maxHeight,
          bgcolor: '#ffffff',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          pb: 'calc(var(--safe-area-bottom) + 16px)',
          boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.12)',
        },
      }}
    >
      {/* Drag handle */}
      <Box sx={{ pt: 1.5, pb: 0.5, display: 'flex', justifyContent: 'center' }}>
        <Box
          sx={{
            width: 42,
            height: 5,
            borderRadius: 3,
            bgcolor: '#cbd5e1',
          }}
        />
      </Box>

      {/* Header */}
      {(title || !hideCloseButton) && (
        <Box
          sx={{
            px: 2.5,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <Box sx={{ flex: 1, pr: 1 }}>
            {typeof title === 'string' ? (
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: '1.15rem',
                  color: '#0f172a',
                  fontFamily: '"Outfit", sans-serif',
                  letterSpacing: '-0.01em',
                }}
              >
                {title}
              </Typography>
            ) : (
              title
            )}
            {subtitle && (
              <Typography sx={{ fontSize: '0.78rem', color: '#64748b', mt: 0.2 }}>
                {subtitle}
              </Typography>
            )}
          </Box>

          {!hideCloseButton && (
            <IconButton
              onClick={onClose}
              size="small"
              sx={{
                bgcolor: '#f1f5f9',
                color: '#64748b',
                p: 0.8,
                borderRadius: '50%',
                '&:active': { transform: 'scale(0.92)' },
              }}
            >
              <CloseRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          )}
        </Box>
      )}

      {/* Scrollable Body */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 2.5,
          py: 2,
          overscrollBehaviorY: 'contain',
        }}
      >
        {children}
      </Box>

      {/* Optional Footer */}
      {footer && (
        <Box
          sx={{
            px: 2.5,
            pt: 1.5,
            pb: 0.5,
            borderTop: '1px solid #f1f5f9',
            bgcolor: '#ffffff',
          }}
        >
          {footer}
        </Box>
      )}
    </Drawer>
  );
};

export default MobileBottomSheet;
