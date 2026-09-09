import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { AppButton } from '../../components/shared/AppButton';

interface LogoutConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LogoutConfirmDialog: React.FC<LogoutConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { borderRadius: 3, p: 1, maxWidth: 360 } }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Confirm Logout</DialogTitle>
      <DialogContent>
        <DialogContentText variant="body2" color="text.secondary">
          Are you sure you want to sign out of your account?
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 1.5, gap: 1 }}>
        <AppButton variant="outlined" color="inherit" onClick={onClose}>
          Cancel
        </AppButton>
        <AppButton variant="contained" color="error" onClick={onConfirm}>
          Logout
        </AppButton>
      </DialogActions>
    </Dialog>
  );
};

export default LogoutConfirmDialog;
