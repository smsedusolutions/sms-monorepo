/**
 * Privacy Policy — SMS Edu Solutions
 *
 * Compliant with India's Digital Personal Data Protection Act, 2023 (DPDP Act).
 * Written in clear, simple language so parents, students, teachers, and staff can easily understand.
 */

import React from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ArrowBack,
  CheckCircleOutline,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import LegalFooter from '../../components/shared/LegalFooter';
import { useConsent } from '../../components/consent/useConsent';

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();
  const { consent, resetConsent } = useConsent();

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
              Privacy Policy (DPDP Act, 2023)
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
                Your Privacy Under the DPDP Act (India)
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#15803d', mt: 0.5, lineHeight: 1.5 }}>
                This Privacy Policy is designed in accordance with India's <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong>. It clearly explains what personal information we collect, why we need it, how we protect it, and your full legal rights under the DPDP Act.
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* Section 1: Who We Are & DPDP Act Roles */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', mb: 1.5 }}>
              1. Who We Are and Our Role Under the DPDP Act
            </Typography>
            <Typography sx={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.7, mb: 1.5 }}>
              SMS Edu Solutions operates this school management software. Under the <strong>Digital Personal Data Protection Act (DPDP Act)</strong>:
            </Typography>
            <Box component="ul" sx={{ pl: 3, m: 0, '& li': { fontSize: '0.9rem', color: '#334155', mb: 0.75, lineHeight: 1.6 } }}>
              <li>
                <strong>Your School</strong> is the <em>Data Fiduciary</em> under the DPDP Act. The school decides which student, parent, and teacher information is collected for educational management.
              </li>
              <li>
                <strong>SMS Edu Solutions</strong> acts as the <em>Data Processor</em> under the DPDP Act, safely storing and managing the data on behalf of your school.
              </li>
              <li>
                <strong>You (Student, Parent, Teacher, Staff)</strong> are the <em>Data Principal</em> under the DPDP Act, with full legal rights over your personal data.
              </li>
            </Box>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* Section 2: What Data We Collect */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', mb: 1.5 }}>
              2. Personal Data We Collect (DPDP Act Section 7 Notice)
            </Typography>
            <Typography sx={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.7, mb: 2 }}>
              Under the DPDP Act, we only collect personal information that is directly necessary for your school's educational and administrative operations:
            </Typography>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '6px', mb: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem', width: '25%' }}>Who</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Personal Data Collected Under DPDP Act</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>Students (Minors)</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem', color: '#334155' }}>
                      Name, class, section, roll number, date of birth, gender, home address, attendance records, exam marks, photo, and parent/guardian link.
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>Parents / Guardians</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem', color: '#334155' }}>
                      Full name, mobile phone number, email address, relation to student, address, and fee payment receipts.
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>Teachers & Staff</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem', color: '#334155' }}>
                      Full name, email address, phone number, subjects taught, assigned classes, and staff ID.
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>Drivers & Transport Staff</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem', color: '#334155' }}>
                      Name, phone number, vehicle route details, and driving license number for student safety.
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>Login Details</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem', color: '#334155' }}>
                      Email address, secure encrypted password hash (bcrypt), and consent audit records.
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* Section 3: Why We Use This Data */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', mb: 1.5 }}>
              3. Why We Need Your Data (DPDP Act Processing Purposes)
            </Typography>
            <Typography sx={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.7, mb: 1.5 }}>
              Under the DPDP Act, personal data is processed strictly for the following educational purposes:
            </Typography>
            <Box component="ul" sx={{ pl: 3, m: 0, '& li': { fontSize: '0.9rem', color: '#334155', mb: 1, lineHeight: 1.6 } }}>
              <li><strong>School Academics:</strong> Recording attendance, publishing exam results, homework, and timetables.</li>
              <li><strong>Communication:</strong> Sending school announcements, parent-teacher meeting notices, and emergency alerts.</li>
              <li><strong>Fee Management:</strong> Generating fee invoices and receipts for parents and school accounts.</li>
              <li><strong>Student Safety:</strong> Managing school bus routes, driver assignments, and campus pick-ups.</li>
              <li><strong>DPDP Act Compliance & Security:</strong> Maintaining secure login records and recording user consent choices.</li>
            </Box>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* Section 4: Children's Data & Parent Consent */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', mb: 1.5 }}>
              4. Children's Data & Parental Consent (DPDP Act Section 9)
            </Typography>
            <Typography sx={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.7, mb: 1.5 }}>
              Because students are minors (under 18 years), the <strong>DPDP Act (Section 9)</strong> provides special protections:
            </Typography>
            <Box component="ul" sx={{ pl: 3, m: 0, '& li': { fontSize: '0.9rem', color: '#334155', mb: 1, lineHeight: 1.6 } }}>
              <li>Student personal data is only processed with verifiable consent from their parent or legal guardian.</li>
              <li>We never track student behavior across the internet or display targeted advertisements to children.</li>
              <li>We do not process any data that could cause harm to a child.</li>
            </Box>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* Section 5: How Long We Keep Data */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', mb: 1.5 }}>
              5. How Long We Keep Data (DPDP Act Data Retention)
            </Typography>
            <Typography sx={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.7, mb: 1.5 }}>
              Under the DPDP Act, we only keep personal data for as long as it is needed to serve your educational relationship with the school or to fulfill legal rules:
            </Typography>
            <Box component="ul" sx={{ pl: 3, m: 0, '& li': { fontSize: '0.9rem', color: '#334155', mb: 0.75, lineHeight: 1.6 } }}>
              <li><strong>Student & Academic Records:</strong> Retained while the student is enrolled, and archived per school education board guidelines.</li>
              <li><strong>Fee Transaction Records:</strong> Kept for financial audit requirements as mandated by Indian tax laws.</li>
              <li><strong>Login & Consent Records:</strong> Maintained to verify compliance under the DPDP Act.</li>
            </Box>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* Section 6: Third Parties & Cookies */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', mb: 1.5 }}>
              6. Third-Party Services & Consent Choices (DPDP Act)
            </Typography>
            <Typography sx={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.7, mb: 1.5 }}>
              We do not sell or rent your personal data to anyone. We only use trusted infrastructure partners:
            </Typography>
            <Box component="ul" sx={{ pl: 3, m: 0, '& li': { fontSize: '0.9rem', color: '#334155', mb: 1, lineHeight: 1.6 } }}>
              <li><strong>Secure Cloud Database:</strong> Encrypted data storage with strict access controls.</li>
              <li><strong>Google Charts (Non-Essential):</strong> Used on school dashboards to render charts. Under the DPDP Act, this is completely optional and gated by your consent choice.</li>
            </Box>

            {/* Current Consent State Box */}
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f1f5f9', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                Your DPDP Act Consent Status for Optional Charts:
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#475569', mb: 1.5 }}>
                Status: <strong>{consent.analytics ? 'Accepted (Google Charts active)' : 'Declined (Necessary only — charts hidden)'}</strong>
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={resetConsent}
                sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', color: '#4338ca', borderColor: '#cbd5e1' }}
              >
                Reset DPDP Consent Preference
              </Button>
            </Box>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* Section 7: Your Legal Rights Under the DPDP Act */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', mb: 1.5 }}>
              7. Your Legal Rights Under the DPDP Act, 2023
            </Typography>
            <Typography sx={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.7, mb: 1.5 }}>
              As a Data Principal in India, the <strong>DPDP Act</strong> grants you the following clear rights:
            </Typography>
            <Box component="ul" sx={{ pl: 3, m: 0, '& li': { fontSize: '0.9rem', color: '#334155', mb: 1.25, lineHeight: 1.6 } }}>
              <li>
                <strong>1. Right to Access (DPDP Act §11):</strong> You can request a summary of all your personal data held in the system.
              </li>
              <li>
                <strong>2. Right to Correction (DPDP Act §12):</strong> You can ask to fix any incorrect or outdated information.
              </li>
              <li>
                <strong>3. Right to Erasure / Deletion (DPDP Act §12):</strong> You can request deletion of data that is no longer needed for your schooling.
              </li>
              <li>
                <strong>4. Right to Withdraw Consent (DPDP Act §6):</strong> You can withdraw consent for any optional processing at any time.
              </li>
              <li>
                <strong>5. Right to Grievance Redressal (DPDP Act §13):</strong> You can submit a complaint to our Grievance Officer if your data is mishandled.
              </li>
              <li>
                <strong>6. Right to Nominate (DPDP Act §14):</strong> You can appoint a nominee to manage your data rights in the event of death or incapacity.
              </li>
            </Box>

            <Box sx={{ mt: 2.5 }}>
              <Button
                variant="contained"
                onClick={() => navigate('/data-rights')}
                sx={{
                  bgcolor: '#4f46e5',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  py: 1,
                  px: 2.5,
                  borderRadius: '6px',
                  '&:hover': { bgcolor: '#4338ca' },
                }}
              >
                Submit a DPDP Act Data Rights Request
              </Button>
            </Box>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* Section 8: Grievance Officer & Contact */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', mb: 1.5 }}>
              8. Grievance Officer (DPDP Act Section 13)
            </Typography>
            <Typography sx={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.7, mb: 2 }}>
              If you have any questions, concerns, or complaints about how your personal data is handled under the DPDP Act, you can contact our Grievance Officer directly:
            </Typography>

            <Box sx={{ p: 2.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
              <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', mb: 1 }}>
                DPDP Act Grievance Contact:
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#334155', mb: 0.5 }}>
                • <strong>Email:</strong> <a href="mailto:grievance@smsedusolutions.com" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 600 }}>grievance@smsedusolutions.com</a>
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#334155', mb: 0.5 }}>
                • <strong>Response Time:</strong> Within 30 days as mandated by the DPDP Act (India).
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#334155' }}>
                • <strong>Escalation:</strong> If unsatisfied with the resolution, you may approach the <strong>Data Protection Board of India (DPBI)</strong>.
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

export default PrivacyPolicy;
