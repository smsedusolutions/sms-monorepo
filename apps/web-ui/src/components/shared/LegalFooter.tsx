/**
 * LegalFooter — DPDP Act compliance component
 *
 * Displayed on public-facing pages (Login, Privacy Policy, Terms, Data Rights).
 * Contains:
 *  - Links to Privacy Policy, Terms of Service, Data Rights Request
 *  - DPDP-mandated Grievance Officer contact
 *
 * [LEGAL REVIEW REQUIRED] — Grievance Officer name/email must be confirmed
 *  and updated before going live.
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Shield, Gavel, AssignmentInd, ContactSupport } from '@mui/icons-material';

interface LegalFooterProps {
  /** Override the primary colour for branded login pages */
  accentColor?: string;
  /** Light variant — text appears on a white/light background */
  light?: boolean;
}

const LegalFooter: React.FC<LegalFooterProps> = ({
  accentColor = '#6366F1',
  light = false,
}) => {
  const navigate = useNavigate();

  const textColor = light ? '#64748B' : 'rgba(255,255,255,0.45)';
  const linkColor = light ? accentColor : 'rgba(255,255,255,0.7)';
  const dividerColor = light ? '#E2E8F0' : 'rgba(255,255,255,0.12)';

  const links = [
    { icon: <Shield sx={{ fontSize: 12 }} />, label: 'Privacy Policy', path: '/privacy' },
    { icon: <Gavel sx={{ fontSize: 12 }} />, label: 'Terms', path: '/terms' },
    { icon: <AssignmentInd sx={{ fontSize: 12 }} />, label: 'Data Rights', path: '/data-rights' },
  ];

  return (
    <Box
      component="footer"
      sx={{
        width: '100%',
        pt: 2,
        mt: 'auto',
        borderTop: `1px solid ${dividerColor}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        alignItems: 'center',
      }}
    >
      {/* Navigation links */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap', justifyContent: 'center' }}>
        {links.map(({ icon, label, path }, i) => (
          <React.Fragment key={label}>
            {i > 0 && (
              <Box
                sx={{
                  width: '1px',
                  height: 12,
                  bgcolor: dividerColor,
                  mx: 1.5,
                  alignSelf: 'center',
                }}
              />
            )}
            <Box
              onClick={() => navigate(path)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.4,
                cursor: 'pointer',
                color: textColor,
                '&:hover': { color: linkColor },
                transition: 'color 0.15s',
              }}
            >
              {icon}
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.01em' }}>
                {label}
              </Typography>
            </Box>
          </React.Fragment>
        ))}
      </Box>

      {/* Grievance Officer — DPDP Act §13 */}
      {/* [LEGAL REVIEW REQUIRED] Replace name/email before go-live */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          color: textColor,
          opacity: 0.75,
        }}
      >
        <ContactSupport sx={{ fontSize: 11 }} />
        <Typography sx={{ fontSize: '0.62rem', fontWeight: 500 }}>
          Grievance Officer:{' '}
          <Box
            component="a"
            href="mailto:grievance@smsedusolutions.com"
            sx={{
              color: 'inherit',
              fontWeight: 700,
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            {/* [LEGAL REVIEW REQUIRED] Replace with actual name */}
            grievance@smsedusolutions.com
          </Box>
          {' '}· Response within 30 days
        </Typography>
      </Box>

      {/* DPDP compliance notice */}
      <Typography
        sx={{ fontSize: '0.58rem', color: textColor, opacity: 0.6, textAlign: 'center' }}
      >
        © {new Date().getFullYear()} SMS Edu Solutions · Compliant with India's Digital Personal Data Protection Act 2023
      </Typography>
    </Box>
  );
};

export default LegalFooter;
