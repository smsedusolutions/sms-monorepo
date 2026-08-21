/**
 * Terms of Service — SMS Edu Solutions
 *
 * Includes a Data Protection Clause (Section 7) specifically required for
 * DPDP Act compliance, covering: data processor obligations, security
 * standards, breach notification, and data principal rights.
 *
 * [LEGAL REVIEW REQUIRED] — ALL copy on this page must be reviewed and
 * approved by a qualified lawyer before going live.
 *
 * Last updated: 2026-08-21
 */

import React from 'react';
import {
  Box,
  Typography,
  Container,
  Button,
  Divider,
  Chip,
  Alert,
} from '@mui/material';
import {
  Gavel,
  Shield,
  ArrowBack,
  Article,
  Security,
  Warning,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import LegalFooter from '../../components/shared/LegalFooter';

const bodyText = { fontSize: '0.9rem', color: '#374151', lineHeight: 1.85 };
const heading = { fontWeight: 800, fontSize: '1rem', color: '#0F172A', mb: 1.5, mt: 3 };

interface ClauseProps {
  number: string;
  title: string;
  children: React.ReactNode;
  highlight?: boolean;
}

const Clause: React.FC<ClauseProps> = ({ number, title, children, highlight = false }) => (
  <Box
    sx={{
      mb: 4,
      p: highlight ? 3 : 0,
      borderRadius: highlight ? '14px' : 0,
      border: highlight ? '2px solid #6366F1' : 'none',
      bgcolor: highlight ? '#F5F3FF' : 'transparent',
    }}
  >
    <Typography
      sx={{
        fontWeight: 900,
        fontSize: '1.05rem',
        color: highlight ? '#4338CA' : '#0F172A',
        mb: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      {highlight && <Shield sx={{ color: '#6366F1', fontSize: 20 }} />}
      {number}. {title}
      {highlight && (
        <Chip
          label="DPDP Act Clause"
          size="small"
          sx={{ fontSize: '0.6rem', fontWeight: 700, bgcolor: '#6366F1', color: 'white', ml: 1 }}
        />
      )}
    </Typography>
    {children}
  </Box>
);

const TermsOfService: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          py: { xs: 4, md: 6 },
          px: 3,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            sx={{ color: 'rgba(255,255,255,0.6)', mb: 3, textTransform: 'none', '&:hover': { color: 'white' } }}
          >
            Back
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: '14px', background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(59,130,246,0.4)' }}>
              <Article sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.6rem', md: '2rem' }, color: 'white', lineHeight: 1.1, letterSpacing: '-1px' }}>
                Terms of Service
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', mt: 0.3 }}>
                SMS Edu Solutions · Last updated: 21 August 2026
              </Typography>
            </Box>
          </Box>
          <Chip
            icon={<Gavel sx={{ fontSize: 12, color: '#93C5FD' }} />}
            label="Includes Data Protection Clause — DPDP Act 2023 (India)"
            sx={{ fontSize: '0.7rem', fontWeight: 700, bgcolor: 'rgba(59,130,246,0.2)', color: '#93C5FD', border: '1px solid rgba(59,130,246,0.3)', '& .MuiChip-icon': { color: '#93C5FD' } }}
          />
        </Container>
      </Box>

      {/* Legal Review Banner */}
      {/* [LEGAL REVIEW REQUIRED] Remove before go-live */}
      <Box sx={{ bgcolor: '#FEF3C7', borderBottom: '2px solid #F59E0B', py: 1.5, px: 3 }}>
        <Container maxWidth="md">
          <Typography sx={{ fontSize: '0.78rem', color: '#92400E', fontWeight: 700, textAlign: 'center' }}>
            ⚠️ [LEGAL REVIEW REQUIRED] — This Terms of Service is a compliance draft. Do not publish until reviewed by a lawyer.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: 6, flex: 1 }}>

        {/* Preamble */}
        <Box sx={{ bgcolor: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '12px', p: 2.5, mb: 4 }}>
          {/* [LEGAL REVIEW REQUIRED] Preamble */}
          <Typography sx={bodyText}>
            These Terms of Service ("Terms") govern your use of the SMS Edu Solutions platform ("Platform"), operated by SMS Edu Solutions ("Company", "we", "us"). By accessing the Platform, you agree to these Terms. If you are a school administrator accepting these Terms on behalf of a school, you represent that you have authority to do so.
          </Typography>
        </Box>

        <Clause number="1" title="Acceptance & Eligibility">
          {/* [LEGAL REVIEW REQUIRED] */}
          <Typography sx={bodyText}>
            Use of the Platform requires registration and is limited to authorised school staff, students, parents/guardians, and drivers associated with a registered institution. Users must be at least 18 years old to register independently; students below 18 must have parental/guardian consent obtained by their institution.
          </Typography>
        </Clause>

        <Clause number="2" title="Platform Access & Use">
          {/* [LEGAL REVIEW REQUIRED] */}
          <Typography sx={bodyText}>
            The Company grants you a limited, non-exclusive, non-transferable licence to access and use the Platform solely for educational administration purposes. You may not: reverse-engineer, resell, or sublicense any part of the Platform; use automated tools to scrape data; or attempt to access accounts other than your own.
          </Typography>
        </Clause>

        <Clause number="3" title="Intellectual Property">
          {/* [LEGAL REVIEW REQUIRED] */}
          <Typography sx={bodyText}>
            All Platform software, designs, and content are the intellectual property of SMS Edu Solutions unless otherwise stated. School-generated content (timetables, announcements, fee records) remains the property of the respective school.
          </Typography>
        </Clause>

        <Clause number="4" title="Prohibited Conduct">
          {/* [LEGAL REVIEW REQUIRED] */}
          <Typography sx={bodyText}>
            You agree not to: upload unlawful, harmful, or defamatory content; attempt to bypass authentication or security controls; use the Platform to harass any person; or transmit malware or spam. Violations may result in immediate account suspension.
          </Typography>
        </Clause>

        <Clause number="5" title="Service Availability">
          {/* [LEGAL REVIEW REQUIRED] */}
          <Typography sx={bodyText}>
            We strive for 99.9% uptime but do not guarantee uninterrupted access. We may perform scheduled maintenance with prior notice. We are not liable for losses arising from unavailability outside our reasonable control (force majeure, third-party outages).
          </Typography>
        </Clause>

        <Clause number="6" title="Limitation of Liability">
          {/* [LEGAL REVIEW REQUIRED] */}
          <Typography sx={bodyText}>
            To the maximum extent permitted by law, the Company's aggregate liability for any claim arising from use of the Platform shall not exceed the fees paid (if any) by the relevant school in the preceding 12 months. We are not liable for indirect, consequential, or punitive damages.
          </Typography>
        </Clause>

        {/* ═══════════════════════════════════════════════════════════
            CLAUSE 7 — DATA PROTECTION (DPDP ACT COMPLIANCE)
            [LEGAL REVIEW REQUIRED]
        ═══════════════════════════════════════════════════════════ */}
        <Clause number="7" title="Data Protection — DPDP Act 2023 Compliance" highlight>
          <Alert
            icon={<Warning />}
            severity="warning"
            sx={{ mb: 2, borderRadius: '10px', fontSize: '0.8rem' }}
          >
            [LEGAL REVIEW REQUIRED] — This clause requires review by a data protection lawyer before publication.
          </Alert>

          <Typography sx={heading}>7.1 Roles Under DPDP Act</Typography>
          <Typography sx={bodyText}>
            For the purposes of the Digital Personal Data Protection Act 2023 ("DPDP Act"), <strong>SMS Edu Solutions is the Data Fiduciary</strong> with respect to platform-level data (authentication, audit logs, consent records). Each registered <strong>School is a Data Fiduciary</strong> with respect to student, teacher, parent, and driver personal data processed within its account.
          </Typography>
          {/* [LEGAL REVIEW REQUIRED] The school-as-fiduciary model needs lawyer confirmation */}

          <Typography sx={heading}>7.2 Data Processing Agreement</Typography>
          <Typography sx={bodyText}>
            By registering a school on the Platform, the school administrator enters into a Data Processing Agreement (DPA) with SMS Edu Solutions, under which the Company acts as a <strong>Data Processor</strong> for the school's data. The Company shall: (a) process data only on documented instructions from the school; (b) implement appropriate technical and organisational security measures; (c) notify the school within <strong>48 hours</strong> of becoming aware of a personal data breach; (d) assist the school in fulfilling data principal rights requests; (e) delete or return all personal data upon termination of service.
          </Typography>

          <Typography sx={heading}>7.3 Consent for Students Who Are Minors</Typography>
          <Typography sx={bodyText}>
            Where a Data Principal is a minor (below 18 years), the DPDP Act requires verifiable parental/guardian consent before processing their personal data. Schools are responsible for obtaining and maintaining records of such consent in accordance with applicable rules. SMS Edu Solutions provides consent-record storage infrastructure but the legal obligation to obtain consent rests with the school as Data Fiduciary.
          </Typography>
          {/* [LEGAL REVIEW REQUIRED] Consent verification mechanism for minors */}

          <Typography sx={heading}>7.4 Security Standards</Typography>
          <Typography sx={bodyText}>
            The Company implements the following security measures for the Platform:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mt: 1, mb: 1 }}>
            {[
              'Encrypted storage for sensitive data fields (exam marks: AES-256-GCM)',
              'JWT-based session tokens with configurable expiry',
              'CORS controls limiting API access to authorised origins',
              'Rate limiting on API endpoints',
              'TLS/HTTPS for all data in transit (production environments)',
            ].map((item) => (
              <Box component="li" key={item} sx={{ ...bodyText, mb: 0.5 }}>{item}</Box>
            ))}
          </Box>
          <Alert icon={<Security />} severity="error" sx={{ borderRadius: '10px', mb: 2, fontSize: '0.8rem' }}>
            <strong>[SECURITY FLAG — LEGAL REVIEW REQUIRED]</strong> Password hashing is pending implementation. Current build stores and compares passwords without cryptographic hashing (plaintext). This must be remediated before production deployment and before these terms can accurately represent security standards.
          </Alert>

          <Typography sx={heading}>7.5 Breach Notification</Typography>
          <Typography sx={bodyText}>
            In the event of a personal data breach, the Company shall: (a) notify the affected school within <strong>48 hours</strong> of discovery; (b) the school shall notify the Data Protection Board of India within <strong>72 hours</strong> of discovery (DPDP Act §8); (c) affected Data Principals shall be notified without undue delay following Board notification. See the Breach Response Runbook (internal document) for detailed procedures.
          </Typography>

          <Typography sx={heading}>7.6 Data Principal Rights</Typography>
          <Typography sx={bodyText}>
            Users may exercise the following rights under the DPDP Act by submitting a request via our{' '}
            <Box component="a" href="/data-rights" sx={{ color: '#6366F1', fontWeight: 600 }}>
              Data Rights Request Form
            </Box>
            : Right to Access, Right to Correction, Right to Erasure, Right to Withdraw Consent, Right to Grievance Redressal. Requests will be acknowledged within <strong>7 days</strong> and resolved within <strong>30 days</strong>.
          </Typography>

          <Typography sx={heading}>7.7 Cross-Border Transfers</Typography>
          <Typography sx={bodyText}>
            {/* [LEGAL REVIEW REQUIRED] Confirm permitted countries under DPDP Rules */}
            Personal data may be transferred to countries notified by the Government of India as having adequate data protection standards. Where transfers occur to non-notified countries (e.g., USA via Google services), the Company ensures appropriate contractual safeguards. [LEGAL REVIEW REQUIRED — cross-border transfer rules under DPDP Rules not yet finalised as of 2026]
          </Typography>

          <Typography sx={heading}>7.8 Retention & Deletion</Typography>
          <Typography sx={bodyText}>
            Refer to the Retention Periods table in our Privacy Policy. Schools may request data deletion upon service termination; the Company will complete deletion within 90 days unless statutory retention applies.
          </Typography>
        </Clause>

        <Clause number="8" title="Governing Law & Dispute Resolution">
          {/* [LEGAL REVIEW REQUIRED] */}
          <Typography sx={bodyText}>
            These Terms are governed by the laws of India. Disputes shall first be attempted to be resolved by good-faith negotiation. If unresolved within 30 days, disputes shall be referred to arbitration in accordance with the Arbitration and Conciliation Act 1996. The seat of arbitration shall be [CITY — LEGAL REVIEW REQUIRED]. DPDP Act matters may be escalated to the Data Protection Board of India.
          </Typography>
        </Clause>

        <Clause number="9" title="Changes to These Terms">
          {/* [LEGAL REVIEW REQUIRED] */}
          <Typography sx={bodyText}>
            We may update these Terms from time to time. Material changes (including to the Data Protection clause) will be communicated by email and/or in-platform notice at least 30 days before they take effect. Continued use of the Platform after the effective date constitutes acceptance. Where DPDP Act changes require re-consent, we will collect fresh consent before processing.
          </Typography>
        </Clause>

        <Clause number="10" title="Contact">
          <Typography sx={bodyText}>
            {/* [LEGAL REVIEW REQUIRED] */}
            For general inquiries: support@smsedusolutions.com<br />
            For data protection / DPDP matters: grievance@smsedusolutions.com<br />
            {/* [LEGAL REVIEW REQUIRED] Replace with actual registered address */}
            Registered address: [REGISTERED ADDRESS — LEGAL REVIEW REQUIRED]
          </Typography>
        </Clause>

        <Divider sx={{ my: 4 }} />
        <Typography sx={{ fontSize: '0.78rem', color: '#94A3B8', textAlign: 'center', mb: 4 }}>
          Version 1.0 · 21 August 2026 · [LEGAL REVIEW REQUIRED]
        </Typography>

        <LegalFooter light accentColor="#3B82F6" />
      </Container>
    </Box>
  );
};

export default TermsOfService;
