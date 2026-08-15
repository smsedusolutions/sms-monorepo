import React from 'react';
import { Drawer, Box, Typography, Button, Divider } from '@mui/material';

export interface ActionSheetOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  isDestructive?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export interface MobileActionSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  actions: ActionSheetOption[];
  cancelLabel?: string;
}

export const MobileActionSheet: React.FC<MobileActionSheetProps> = ({
  open,
  onClose,
  title,
  subtitle,
  actions,
  cancelLabel = 'Cancel',
}) => {
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          bgcolor: 'transparent',
          boxShadow: 'none',
          px: 2,
          pb: 'calc(var(--safe-area-bottom) + 16px)',
        },
      }}
    >
      {/* Main Options Card */}
      <Box
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          mb: 1.5,
        }}
      >
        {(title || subtitle) && (
          <Box sx={{ py: 2, px: 2, textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>
            {title && (
              <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mt: 0.3 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        )}

        {actions.map((action, index) => (
          <React.Fragment key={action.id}>
            <button
              disabled={action.disabled}
              onClick={() => {
                onClose();
                action.onClick();
              }}
              className="touch-active w-full flex items-center justify-center gap-2.5 py-3.5 px-4 text-center cursor-pointer outline-none border-none bg-transparent disabled:opacity-40"
              style={{
                color: action.isDestructive ? '#ef4444' : '#0f172a',
                fontWeight: 600,
                fontSize: '0.95rem',
              }}
            >
              {action.icon && <span className="flex items-center">{action.icon}</span>}
              <span>{action.label}</span>
            </button>
            {index < actions.length - 1 && <Divider sx={{ borderColor: '#f1f5f9' }} />}
          </React.Fragment>
        ))}
      </Box>

      {/* Cancel Button Card */}
      <Button
        fullWidth
        onClick={onClose}
        sx={{
          bgcolor: '#ffffff',
          color: '#4f46e5',
          fontWeight: 700,
          fontSize: '0.95rem',
          py: 1.6,
          borderRadius: '16px',
          textTransform: 'none',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e2e8f0',
          '&:active': { transform: 'scale(0.98)', bgcolor: '#f8fafc' },
        }}
      >
        {cancelLabel}
      </Button>
    </Drawer>
  );
};

export default MobileActionSheet;
