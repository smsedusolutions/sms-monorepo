/**
 * Terms of Service — SMS Edu Solutions
 *
 * Plain-language terms with dedicated DPDP Act, 2023 (India) data protection provisions.
 * Designed for easy reading by school administrators, staff, parents, and students.
 */

import React from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Button,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  CheckCircleOutline,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import LegalFooter from '../../components/shared/LegalFooter';

const TermsOfService: React.FC = () => {
  const navigate = useNavigate();

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
            DPDP Act Compliance
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
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', sm: '1.9rem' }, color: '#0f172a', mb: 1 }}>
              Terms of Service & DPDP Act Agreement
            </Typography>
            <Typography sx={{ fontSize: '0.9rem', color: '#64748b', mb: 1.5 }}>
              SMS Edu Solutions · Last Updated: 21 August 2026
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
                Data Protection Under DPDP Act (India)
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#15803d', mt: 0.5, lineHeight: 1.5 }}>
                These Terms explain your rights and responsibilities when using SMS Edu Solutions. They incorporate full data fiduciary and processor duties under India's <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong>.
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* Section 1 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', mb: 1.5 }}>
              1. Acceptance of Terms
            </Typography>
            <Typography sx={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.7 }}>
              By logging into or using SMS Edu Solutions, you agree to these Terms and our Privacy Policy. If you are a school administrator registering your institution, you confirm that you have the authority to represent your school and manage personal data in accordance with the <strong>DPDP Act</strong>.
            </Typography>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* Section 2 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', mb: 1.5 }}>
              2. Who Can Use This Platform
            </Typography>
            <Typography sx={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.7, mb: 1.5 }}>
              This platform is strictly for authorized school members:
            </Typography>
            <Box component="ul" sx={{ pl: 3, m: 0, '& li': { fontSize: '0.9rem', color: '#334155', mb: 0.75, lineHeight: 1.6 } }}>
              <li><strong>School Administrators & Staff:</strong> To manage classes, teachers, student admissions, and school records.</li>
              <li><strong>Teachers:</strong> To enter marks, take daily attendance, and assign homework.</li>
              <li><strong>Parents / Guardians:</strong> To monitor their child's school progress, attendance, and pay fees.</li>
              <li><strong>Students:</strong> With parental permission, to view their timetable, homework, and exam results.</li>
              <li><strong>Drivers:</strong> To access vehicle routes and ensure student transport safety.</li>
            </Box>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* Section 3: Data Protection Clause (DPDP Act) */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', mb: 1.5 }}>
              3. Data Protection & Privacy (DPDP Act, 2023 Rules)
            </Typography>
            <Typography sx={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.7, mb: 1.5 }}>
              Both SMS Edu Solutions and your school are legally committed to compliance with the <strong>Digital Personal Data Protection Act (DPDP Act)</strong>:
            </Typography>
            <Box component="ul" sx={{ pl: 3, m: 0, '& li': { fontSize: '0.9rem', color: '#334155', mb: 1.25, lineHeight: 1.6 } }}>
              <li>
                <strong>School Responsibility (DPDP Act Data Fiduciary):</strong> The school is responsible for obtaining lawful parental consent before registering students who are minors (under 18 years) on the platform.
              </li>
              <li>
                <strong>Platform Safeguards (DPDP Act Security):</strong> SMS Edu Solutions enforces industry-standard security safeguards under the DPDP Act, including password encryption (bcrypt), encrypted database storage, and rate-limiting against unauthorized access.
              </li>
              <li>
                <strong>Purpose Limitation (DPDP Act):</strong> Personal data is processed solely for educational delivery and school administrative tasks. We never sell student or parent data to third parties.
              </li>
              <li>
                <strong>Data Breach Reporting (DPDP Act §8):</strong> In the event of a security breach affecting personal data, we will inform the affected school and the <strong>Data Protection Board of India (DPBI)</strong> within the required statutory timeframe.
              </li>
            </Box>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* Section 4: Your Rights Under DPDP Act */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', mb: 1.5 }}>
              4. Exercising Your Rights Under the DPDP Act
            </Typography>
            <Typography sx={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.7, mb: 1.5 }}>
              Under the <strong>DPDP Act</strong>, every user has the right to:
            </Typography>
            <Box component="ul" sx={{ pl: 3, m: 0, '& li': { fontSize: '0.9rem', color: '#334155', mb: 0.75, lineHeight: 1.6 } }}>
              <li>View a summary of their personal information held in the system.</li>
              <li>Correct inaccurate details (e.g. updating phone number or address).</li>
              <li>Request erasure of data when leaving the school, subject to statutory academic retention requirements.</li>
              <li>Withdraw consent for optional platform features at any time.</li>
            </Box>
            <Typography sx={{ fontSize: '0.9rem', color: '#334155', mt: 1.5 }}>
              To exercise these rights, submit a form via our{' '}
              <Box
                component="span"
                onClick={() => navigate('/data-rights')}
                sx={{ color: '#4f46e5', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
              >
                DPDP Act Data Rights Request Page
              </Box>
              .
            </Typography>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* Section 5: Account Security */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', mb: 1.5 }}>
              5. Account Security & User Duties
            </Typography>
            <Typography sx={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.7, mb: 1.5 }}>
              To maintain system safety under the DPDP Act:
            </Typography>
            <Box component="ul" sx={{ pl: 3, m: 0, '& li': { fontSize: '0.9rem', color: '#334155', mb: 0.75, lineHeight: 1.6 } }}>
              <li>Keep your password confidential and never share your login details with other individuals.</li>
              <li>Provide accurate personal information when creating or updating your profile.</li>
              <li>Report any suspected unauthorized account activity to your school administrator or our Grievance Officer immediately.</li>
            </Box>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* Section 6: Grievance Redressal */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', mb: 1.5 }}>
              6. Grievance Redressal (DPDP Act Section 13)
            </Typography>
            <Typography sx={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.7, mb: 2 }}>
              If you have any grievance or dispute regarding your personal data or service use under the <strong>DPDP Act</strong>, please contact:
            </Typography>

            <Box sx={{ p: 2.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
              <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', mb: 1 }}>
                DPDP Act Grievance Contact:
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#334155', mb: 0.5 }}>
                • <strong>Email:</strong> <a href="mailto:grievance@smsedusolutions.com" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 600 }}>grievance@smsedusolutions.com</a>
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#334155', mb: 0.5 }}>
                • <strong>Response SLA:</strong> Resolved within 30 days under DPDP Act requirements.
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#334155' }}>
                • <strong>Statutory Authority:</strong> Data Protection Board of India (DPBI).
              </Typography>
            </Box>
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

export default TermsOfService;
