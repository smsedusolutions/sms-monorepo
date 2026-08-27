import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import SendIcon from '@mui/icons-material/Send';
import DevicesIcon from '@mui/icons-material/Devices';
import { useBroadcastNotification } from '../../queries/Notification';
import TokenService from '../../queries/token/tokenService';

interface BroadcastNotificationDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BroadcastNotificationDialog: React.FC<BroadcastNotificationDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const schoolId = TokenService.getSchoolId() || '';
  const broadcastMutation = useBroadcastNotification(schoolId);

  const [title, setTitle] = useState('📢 School Alert: Important Update');
  const [message, setMessage] = useState('This is a real-time alert sent to all registered devices.');
  const [targetAudience, setTargetAudience] = useState<'all' | 'parents' | 'teachers' | 'students'>('all');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      setFeedback({ type: 'error', text: 'Title and message cannot be empty.' });
      return;
    }

    setFeedback(null);
    try {
      const res: any = await broadcastMutation.mutateAsync({
        title,
        message,
        targetAudience,
      });

      setFeedback({
        type: 'success',
        text: res?.message || 'Notification broadcast successfully dispatched to all devices!',
      });

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
        setFeedback(null);
      }, 1500);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Failed to dispatch broadcast notification.',
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3, p: 0.5 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <Box
          sx={{
            bgcolor: 'primary.main',
            color: '#fff',
            p: 1,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CampaignIcon sx={{ fontSize: 24 }} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>
            Broadcast to All Devices
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Send an instant push & in-app notification across Android, iOS & desktop
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {feedback && (
          <Alert severity={feedback.type} sx={{ borderRadius: 2 }}>
            {feedback.text}
          </Alert>
        )}

        <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <DevicesIcon color="success" />
          <Typography variant="body2" color="success.dark" fontWeight={600} sx={{ fontSize: '0.825rem' }}>
            This will trigger real-time Web Push alerts to all online and offline mobile devices, plus in-app notifications.
          </Typography>
        </Paper>

        <FormControl fullWidth size="small">
          <InputLabel id="target-audience-label">Target Audience</InputLabel>
          <Select
            labelId="target-audience-label"
            value={targetAudience}
            label="Target Audience"
            onChange={(e) => setTargetAudience(e.target.value as any)}
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="all">🌐 All Users (Parents, Teachers, Students)</MenuItem>
            <MenuItem value="parents">👨‍👩‍👧 Parents Only</MenuItem>
            <MenuItem value="teachers">👨‍🏫 Teachers Only</MenuItem>
            <MenuItem value="students">🎓 Students Only</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Notification Title"
          fullWidth
          size="small"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., School Alert / Holiday Announcement"
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />

        <TextField
          label="Notification Message"
          fullWidth
          multiline
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter message details that will appear on mobile lock screens..."
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.5, gap: 1 }}>
        <Button onClick={onClose} disabled={broadcastMutation.isPending} sx={{ fontWeight: 700, textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={broadcastMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
          onClick={handleSend}
          disabled={broadcastMutation.isPending}
          sx={{
            borderRadius: 2,
            fontWeight: 800,
            textTransform: 'none',
            px: 3,
            boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
          }}
        >
          {broadcastMutation.isPending ? 'Broadcasting...' : 'Send Broadcast Alert'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BroadcastNotificationDialog;
