import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Chip,
  IconButton,
  alpha,
} from '@mui/material';
import {
  WarningAmber as WarningIcon,
  ErrorOutline as ErrorIcon,
  InfoOutlined as InfoIcon,
  CheckCircleOutline as SuccessIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { AppButton } from './AppButton';

export interface AppNoticeDialogProps {
  open: boolean;
  onClose: () => void;
  type?: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  badgeText?: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export const AppNoticeDialog: React.FC<AppNoticeDialogProps> = ({
  open,
  onClose,
  type = 'warning',
  title,
  message,
  badgeText,
  primaryActionLabel = 'Understood',
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  const configMap = {
    warning: {
      color: '#f59e0b',
      bgLight: '#fffbeeb0',
      icon: <WarningIcon sx={{ fontSize: 36, color: '#d97706' }} />,
      chipColor: 'warning' as const,
    },
    error: {
      color: '#ef4444',
      bgLight: '#fef2f2b0',
      icon: <ErrorIcon sx={{ fontSize: 36, color: '#dc2626' }} />,
      chipColor: 'error' as const,
    },
    info: {
      color: '#3b82f6',
      bgLight: '#eff6ffb0',
      icon: <InfoIcon sx={{ fontSize: 36, color: '#2563eb' }} />,
      chipColor: 'info' as const,
    },
    success: {
      color: '#10b981',
      bgLight: '#ecfdf5b0',
      icon: <SuccessIcon sx={{ fontSize: 36, color: '#059669' }} />,
      chipColor: 'success' as const,
    },
  };

  const config = configMap[type];

  const handlePrimary = () => {
    if (onPrimaryAction) {
      onPrimaryAction();
    } else {
      onClose();
    }
  };

  const handleSecondary = () => {
    if (onSecondaryAction) {
      onSecondaryAction();
    } else {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          p: 1,
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
        },
      }}
    >
      <Box sx={{ position: 'absolute', right: 12, top: 12 }}>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ textAlign: 'center', pt: 3, pb: 1, px: 3 }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            bgcolor: config.bgLight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
            border: `2px solid ${alpha(config.color, 0.25)}`,
          }}
        >
          {config.icon}
        </Box>

        <Typography variant="h6" fontWeight={700} sx={{ color: '#0f172a', mb: 1 }}>
          {title}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
          {message}
        </Typography>

        {badgeText && (
          <Chip
            label={badgeText}
            size="small"
            color={config.chipColor}
            variant="outlined"
            sx={{ fontWeight: 700, fontSize: '0.75rem', px: 1, py: 1.5, height: 'auto', borderRadius: 2 }}
          />
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, justifyContent: 'center', gap: 1 }}>
        {secondaryActionLabel && (
          <AppButton variant="outlined" color="inherit" fullWidth onClick={handleSecondary} sx={{ borderRadius: 2.5, py: 1.2 }}>
            {secondaryActionLabel}
          </AppButton>
        )}
        <AppButton
          variant="contained"
          fullWidth
          onClick={handlePrimary}
          sx={{
            borderRadius: 2.5,
            py: 1.2,
            bgcolor: config.color,
            '&:hover': { bgcolor: alpha(config.color, 0.9) },
          }}
        >
          {primaryActionLabel}
        </AppButton>
      </DialogActions>
    </Dialog>
  );
};

export default AppNoticeDialog;
