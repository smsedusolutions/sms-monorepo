import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  MenuItem,
} from '@mui/material';
import {
  Close as CloseIcon,
  Phone,
  CheckCircle,
  WhatsApp,
  Send,
} from '@mui/icons-material';
import type { DemoFormData } from '../types';
import { useLandingTheme } from '../context/LandingThemeContext';

interface QuickDemoModalProps {
  open: boolean;
  onClose: () => void;
}

export const QuickDemoModal: React.FC<QuickDemoModalProps> = ({ open, onClose }) => {
  const { isDark } = useLandingTheme();
  const [formData, setFormData] = useState<DemoFormData>({
    schoolName: '',
    contactPerson: '',
    phoneNumber: '',
    email: '',
    studentStrength: '500-1000',
    message: '',
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate instantaneous booking confirmation
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setFormData({
      schoolName: '',
      contactPerson: '',
      phoneNumber: '',
      email: '',
      studentStrength: '500-1000',
      message: '',
    });
    onClose();
  };

  const handleWhatsAppDirect = () => {
    const text = encodeURIComponent(
      `Hello SMS Edu Solutions Team! I am interested in a live demo for our school: ${formData.schoolName || 'Our Institution'}. Please connect with me.`
    );
    window.open(`https://wa.me/916361888927?text=${text}`, '_blank');
  };

  const inputStyle = {
    '& .MuiOutlinedInput-root': {
      bgcolor: isDark ? '#1E293B' : '#FFFFFF',
      color: isDark ? '#F8FAFC' : '#0F172A',
      '& fieldset': {
        borderColor: isDark ? '#334155' : '#CBD5E1',
      },
      '&:hover fieldset': {
        borderColor: isDark ? '#64748B' : '#94A3B8',
      },
      '&.Mui-focused fieldset': {
        borderColor: isDark ? '#38BDF8' : '#0284C7',
      },
    },
    '& .MuiInputLabel-root': {
      color: isDark ? '#94A3B8' : '#64748B',
      '&.Mui-focused': {
        color: isDark ? '#38BDF8' : '#0284C7',
      },
    },
  };

  return (
    <Dialog
      open={open}
      onClose={handleReset}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          p: { xs: 1.5, sm: 2.5 },
          bgcolor: isDark ? '#0F172A' : '#FFFFFF',
          border: isDark ? '1px solid #1E293B' : '1px solid #E2E8F0',
          boxShadow: isDark
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 1 }}>
        <Typography sx={{ fontWeight: 900, fontSize: '1.4rem', color: isDark ? '#F8FAFC' : '#0F172A' }}>
          Schedule a Live Demo
        </Typography>
        <IconButton onClick={handleReset} sx={{ color: isDark ? '#94A3B8' : '#64748B' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ pt: 2 }}>
        {isSubmitted ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Box
              sx={{
                width: 70,
                height: 70,
                borderRadius: '50%',
                bgcolor: 'rgba(16, 185, 129, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2.5,
              }}
            >
              <CheckCircle sx={{ fontSize: 44, color: '#10B981' }} />
            </Box>
            <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: isDark ? '#F8FAFC' : '#0F172A', mb: 1 }}>
              Demo Request Received!
            </Typography>
            <Typography sx={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: '0.95rem', maxWidth: 420, mx: 'auto', mb: 3 }}>
              Thank you, <strong>{formData.contactPerson || 'Educator'}</strong>. Our product specialist
              will call you on <strong>{formData.phoneNumber}</strong> within 2 business hours.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                onClick={handleWhatsAppDirect}
                startIcon={<WhatsApp />}
                sx={{
                  bgcolor: '#25D366',
                  color: 'white',
                  fontWeight: 700,
                  borderRadius: '6px',
                  px: 3,
                  py: 1,
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#20BA5A' },
                }}
              >
                Chat on WhatsApp Now
              </Button>
              <Button
                variant="outlined"
                onClick={handleReset}
                sx={{
                  borderRadius: '6px',
                  px: 3,
                  textTransform: 'none',
                  fontWeight: 700,
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                  color: isDark ? '#F8FAFC' : '#0F172A',
                }}
              >
                Close
              </Button>
            </Box>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography sx={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: '0.9rem', mb: 0.5 }}>
              See SMS EDU SOLUTIONS in action. Tailored to your school’s curriculum, fee structures, and attendance requirements.
            </Typography>

            <TextField
              label="School / College Name"
              required
              fullWidth
              size="small"
              value={formData.schoolName}
              onChange={(e) => setFormData((p) => ({ ...p, schoolName: e.target.value }))}
              sx={inputStyle}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Your Name / Designation"
                required
                fullWidth
                size="small"
                value={formData.contactPerson}
                onChange={(e) => setFormData((p) => ({ ...p, contactPerson: e.target.value }))}
                sx={inputStyle}
              />
              <TextField
                label="Phone Number"
                required
                fullWidth
                size="small"
                placeholder="+91 98765 43210"
                value={formData.phoneNumber}
                onChange={(e) => setFormData((p) => ({ ...p, phoneNumber: e.target.value }))}
                sx={inputStyle}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1.2fr 1fr' }, gap: 2 }}>
              <TextField
                label="Official Email Address"
                type="email"
                required
                fullWidth
                size="small"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                sx={inputStyle}
              />
              <TextField
                select
                label="Student Strength"
                fullWidth
                size="small"
                value={formData.studentStrength}
                onChange={(e) => setFormData((p) => ({ ...p, studentStrength: e.target.value }))}
                sx={inputStyle}
              >
                <MenuItem value="Under 500">Under 500</MenuItem>
                <MenuItem value="500-1000">500 - 1,000</MenuItem>
                <MenuItem value="1000-2500">1,000 - 2,500</MenuItem>
                <MenuItem value="2500+">2,500+ Students</MenuItem>
              </TextField>
            </Box>

            <TextField
              label="Any specific requirements or queries? (Optional)"
              multiline
              rows={2}
              fullWidth
              size="small"
              value={formData.message}
              onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
              sx={inputStyle}
            />

            {/* Direct Contact Bar */}
            <Box
              sx={{
                p: 1.5,
                borderRadius: '8px',
                bgcolor: isDark ? '#1E293B' : '#F8FAFC',
                border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone sx={{ fontSize: 18, color: '#0284C7' }} />
                <Typography sx={{ fontSize: '0.8rem', color: isDark ? '#CBD5E1' : '#334155', fontWeight: 600 }}>
                  Need urgent assistance?
                </Typography>
              </Box>
              <Typography
                component="a"
                href="tel:+916361888927"
                sx={{
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  color: isDark ? '#38BDF8' : '#0284C7',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                +91 6361888927
              </Typography>
            </Box>

            <Button
              type="submit"
              variant="contained"
              size="large"
              endIcon={<Send />}
              sx={{
                bgcolor: isDark ? '#0284C7' : '#0F172A',
                color: '#FFFFFF',
                fontWeight: 800,
                borderRadius: '6px',
                py: 1.3,
                fontSize: '1rem',
                textTransform: 'none',
                boxShadow: 'none',
                mt: 1,
                '&:hover': {
                  bgcolor: isDark ? '#0369A1' : '#1E293B',
                  boxShadow: 'none',
                },
              }}
            >
              Confirm Live Demo
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
