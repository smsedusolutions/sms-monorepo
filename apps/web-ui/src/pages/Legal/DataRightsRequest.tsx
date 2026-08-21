/**
 * Data Rights Request Form — SMS Edu Solutions
 *
 * Simple, user-friendly form allowing students, parents, and teachers to exercise
 * their legal rights under India's Digital Personal Data Protection Act, 2023 (DPDP Act).
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  Send,
  CheckCircleOutline,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import LegalFooter from '../../components/shared/LegalFooter';

interface FormData {
  fullName: string;
  email: string;
  role: string;
  schoolName: string;
  requestType: string;
  details: string;
  declaration: boolean;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  role?: string;
  requestType?: string;
  details?: string;
  declaration?: string;
}

const GRIEVANCE_EMAIL = 'grievance@smsedusolutions.com';

const DataRightsRequest: React.FC = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState<FormData>({
    fullName: '',
    email: '',
    role: '',
    schoolName: '',
    requestType: '',
    details: '',
    declaration: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.fullName.trim()) e.fullName = 'Please enter your full name';
    if (!form.email.trim()) e.email = 'Please enter your email address';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Please enter a valid email address';
    if (!form.role) e.role = 'Please select your role';
    if (!form.requestType) e.requestType = 'Please select the type of DPDP Act request';
    if (!form.details.trim()) e.details = 'Please describe your request in simple words';
    else if (form.details.trim().length < 15) e.details = 'Please provide a bit more detail (at least 15 characters)';
    if (!form.declaration) e.declaration = 'Please check the box to confirm this information is correct';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { value: unknown }>
  ) => {
    setForm((p) => ({ ...p, [field]: (e.target as HTMLInputElement).value }));
    if (errors[field as keyof FormErrors]) setErrors((p) => ({ ...p, [field]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);

    // Compose simple mailto link for direct dispatch to grievance officer
    const subject = encodeURIComponent(`DPDP Act Request: ${form.requestType} - ${form.fullName}`);
    const body = encodeURIComponent(
      `DPDP ACT (INDIA) DATA RIGHTS REQUEST\n` +
      `-----------------------------------------\n` +
      `Request Type : ${form.requestType}\n` +
      `Full Name    : ${form.fullName}\n` +
      `Email        : ${form.email}\n` +
      `Role         : ${form.role}\n` +
      `School       : ${form.schoolName || 'Not specified'}\n` +
      `Date         : ${new Date().toLocaleDateString('en-IN')}\n\n` +
      `Details of Request:\n${form.details}\n\n` +
      `Declaration: The applicant confirms they are the Data Principal or legal guardian under the DPDP Act.`
    );

    window.location.href = `mailto:${GRIEVANCE_EMAIL}?subject=${subject}&body=${body}`;

    setTimeout(() => {
      setIsLoading(false);
      setSubmitted(true);
    }, 600);
  };

  const requestOptions = [
    {
      value: 'Access Data (DPDP Act §11)',
      label: '1. See My Data (DPDP Act §11) — I want a copy/summary of personal data held about me.',
    },
    {
      value: 'Correct Data (DPDP Act §12)',
      label: '2. Fix Mistakes in My Data (DPDP Act §12) — I want to update or correct inaccurate details.',
    },
    {
      value: 'Erase Data (DPDP Act §12)',
      label: '3. Delete My Data (DPDP Act §12) — I want my personal data deleted as I no longer use this school service.',
    },
    {
      value: 'Withdraw Consent (DPDP Act §6)',
      label: '4. Stop Optional Processing (DPDP Act §6) — I want to withdraw consent for non-essential features.',
    },
    {
      value: 'Grievance / Complaint (DPDP Act §13)',
      label: '5. DPDP Act Complaint (DPDP Act §13) — I have a grievance regarding how my personal data was handled.',
    },
    {
      value: 'Register Nominee (DPDP Act §14)',
      label: '6. Register a Nominee (DPDP Act §14) — I want to appoint a trusted person to manage my DPDP Act data rights.',
    },
  ];

  if (submitted) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          width: '100%',
          bgcolor: '#f8fafc',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            maxWidth: 540,
            width: '100%',
            p: { xs: 3, sm: 5 },
            bgcolor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <CheckCircle sx={{ color: '#16a34a', fontSize: 56, mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
            DPDP Act Request Submitted
          </Typography>
          <Typography sx={{ fontSize: '0.92rem', color: '#475569', lineHeight: 1.6, mb: 3 }}>
            Your request under the <strong>Digital Personal Data Protection Act (DPDP Act)</strong> has been sent to our Grievance Officer at <strong>{GRIEVANCE_EMAIL}</strong>.
          </Typography>
          <Box sx={{ p: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', mb: 3, textAlign: 'left' }}>
            <Typography sx={{ fontSize: '0.85rem', color: '#166534', fontWeight: 600, mb: 0.5 }}>
              What happens next under the DPDP Act?
            </Typography>
            <Typography sx={{ fontSize: '0.82rem', color: '#15803d', lineHeight: 1.5 }}>
              • We will acknowledge your request within <strong>7 days</strong>.<br />
              • We will complete and resolve your request within <strong>30 days</strong> as required by the DPDP Act (India).
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => navigate('/login')}
            sx={{
              bgcolor: '#4f46e5',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              py: 1,
              borderRadius: '6px',
              '&:hover': { bgcolor: '#4338ca' },
            }}
          >
            Return to Login
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        bgcolor: '#f8fafc',
        color: '#1e293b',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Simple Navigation Header */}
      <Box
        sx={{
          bgcolor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          py: 2,
          px: { xs: 2, md: 4 },
        }}
      >
        <Container maxWidth="md" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            variant="text"
            sx={{ color: '#475569', textTransform: 'none', fontWeight: 600, fontSize: '0.9rem' }}
          >
            Back
          </Button>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>
            DPDP Act Self-Service Portal
          </Typography>
        </Container>
      </Box>

      {/* Main Content Area */}
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 }, flex: 1 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 4, md: 5 },
            bgcolor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
          }}
        >
          {/* Header */}
          <Box sx={{ mb: 3.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', sm: '1.9rem' }, color: '#0f172a', mb: 1 }}>
              Data Rights Request Form (DPDP Act, 2023)
            </Typography>
            <Typography sx={{ fontSize: '0.9rem', color: '#64748b', mb: 2 }}>
              Exercise your legal rights under India's Digital Personal Data Protection Act (DPDP Act)
            </Typography>
            <Box
              sx={{
                bgcolor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                p: 2,
                borderRadius: '6px',
              }}
            >
              <Typography sx={{ fontSize: '0.88rem', color: '#166534', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleOutline sx={{ fontSize: 18 }} />
                Your Rights Under the DPDP Act
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#15803d', mt: 0.5, lineHeight: 1.5 }}>
                Under the <strong>DPDP Act (Sections 11–14)</strong>, you have the right to request a copy of your personal data, fix mistakes, ask for deletion, withdraw consent, or submit a complaint. All DPDP Act requests are resolved within <strong>30 days</strong>.
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a', mb: 2 }}>
              1. Your Contact Information
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
              <TextField
                label="Your Full Name *"
                value={form.fullName}
                onChange={handleChange('fullName')}
                error={!!errors.fullName}
                helperText={errors.fullName}
                fullWidth
                size="small"
              />
              <TextField
                label="Your Email Address *"
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                error={!!errors.email}
                helperText={errors.email}
                fullWidth
                size="small"
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 4 }}>
              <FormControl fullWidth size="small" error={!!errors.role}>
                <InputLabel>Your Role *</InputLabel>
                <Select
                  value={form.role}
                  label="Your Role *"
                  onChange={(e) => {
                    setForm((p) => ({ ...p, role: e.target.value }));
                    setErrors((p) => ({ ...p, role: undefined }));
                  }}
                >
                  <MenuItem value="Parent / Guardian">Parent / Guardian</MenuItem>
                  <MenuItem value="Student">Student</MenuItem>
                  <MenuItem value="Teacher / Staff">Teacher / Staff</MenuItem>
                  <MenuItem value="School Administrator">School Administrator</MenuItem>
                  <MenuItem value="Driver / Transport Staff">Driver / Transport Staff</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
                {errors.role && <FormHelperText>{errors.role}</FormHelperText>}
              </FormControl>

              <TextField
                label="School Name (Optional)"
                value={form.schoolName}
                onChange={handleChange('schoolName')}
                fullWidth
                size="small"
              />
            </Box>

            <Divider sx={{ mb: 4 }} />

            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a', mb: 2 }}>
              2. Select Your DPDP Act Request Type
            </Typography>

            <FormControl component="fieldset" error={!!errors.requestType} sx={{ mb: 3, width: '100%' }}>
              <FormLabel component="legend" sx={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155', mb: 1 }}>
                Which right would you like to exercise under the DPDP Act? *
              </FormLabel>
              <RadioGroup
                value={form.requestType}
                onChange={(e) => {
                  setForm((p) => ({ ...p, requestType: e.target.value }));
                  setErrors((p) => ({ ...p, requestType: undefined }));
                }}
              >
                {requestOptions.map((opt) => (
                  <FormControlLabel
                    key={opt.value}
                    value={opt.value}
                    control={<Radio size="small" sx={{ '&.Mui-checked': { color: '#4f46e5' } }} />}
                    label={<Typography sx={{ fontSize: '0.88rem', color: '#334155', py: 0.25 }}>{opt.label}</Typography>}
                    sx={{ mb: 0.5 }}
                  />
                ))}
              </RadioGroup>
              {errors.requestType && <FormHelperText sx={{ mt: 1 }}>{errors.requestType}</FormHelperText>}
            </FormControl>

            <Box sx={{ mb: 3 }}>
              <TextField
                label="Please describe what information you are referring to *"
                multiline
                rows={4}
                value={form.details}
                onChange={handleChange('details')}
                error={!!errors.details}
                helperText={errors.details || "For example: 'I am requesting a copy of my child's attendance and grade records for Grade 7' or 'Please update my mobile number to 9876543210'"}
                fullWidth
                size="small"
              />
            </Box>

            {/* Confirmation Checkbox */}
            <Box
              sx={{
                p: 2,
                bgcolor: '#f8fafc',
                border: `1px solid ${errors.declaration ? '#ef4444' : '#e2e8f0'}`,
                borderRadius: '6px',
                mb: 3,
                cursor: 'pointer',
              }}
              onClick={() => {
                setForm((p) => ({ ...p, declaration: !p.declaration }));
                setErrors((p) => ({ ...p, declaration: undefined }));
              }}
            >
              <FormControlLabel
                control={
                  <Radio
                    checked={form.declaration}
                    size="small"
                    sx={{ '&.Mui-checked': { color: '#4f46e5' } }}
                  />
                }
                label={
                  <Typography sx={{ fontSize: '0.85rem', color: '#334155' }}>
                    I confirm that I am the Data Principal (or the parent/legal guardian) entitled to submit this request under India's <strong>DPDP Act</strong>.
                  </Typography>
                }
              />
              {errors.declaration && (
                <Typography sx={{ fontSize: '0.78rem', color: '#ef4444', mt: 0.5, ml: 3.5 }}>
                  {errors.declaration}
                </Typography>
              )}
            </Box>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading}
              endIcon={<Send sx={{ fontSize: 16 }} />}
              sx={{
                bgcolor: '#4f46e5',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.92rem',
                py: 1.25,
                px: 3,
                borderRadius: '6px',
                '&:hover': { bgcolor: '#4338ca' },
              }}
            >
              {isLoading ? 'Submitting...' : 'Submit DPDP Act Request'}
            </Button>
          </Box>
        </Paper>

        {/* Footer */}
        <Box sx={{ mt: 4 }}>
          <LegalFooter light />
        </Box>
      </Container>
    </Box>
  );
};

export default DataRightsRequest;
