/**
 * Privacy Policy Page — SMS Edu Solutions
 *
 * Compliant with India's Digital Personal Data Protection Act 2023 (DPDP Act).
 * Covers: data collected, purposes, retention, third parties, data principal
 * rights, grievance officer details.
 *
 * [LEGAL REVIEW REQUIRED] — ALL copy on this page must be reviewed and
 * approved by a qualified data protection lawyer before going live.
 * Sections marked [LEGAL REVIEW REQUIRED] need specific attention.
 *
 * Last updated: 2026-08-21
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  ExpandMore,
  Shield,
  School as SchoolIcon,
  Person,
  Security,
  Gavel,
  ContactSupport,
  DeleteForever,
  EditNote,
  Visibility,
  ThumbDown,
  ArrowBack,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import LegalFooter from '../../components/shared/LegalFooter';
import { useConsent } from '../../components/consent/useConsent';

// ─── Section component ──────────────────────────────────────────────────────

interface SectionProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  badge?: string;
}

const Section: React.FC<SectionProps> = ({ id, icon, title, children, badge }) => (
  <Box id={id} sx={{ mb: 5 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
          {title}
        </Typography>
        {badge && (
          <Chip
            label={badge}
            size="small"
            sx={{ fontSize: '0.6rem', fontWeight: 700, bgcolor: '#FEF3C7', color: '#92400E', mt: 0.5 }}
          />
        )}
      </Box>
    </Box>
    {children}
  </Box>
);

const bodyText = { fontSize: '0.9rem', color: '#374151', lineHeight: 1.8 };
const highlight = { bgcolor: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '10px', p: 2, mb: 2 };
const warning = { bgcolor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', p: 2, mb: 2 };

// ─── Main Component ─────────────────────────────────────────────────────────

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();
  const { consent, resetConsent } = useConsent();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%)',
          py: { xs: 4, md: 6 },
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
            <Box sx={{ width: 48, height: 48, borderRadius: '14px', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(99,102,241,0.4)' }}>
              <Shield sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.6rem', md: '2rem' }, color: 'white', lineHeight: 1.1, letterSpacing: '-1px' }}>
                Privacy Policy
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', mt: 0.3 }}>
                SMS Edu Solutions · Last updated: 21 August 2026
              </Typography>
            </Box>
          </Box>
          <Chip
            icon={<Gavel sx={{ fontSize: 12, color: '#A5B4FC' }} />}
            label="Compliant with Digital Personal Data Protection Act 2023 (India)"
            sx={{ fontSize: '0.7rem', fontWeight: 700, bgcolor: 'rgba(99,102,241,0.2)', color: '#A5B4FC', border: '1px solid rgba(99,102,241,0.3)', '& .MuiChip-icon': { color: '#A5B4FC' } }}
          />
        </Container>
      </Box>

      {/* Legal Review Notice */}
      {/* [LEGAL REVIEW REQUIRED] Remove this banner before go-live */}
      <Box sx={{ bgcolor: '#FEF3C7', borderBottom: '2px solid #F59E0B', py: 1.5, px: 3 }}>
        <Container maxWidth="md">
          <Typography sx={{ fontSize: '0.78rem', color: '#92400E', fontWeight: 700, textAlign: 'center' }}>
            ⚠️ [LEGAL REVIEW REQUIRED] — This Privacy Policy is a compliance draft and has NOT yet been reviewed by a lawyer. Do not publish until reviewed.
          </Typography>
        </Container>
      </Box>

      {/* Content */}
      <Container maxWidth="md" sx={{ py: 6, flex: 1 }}>
        {/* Introduction */}
        <Box sx={highlight}>
          {/* [LEGAL REVIEW REQUIRED] Introduction text */}
          <Typography sx={{ ...bodyText, fontWeight: 600 }}>
            SMS Edu Solutions ("we", "us", "our") is the Data Fiduciary for the SMS Edu platform, a multi-tenant school management system. This Privacy Policy explains how we collect, use, share, and protect personal data, and describes your rights under the Digital Personal Data Protection Act 2023 ("DPDP Act").
          </Typography>
          <Typography sx={{ ...bodyText, mt: 1 }}>
            {/* [LEGAL REVIEW REQUIRED] Operator name + registered address */}
            <strong>Data Fiduciary:</strong> SMS Edu Solutions | <strong>Contact:</strong> grievance@smsedusolutions.com
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* 1. Data Collected */}
        <Section id="data-collected" icon={<Person sx={{ color: 'white', fontSize: 20 }} />} title="1. Personal Data We Collect" badge="[LEGAL REVIEW REQUIRED]">
          {/* [LEGAL REVIEW REQUIRED] Confirm completeness of this table */}
          <TableContainer component={Paper} sx={{ borderRadius: '12px', mb: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#F1F5F9' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>Data Principal</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>Personal Data Collected</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>Sensitivity</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  ['Students (minors)', 'Full name, email, phone, date of birth, gender, address, profile photo, class, roll number, attendance, exam marks, fee records, discipline records', 'High — minor'],
                  ['Parents / Guardians', 'Full name, email, phone, address, occupation, relationship to student', 'High'],
                  ['Teachers', 'Full name, email, phone, department, subjects taught, profile photo', 'Medium'],
                  ['Drivers', 'Full name, email, phone, assigned vehicle and route IDs', 'Medium'],
                  ['Principals / Admins', 'Full name, email, role, school affiliation', 'Medium'],
                  ['All users (authentication)', 'Email address, password (hashed — see Security section), login timestamps', 'High'],
                ].map(([role, data, sensitivity]) => (
                  <TableRow key={role} sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{role}</TableCell>
                    <TableCell sx={{ fontSize: '0.82rem', color: '#374151' }}>{data}</TableCell>
                    <TableCell>
                      <Chip
                        label={sensitivity}
                        size="small"
                        sx={{
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          bgcolor: sensitivity.includes('High') ? '#FEE2E2' : '#FEF3C7',
                          color: sensitivity.includes('High') ? '#991B1B' : '#92400E',
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Typography sx={{ ...bodyText, fontSize: '0.82rem', color: '#64748B' }}>
            We also collect technical data such as IP addresses and browser user-agent strings when you log in, solely for security and consent-audit purposes.
          </Typography>
        </Section>

        {/* 2. Purposes */}
        <Section id="purposes" icon={<SchoolIcon sx={{ color: 'white', fontSize: 20 }} />} title="2. Purposes of Processing" badge="[LEGAL REVIEW REQUIRED]">
          {/* [LEGAL REVIEW REQUIRED] Confirm legal basis for each purpose */}
          {[
            ['Account Management & Authentication', 'To create and manage user accounts and securely verify identity on login.', 'Consent (login) + Contract (service delivery)'],
            ['Education Administration', 'To manage attendance, timetables, exam results, homework, and academic records.', 'Contract + Legitimate interest (school operations)'],
            ['Fee Management', 'To issue fee statements, track payments, and generate receipts.', 'Contract + Legal obligation'],
            ['Communication', 'To send notifications, announcements, and PTM booking confirmations.', 'Consent + Contract'],
            ['Transport Safety', 'To track vehicle routes and driver assignments for student safety.', 'Legitimate interest (safety)'],
            ['Platform Analytics', 'Dashboard charts (Google Charts) showing aggregated school performance data.', 'Consent (opt-in via consent banner)'],
            ['Security & Audit', 'To detect unauthorised access, store consent records, and maintain audit logs.', 'Legitimate interest + Legal obligation'],
          ].map(([purpose, desc, basis]) => (
            <Accordion key={purpose} disableGutters elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '10px!important', mb: 1, '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: '#0F172A' }}>{purpose}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Typography sx={{ ...bodyText, mb: 1 }}>{desc}</Typography>
                <Typography sx={{ fontSize: '0.78rem', color: '#6366F1', fontWeight: 600 }}>
                  Legal basis: {basis}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Section>

        {/* 3. Retention */}
        <Section id="retention" icon={<DeleteForever sx={{ color: 'white', fontSize: 20 }} />} title="3. Retention Periods" badge="[LEGAL REVIEW REQUIRED]">
          {/* [LEGAL REVIEW REQUIRED] Retention periods must be confirmed against applicable school record-keeping laws */}
          <Box sx={warning}>
            <Typography sx={{ fontSize: '0.8rem', color: '#92400E', fontWeight: 600 }}>
              ⚠️ [LEGAL REVIEW REQUIRED] — Retention periods below are indicative and must be confirmed against the Right to Education Act, Income Tax Act, and applicable state education board rules before go-live.
            </Typography>
          </Box>
          <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#F1F5F9' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>Data Category</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>Retention Period</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>Trigger for Deletion</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  ['Student academic records', '7 years after graduation / withdrawal', 'Request from school + regulatory clearance'],
                  ['Fee transaction records', '8 years (Income Tax Act)', 'Statutory period expiry'],
                  ['Authentication logs', '90 days', 'Rolling window; auto-purge'],
                  ['Consent records', 'Duration of account + 3 years', 'Account deletion + audit period'],
                  ['Chat messages', '1 year after account closure', 'Account deletion + 365 days'],
                  ['Profile images', 'Duration of active account', 'Account deletion or user erasure request'],
                  ['Discipline records', 'Until student leaves school + 3 years', 'Request + school policy'],
                ].map(([category, period, trigger]) => (
                  <TableRow key={category} sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{category}</TableCell>
                    <TableCell sx={{ fontSize: '0.82rem' }}>{period}</TableCell>
                    <TableCell sx={{ fontSize: '0.82rem', color: '#64748B' }}>{trigger}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Section>

        {/* 4. Third Parties */}
        <Section id="third-parties" icon={<Security sx={{ color: 'white', fontSize: 20 }} />} title="4. Third-Party Services" badge="[LEGAL REVIEW REQUIRED]">
          {/* [LEGAL REVIEW REQUIRED] Confirm DPA / data processing agreements with all third parties */}
          <Typography sx={{ ...bodyText, mb: 2 }}>
            We share limited personal data with the following third parties. Where these parties are located outside India, we ensure appropriate cross-border transfer safeguards.
          </Typography>
          {[
            {
              name: 'Google LLC (Google Fonts)',
              purpose: 'Loading typography fonts (Inter, Outfit) for the platform interface.',
              data: 'IP address (via browser request)',
              transfer: 'USA — Google Privacy Policy applies',
              essential: true,
            },
            {
              name: 'Google LLC (Google Charts)',
              purpose: 'Rendering interactive dashboard charts for school performance data.',
              data: 'IP address, browser metadata (gstatic.com)',
              transfer: 'USA — Google Privacy Policy applies',
              essential: false,
            },
            {
              name: 'MongoDB Atlas / Cloud DB Provider',
              purpose: 'Storing all platform data in encrypted databases.',
              data: 'All personal data described in Section 1',
              transfer: 'Subject to data processing agreement',
              essential: true,
            },
            {
              name: 'Email Service Provider (configured by school)',
              purpose: 'Sending OTP, notification, and announcement emails.',
              data: 'Email address, name',
              transfer: 'Subject to school\'s email provider agreement',
              essential: true,
            },
          ].map(({ name, purpose, data, transfer, essential }) => (
            <Box key={name} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A', flex: 1 }}>{name}</Typography>
                <Chip
                  label={essential ? 'Essential' : 'Non-essential (consent required)'}
                  size="small"
                  sx={{
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    bgcolor: essential ? '#DCFCE7' : '#FEF3C7',
                    color: essential ? '#166534' : '#92400E',
                  }}
                />
              </Box>
              <Typography sx={{ fontSize: '0.82rem', color: '#374151', mb: 0.5 }}><strong>Purpose:</strong> {purpose}</Typography>
              <Typography sx={{ fontSize: '0.82rem', color: '#374151', mb: 0.5 }}><strong>Data shared:</strong> {data}</Typography>
              <Typography sx={{ fontSize: '0.82rem', color: '#64748B' }}><strong>Transfer:</strong> {transfer}</Typography>
            </Box>
          ))}
        </Section>

        {/* 5. Your Rights */}
        <Section id="rights" icon={<EditNote sx={{ color: 'white', fontSize: 20 }} />} title="5. Your Rights Under the DPDP Act" badge="[LEGAL REVIEW REQUIRED]">
          {/* [LEGAL REVIEW REQUIRED] Rights description and process */}
          <Typography sx={{ ...bodyText, mb: 2 }}>
            Under the DPDP Act 2023, you (as a Data Principal) have the following rights. To exercise any right, use our{' '}
            <Box component="span" onClick={() => window.location.href = '/data-rights'} sx={{ color: '#6366F1', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>
              Data Rights Request Form
            </Box>
            . We will respond within <strong>30 days</strong>.
          </Typography>
          {[
            { icon: <Visibility sx={{ color: '#6366F1', fontSize: 20 }} />, title: 'Right to Access', desc: 'You may request a summary of the personal data we hold about you and the purposes for which it is being processed.' },
            { icon: <EditNote sx={{ color: '#6366F1', fontSize: 20 }} />, title: 'Right to Correction', desc: 'You may request correction of inaccurate or incomplete personal data held about you.' },
            { icon: <DeleteForever sx={{ color: '#6366F1', fontSize: 20 }} />, title: 'Right to Erasure', desc: 'You may request erasure of your personal data where the purpose of processing is no longer relevant, subject to statutory retention obligations.' },
            { icon: <ThumbDown sx={{ color: '#6366F1', fontSize: 20 }} />, title: 'Right to Withdraw Consent', desc: 'Where processing is based on consent, you may withdraw it at any time without affecting the lawfulness of prior processing. For analytics/Google Charts, you may update your choice via the consent banner (accessible from the Privacy Policy link in the footer).' },
            { icon: <ContactSupport sx={{ color: '#6366F1', fontSize: 20 }} />, title: 'Right to Grievance Redressal', desc: 'You may raise a grievance with our Grievance Officer (details in Section 6). If unsatisfied, you may escalate to the Data Protection Board of India.' },
          ].map(({ icon, title, desc }) => (
            <Box key={title} sx={{ display: 'flex', gap: 2, p: 2, border: '1px solid #E2E8F0', borderRadius: '12px', mb: 1.5 }}>
              <Box sx={{ mt: 0.3, flexShrink: 0 }}>{icon}</Box>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A', mb: 0.5 }}>{title}</Typography>
                <Typography sx={{ ...bodyText, fontSize: '0.85rem' }}>{desc}</Typography>
              </Box>
            </Box>
          ))}
        </Section>

        {/* 6. Grievance Officer */}
        <Section id="grievance" icon={<ContactSupport sx={{ color: 'white', fontSize: 20 }} />} title="6. Grievance Officer">
          {/* [LEGAL REVIEW REQUIRED] Replace placeholder details with real Grievance Officer information */}
          <Box
            sx={{
              border: '2px solid #6366F1',
              borderRadius: '14px',
              p: 3,
              background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)',
            }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#1E1B4B', mb: 1.5 }}>
              Grievance Officer Details
              {/* [LEGAL REVIEW REQUIRED] */}
            </Typography>
            {[
              ['Name', '[GRIEVANCE_OFFICER_NAME]  ← [LEGAL REVIEW REQUIRED]'],
              ['Email', 'grievance@smsedusolutions.com  ← [LEGAL REVIEW REQUIRED]'],
              ['Response SLA', 'Within 30 days of receipt of grievance (DPDP Act §13)'],
              ['Escalation', 'Data Protection Board of India (DPBI) — https://dpboard.gov.in'],
            ].map(([label, value]) => (
              <Box key={label} sx={{ display: 'flex', gap: 2, mb: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#4338CA', minWidth: 100 }}>{label}:</Typography>
                <Typography sx={{ fontSize: '0.85rem', color: '#374151' }}>{value}</Typography>
              </Box>
            ))}
          </Box>
        </Section>

        {/* 7. Consent management */}
        <Section id="consent" icon={<Shield sx={{ color: 'white', fontSize: 20 }} />} title="7. Managing Your Consent">
          <Typography sx={{ ...bodyText, mb: 2 }}>
            Your current consent preference for non-essential services (Google Charts):
          </Typography>
          <Box sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Chip
              label={consent.analytics ? '✓ Analytics: Accepted' : '✗ Analytics: Declined'}
              sx={{
                fontWeight: 700,
                bgcolor: consent.analytics ? '#DCFCE7' : '#FEE2E2',
                color: consent.analytics ? '#166534' : '#991B1B',
              }}
            />
            <Typography sx={{ fontSize: '0.82rem', color: '#64748B' }}>
              {consent.decided ? `Decision recorded: ${consent.timestamp ? new Date(consent.timestamp).toLocaleDateString('en-IN') : 'Unknown'}` : 'No decision recorded yet'}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            onClick={resetConsent}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontSize: '0.82rem', borderColor: '#6366F1', color: '#6366F1' }}
          >
            Change Consent Preferences
          </Button>
          <Typography sx={{ fontSize: '0.78rem', color: '#64748B', mt: 1 }}>
            Clicking this will show the consent banner again on next page reload.
          </Typography>
        </Section>

        <Divider sx={{ my: 4 }} />
        <Typography sx={{ fontSize: '0.78rem', color: '#94A3B8', textAlign: 'center', mb: 4 }}>
          {/* [LEGAL REVIEW REQUIRED] Version history / change log to be maintained */}
          Version 1.0 · 21 August 2026 · This policy may be updated; material changes will trigger re-consent.
        </Typography>

        <LegalFooter light accentColor="#6366F1" />
      </Container>
    </Box>
  );
};

export default PrivacyPolicy;
