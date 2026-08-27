import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Divider,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import SendIcon from '@mui/icons-material/Send';
import SyncIcon from '@mui/icons-material/Sync';
import BugReportIcon from '@mui/icons-material/BugReport';
import {
  getPushDiagnosticInfo,
  sendTestPushNotification,
  subscribeToPush,
} from '../../services/pushNotification';
import TokenService from '../../queries/token/tokenService';

interface PushDiagnosticsDialogProps {
  open: boolean;
  onClose: () => void;
}

export const PushDiagnosticsDialog: React.FC<PushDiagnosticsDialogProps> = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const [diagInfo, setDiagInfo] = useState<any>(null);

  const loadDiagnostics = async () => {
    setLoading(true);
    setTestResult(null);
    try {
      const info = await getPushDiagnosticInfo();
      setDiagInfo(info);
    } catch (err: any) {
      console.error('Failed to load push diagnostics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadDiagnostics();
    }
  }, [open]);

  const handleSendTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await sendTestPushNotification();
      setTestResult(res);
      await loadDiagnostics();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Failed to dispatch test notification',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleResubscribe = async () => {
    setLoading(true);
    setTestResult(null);
    try {
      const schoolId = TokenService.getSchoolId() || undefined;
      const ok = await subscribeToPush(schoolId);
      if (ok) {
        setTestResult({
          success: true,
          message: 'Device push subscription registered successfully with server!',
        });
      } else {
        setTestResult({
          success: false,
          message: 'Could not register push subscription. Check browser notification permissions.',
        });
      }
      await loadDiagnostics();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Error subscribing',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3, p: 0.5 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <BugReportIcon color="primary" />
        <Typography variant="h6" fontWeight={700}>
          Push Notification Status
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2 }}>
        {loading && !diagInfo ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={32} />
          </Box>
        ) : diagInfo ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {/* Status rows */}
            <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" fontWeight={600} color="text.secondary">
                  Web Push Support
                </Typography>
                <Chip
                  size="small"
                  icon={diagInfo.isSupported ? <CheckCircleIcon /> : <ErrorIcon />}
                  label={diagInfo.isSupported ? 'Supported' : 'Unsupported'}
                  color={diagInfo.isSupported ? 'success' : 'error'}
                  sx={{ height: 24, fontSize: '0.75rem', fontWeight: 700 }}
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" fontWeight={600} color="text.secondary">
                  Browser Permission
                </Typography>
                <Chip
                  size="small"
                  icon={diagInfo.permission === 'granted' ? <CheckCircleIcon /> : <WarningIcon />}
                  label={diagInfo.permission.toUpperCase()}
                  color={diagInfo.permission === 'granted' ? 'success' : diagInfo.permission === 'denied' ? 'error' : 'warning'}
                  sx={{ height: 24, fontSize: '0.75rem', fontWeight: 700 }}
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" fontWeight={600} color="text.secondary">
                  Service Worker (sw.js)
                </Typography>
                <Chip
                  size="small"
                  icon={diagInfo.serviceWorkerActive ? <CheckCircleIcon /> : <WarningIcon />}
                  label={diagInfo.serviceWorkerActive ? 'Active' : 'Not Active'}
                  color={diagInfo.serviceWorkerActive ? 'success' : 'warning'}
                  sx={{ height: 24, fontSize: '0.75rem', fontWeight: 700 }}
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" fontWeight={600} color="text.secondary">
                  Device Push Endpoint
                </Typography>
                <Chip
                  size="small"
                  icon={diagInfo.hasBrowserPushSubscription ? <CheckCircleIcon /> : <WarningIcon />}
                  label={diagInfo.hasBrowserPushSubscription ? 'Registered' : 'Not Registered'}
                  color={diagInfo.hasBrowserPushSubscription ? 'success' : 'default'}
                  sx={{ height: 24, fontSize: '0.75rem', fontWeight: 700 }}
                />
              </Box>
            </Paper>

            {/* Account & Server details */}
            <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                <strong>Logged-in User ID:</strong> {diagInfo.userId} ({diagInfo.userRole})
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                <strong>Notification API:</strong> {diagInfo.notificationApiUrl}
              </Typography>
            </Paper>

            {/* Test result message */}
            {testResult && (
              <Alert severity={testResult.success ? 'success' : 'error'} sx={{ borderRadius: 2, fontSize: '0.8rem' }}>
                {testResult.message}
              </Alert>
            )}

            <Divider sx={{ my: 0.5 }} />

            {/* Quick Actions */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                startIcon={testing ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                onClick={handleSendTest}
                disabled={testing || loading}
                sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
              >
                {testing ? 'Sending Test Push...' : 'Send Test Notification to this Device'}
              </Button>

              <Button
                variant="outlined"
                color="primary"
                fullWidth
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
                onClick={handleResubscribe}
                disabled={loading || testing}
                sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
              >
                Sync / Re-register Push Subscription
              </Button>
            </Box>
          </Box>
        ) : (
          <Alert severity="warning">Could not read diagnostics.</Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={onClose} sx={{ fontWeight: 700, textTransform: 'none' }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PushDiagnosticsDialog;
