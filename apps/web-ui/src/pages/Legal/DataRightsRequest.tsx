/**
 * DataRightsRequest — DPDP Act §12 Self-Service Rights Request Form
 *
 * Enables Data Principals to submit requests for:
 *  - Access (summary of their data)
 *  - Correction (fix inaccurate data)
 *  - Erasure (delete their data)
 *  - Withdraw Consent
 *
 * Submission sends a structured email to the Grievance Officer.
 * [LEGAL REVIEW REQUIRED] — Form text and response template need lawyer review.
 * [IMPLEMENTATION NOTE] — In production, replace the mailto: handler with a
 *   backend POST to /api/auth/data-rights and store requests in the DB.
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Alert,
  Chip,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Fade,
  Divider,
  Paper,
} from '@mui/material';
import {
  AssignmentInd,
  CheckCircle,
  ArrowBack,
  Gavel,
  Send,
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
  schoolName?: string;
  requestType?: string;
  details?: string;
  declaration?: string;
}

const GRIEVANCE_EMAIL = 'grievance@smsedusolutions.com'; // [LEGAL REVIEW REQUIRED]

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
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.role) e.role = 'Please select your role';
    if (!form.requestType) e.requestType = 'Please select the type of request';
    if (!form.details.trim()) e.details = 'Please provide details about your request';
    else if (form.details.trim().length < 20) e.details = 'Please provide at least 20 characters of detail';
    if (!form.declaration) e.declaration = 'You must declare that the information provided is accurate';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { value: unknown }>
  ) => {
    setForm((p) => ({ ...p, [field]: (e.target as HTMLInputElement).value }));
    if (errors[field as keyof FormErrors]) setErrors((p) => ({ ...p, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);

    // [IMPLEMENTATION NOTE] Replace with API call in production:
    // await fetch('/api/auth/data-rights', { method: 'POST', body: JSON.stringify(form) })

    // mailto: fallback for current implementation
    const subject = encodeURIComponent(`DPDP Data Rights Request — ${form.requestType} — ${form.email}`);
    const body = encodeURIComponent(
      `DPDP ACT DATA RIGHTS REQUEST\n` +
      `=====================================\n` +
      `Request Type: ${form.requestType}\n` +
      `Full Name: ${form.fullName}\n` +
      `Email: ${form.email}\n` +
      `Role: ${form.role}\n` +
      `School: ${form.schoolName || 'N/A'}\n` +
      `Submitted: ${new Date().toISOString()}\n\n` +
      `Details:\n${form.details}\n\n` +
      `Declaration: Data Principal declares information is accurate.`
    );

    window.location.href = `mailto:${GRIEVANCE_EMAIL}?subject=${subject}&body=${body}`;

    // Simulate brief delay then show success
    setTimeout(() => {
      setIsLoading(false);
      setSubmitted(true);
    }, 800);
  };

  const requestTypes = [
    { value: 'access', label: 'Access — Request a summary of my personal data (DPDP Act §11)' },
    { value: 'correction', label: 'Correction — Fix inaccurate or incomplete personal data (DPDP Act §12)' },
    { value: 'erasure', label: 'Erasure — Delete my personal data (DPDP Act §12)' },
    { value: 'withdraw_consent', label: 'Withdraw Consent — Stop processing based on my consent (DPDP Act §6)' },
    { value: 'grievance', label: 'Grievance — Raise a complaint about data processing (DPDP Act §13)' },
    { value: 'nominee', label: 'Nominee — Register a nominee for my data rights (DPDP Act §14)' },
  ];

  if (submitted) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Fade in timeout={600}>
          <Box sx={{ textAlign: 'center', maxWidth: 480 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
                boxShadow: '0 8px 24px rgba(16,185,129,0.4)',
              }}
            >
              <CheckCircle sx={{ color: 'white', fontSize: 40 }} />
            </Box>
            <Typography sx={{ fontWeight: 900, fontSize: '1.6rem', color: '#0F172A', mb: 1, letterSpacing: '-0.5px' }}>
              Request Submitted
            </Typography>
            <Typography sx={{ fontSize: '0.9rem', color: '#64748B', lineHeight: 1.7, mb: 3 }}>
              Your data rights request has been submitted to our Grievance Officer at{' '}
              <strong>{GRIEVANCE_EMAIL}</strong>. We will acknowledge your request within{' '}
              <strong>7 days</strong> and resolve it within <strong>30 days</strong> as required by the DPDP Act 2023.
            </Typography>
            <Alert severity="info" sx={{ borderRadius: '12px', mb: 3, textAlign: 'left', fontSize: '0.82rem' }}>
              {/* [LEGAL REVIEW REQUIRED] Response SLA and escalation path */}
              If you do not receive a response within 30 days, you may escalate to the <strong>Data Protection Board of India</strong> at <strong>https://dpboard.gov.in</strong>.
            </Alert>
            <Button
              variant="contained"
              onClick={() => navigate('/login')}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 700,
                px: 4,
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              }}
            >
              Return to Login
            </Button>
          </Box>
        </Fade>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #064E3B 0%, #0F172A 100%)',
          py: { xs: 4, md: 5 },
          px: 3,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            sx={{ color: 'rgba(255,255,255,0.6)', mb: 3, textTransform: 'none', '&:hover': { color: 'white' } }}
          >
            Back
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: '14px', background: 'linear-gradient(135deg, #10B981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(16,185,129,0.4)' }}>
              <AssignmentInd sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.5rem', md: '1.9rem' }, color: 'white', lineHeight: 1.1, letterSpacing: '-0.5px' }}>
                Data Rights Request
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', mt: 0.3 }}>
                Exercise your rights under the Digital Personal Data Protection Act 2023
              </Typography>
            </Box>
          </Box>
          <Chip
            icon={<Gavel sx={{ fontSize: 12, color: '#6EE7B7' }} />}
            label="Requests processed within 30 days · DPDP Act §11–§14"
            sx={{ fontSize: '0.7rem', fontWeight: 700, bgcolor: 'rgba(16,185,129,0.2)', color: '#6EE7B7', border: '1px solid rgba(16,185,129,0.3)', '& .MuiChip-icon': { color: '#6EE7B7' } }}
          />
        </Container>
      </Box>

      {/* Legal Review Banner */}
      {/* [LEGAL REVIEW REQUIRED] Remove before go-live */}
      <Box sx={{ bgcolor: '#FEF3C7', borderBottom: '2px solid #F59E0B', py: 1.5, px: 3 }}>
        <Container maxWidth="md">
          <Typography sx={{ fontSize: '0.78rem', color: '#92400E', fontWeight: 700, textAlign: 'center' }}>
            ⚠️ [LEGAL REVIEW REQUIRED] — This form is a compliance draft. Production: replace mailto handler with backend API and store requests in database.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: 5, flex: 1 }}>
        {/* Info box */}
        <Alert severity="info" sx={{ mb: 4, borderRadius: '12px', fontSize: '0.85rem' }}>
          Under the DPDP Act 2023, you have the right to access, correct, erase your personal data, and withdraw consent. We will acknowledge your request within <strong>7 days</strong> and resolve it within <strong>30 days</strong>. Provide as much detail as possible to help us process your request efficiently.
        </Alert>

        <Paper elevation={0} sx={{ borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <Box sx={{ p: { xs: 3, md: 4 } }}>
            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#0F172A', mb: 3 }}>
              Your Information
            </Typography>

            <Box component="form" onSubmit={handleSubmit}>
              {/* Personal Details */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5, mb: 3 }}>
                <TextField
                  label="Full Name *"
                  value={form.fullName}
                  onChange={handleChange('fullName')}
                  error={!!errors.fullName}
                  helperText={errors.fullName}
                  fullWidth
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />
                <TextField
                  label="Email Address *"
                  type="email"
                  value={form.email}
                  onChange={handleChange('email')}
                  error={!!errors.email}
                  helperText={errors.email}
                  fullWidth
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5, mb: 3 }}>
                <FormControl fullWidth error={!!errors.role}>
                  <InputLabel>Your Role *</InputLabel>
                  <Select
                    value={form.role}
                    label="Your Role *"
                    onChange={(e) => { setForm((p) => ({ ...p, role: e.target.value })); setErrors((p) => ({ ...p, role: undefined })); }}
                    sx={{ borderRadius: '10px' }}
                  >
                    {['Student', 'Parent / Guardian', 'Teacher', 'School Admin', 'Principal', 'Driver', 'Other'].map((r) => (
                      <MenuItem key={r} value={r}>{r}</MenuItem>
                    ))}
                  </Select>
                  {errors.role && <FormHelperText>{errors.role}</FormHelperText>}
                </FormControl>

                <TextField
                  label="School Name (if applicable)"
                  value={form.schoolName}
                  onChange={handleChange('schoolName')}
                  fullWidth
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Request Type */}
              <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#0F172A', mb: 2 }}>
                Request Details
              </Typography>

              <FormControl component="fieldset" error={!!errors.requestType} sx={{ mb: 3, width: '100%' }}>
                <FormLabel component="legend" sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#374151', mb: 1 }}>
                  Type of Request *
                </FormLabel>
                <RadioGroup
                  value={form.requestType}
                  onChange={(e) => { setForm((p) => ({ ...p, requestType: e.target.value })); setErrors((p) => ({ ...p, requestType: undefined })); }}
                >
                  {requestTypes.map(({ value, label }) => (
                    <FormControlLabel
                      key={value}
                      value={value}
                      control={<Radio size="small" sx={{ '&.Mui-checked': { color: '#6366F1' } }} />}
                      label={<Typography sx={{ fontSize: '0.85rem', color: '#374151' }}>{label}</Typography>}
                      sx={{ mb: 0.5 }}
                    />
                  ))}
                </RadioGroup>
                {errors.requestType && <FormHelperText>{errors.requestType}</FormHelperText>}
              </FormControl>

              <TextField
                label="Details of Your Request *"
                multiline
                rows={5}
                value={form.details}
                onChange={handleChange('details')}
                error={!!errors.details}
                helperText={errors.details || `Please describe your request in detail. Include: which data you're referring to, the time period, and any additional context. (${form.details.length} characters)`}
                fullWidth
                placeholder="e.g., 'I would like a copy of all personal data held about me, specifically my attendance records and exam marks for the academic year 2025–2026...'"
                sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />

              {/* Declaration */}
              <Box
                sx={{
                  p: 2,
                  border: `1px solid ${errors.declaration ? '#EF4444' : '#E2E8F0'}`,
                  borderRadius: '12px',
                  bgcolor: '#F8FAFC',
                  mb: 3,
                  cursor: 'pointer',
                }}
                onClick={() => { setForm((p) => ({ ...p, declaration: !p.declaration })); setErrors((p) => ({ ...p, declaration: undefined })); }}
              >
                <FormControlLabel
                  control={
                    <Radio
                      checked={form.declaration}
                      size="small"
                      sx={{ '&.Mui-checked': { color: '#6366F1' } }}
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: '0.85rem', color: '#374151' }}>
                      {/* [LEGAL REVIEW REQUIRED] Declaration text */}
                      I declare that the information provided above is accurate and complete. I understand that providing false information may affect processing of my request. I am the Data Principal (or authorised representative) for the data described above.
                    </Typography>
                  }
                />
                {errors.declaration && (
                  <Typography sx={{ fontSize: '0.75rem', color: '#EF4444', mt: 1, ml: 4 }}>
                    {errors.declaration}
                  </Typography>
                )}
              </Box>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={isLoading}
                endIcon={<Send />}
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 700,
                  py: 1.6,
                  fontSize: '0.95rem',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  boxShadow: '0 6px 20px rgba(16,185,129,0.4)',
                  '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 8px 24px rgba(16,185,129,0.5)' },
                  transition: 'all 0.2s',
                }}
              >
                {isLoading ? 'Submitting...' : 'Submit Data Rights Request'}
              </Button>

              <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8', textAlign: 'center', mt: 1.5 }}>
                Requests are sent to grievance@smsedusolutions.com · {/* [LEGAL REVIEW REQUIRED] */}
                Response within 30 days · DPDP Act §11–§14
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Box sx={{ mt: 4 }}>
          <LegalFooter light accentColor="#10B981" />
        </Box>
      </Container>
    </Box>
  );
};

export default DataRightsRequest;
