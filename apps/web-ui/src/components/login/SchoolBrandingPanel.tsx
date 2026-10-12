import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  School as SchoolIcon,
  LocationOn,
  Email,
  Phone,
  Language,
} from '@mui/icons-material';
import { type SchoolBranding } from '../../hooks/useSubdomainSchool';

interface SchoolBrandingPanelProps {
  school: SchoolBranding | null;
}

/** SMS Platform logo mark */
const SmsLogo: React.FC<{ size?: number }> = ({ size = 44 }) => (
  <Box
    sx={{
      width: size,
      height: size,
      borderRadius: '8px',
      bgcolor: '#0284C7',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
      flexShrink: 0,
    }}
  >
    <SchoolIcon sx={{ color: 'white', fontSize: size * 0.55 }} />
  </Box>
);

/** School logo - image if available, fallback to initial */
const SchoolLogoMark: React.FC<{
  logo?: string;
  name?: string;
  primaryColor?: string;
  size?: number;
}> = ({ logo, name, primaryColor = '#0284C7', size = 44 }) => {
  if (logo) {
    return (
      <Box
        component="img"
        src={logo}
        alt={name}
        sx={{
          width: size,
          height: size,
          borderRadius: '8px',
          objectFit: 'contain',
          bgcolor: 'white',
          p: '5px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          flexShrink: 0,
        }}
      />
    );
  }

  const initial = name ? name.charAt(0).toUpperCase() : 'S';
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '8px',
        bgcolor: primaryColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        flexShrink: 0,
      }}
    >
      <Typography
        sx={{
          color: 'white',
          fontWeight: 900,
          fontSize: size * 0.45,
          lineHeight: 1,
        }}
      >
        {initial}
      </Typography>
    </Box>
  );
};

const SchoolBrandingPanel: React.FC<SchoolBrandingPanelProps> = ({ school }) => {
  const primary = school?.loginTheme?.primaryColor || '#0284C7';
  const bg = school?.loginTheme?.backgroundColor || '#0F172A';

  const isDarkBg = (() => {
    const hex = bg.replace('#', '');
    if (hex.length !== 6) return true;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum < 0.5;
  })();

  const heroTextColor = isDarkBg ? '#F8FAFC' : '#0F172A';
  const subTextColor = isDarkBg ? 'rgba(248,250,252,0.65)' : '#475569';

  if (!school) {
    return (
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          p: 6,
          bgcolor: '#0F172A',
          borderRight: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 'auto' }}>
            <SmsLogo size={42} />
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', color: '#F8FAFC', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                SMS Edu
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: 'rgba(248,250,252,0.5)', fontWeight: 500, letterSpacing: '0.05em' }}>
                SOLUTIONS
              </Typography>
            </Box>
          </Box>

          {/* Hero */}
          <Box sx={{ my: 'auto' }}>
            <Box
              sx={{
                display: 'inline-block',
                px: 1.5,
                py: 0.5,
                bgcolor: 'rgba(2,132,199,0.15)',
                border: '1px solid rgba(2,132,199,0.3)',
                borderRadius: '6px',
                mb: 3,
              }}
            >
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#38BDF8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                School Management System
              </Typography>
            </Box>

            <Typography
              sx={{
                fontSize: 'clamp(2.2rem, 3.5vw, 3.2rem)',
                fontWeight: 800,
                lineHeight: 1.15,
                mb: 3,
                color: '#F8FAFC',
                letterSpacing: '-1px',
              }}
            >
              Institutional Operations & Learning Platform
            </Typography>
            <Typography sx={{ color: 'rgba(248,250,252,0.7)', fontSize: '1rem', lineHeight: 1.7, maxWidth: 440 }}>
              Unified portal for academic records, attendance tracking, examination workflows, transport oversight, and school communication.
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  // School-specific branding
  return (
    <Box
      sx={{
        flex: 1,
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        p: 6,
        bgcolor: bg,
        borderRight: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Collab Logo Row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0, mb: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SchoolLogoMark logo={school.schoolLogo} name={school.schoolName} primaryColor={primary} size={44} />
            <Box sx={{ maxWidth: 160 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: heroTextColor, lineHeight: 1.2, letterSpacing: '-0.3px' }}>
                {school.schoolName}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              mx: 2,
              width: 28,
              height: 28,
              borderRadius: '6px',
              bgcolor: isDarkBg ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              border: `1px solid ${isDarkBg ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDarkBg ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
              fontSize: '0.85rem',
              fontWeight: 500,
              flexShrink: 0,
            }}
          >
            |
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SmsLogo size={44} />
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: heroTextColor, lineHeight: 1.2, letterSpacing: '-0.3px' }}>
                SMS Edu
              </Typography>
              <Typography sx={{ fontSize: '0.65rem', color: subTextColor, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                Solutions
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Hero Content */}
        <Box sx={{ my: 'auto', py: 4 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              px: 1.5,
              py: 0.6,
              bgcolor: `${primary}15`,
              border: `1px solid ${primary}35`,
              borderRadius: '6px',
              mb: 3,
            }}
          >
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: primary, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              Official School Portal
            </Typography>
          </Box>

          <Typography
            sx={{
              fontSize: 'clamp(1.8rem, 3vw, 2.8rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              mb: 2.5,
              color: heroTextColor,
              letterSpacing: '-1px',
            }}
          >
            {school.schoolTagline || `Welcome to ${school.schoolName}`}
          </Typography>

          <Typography sx={{ color: subTextColor, fontSize: '0.95rem', lineHeight: 1.7, maxWidth: 420 }}>
            Powered by <Box component="span" sx={{ color: primary, fontWeight: 700 }}>SMS Edu Solutions</Box>: integrated school administration and learning services.
          </Typography>
        </Box>

        {/* Info Card */}
        {(school.schoolAddress || school.schoolEmail || school.schoolContact || school.schoolWebsite) && (
          <Box
            sx={{
              mt: 'auto',
              p: 2.5,
              borderRadius: '8px',
              background: isDarkBg
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(255,255,255,0.9)',
              border: isDarkBg
                ? '1px solid rgba(255,255,255,0.1)'
                : '1px solid rgba(0,0,0,0.08)',
            }}
          >
            {school.schoolAddress && (
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, mb: 1.5 }}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '6px',
                    bgcolor: `${primary}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <LocationOn sx={{ fontSize: 14, color: primary }} />
                </Box>
                <Typography sx={{ fontSize: '0.82rem', color: isDarkBg ? 'rgba(248,250,252,0.75)' : '#475569', lineHeight: 1.5, mt: 0.4 }}>
                  {school.schoolAddress}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {school.schoolEmail && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Email sx={{ fontSize: 13, color: primary }} />
                  <Typography sx={{ fontSize: '0.78rem', color: isDarkBg ? 'rgba(248,250,252,0.6)' : '#64748B', fontWeight: 500 }}>
                    {school.schoolEmail}
                  </Typography>
                </Box>
              )}
              {school.schoolContact && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Phone sx={{ fontSize: 13, color: primary }} />
                  <Typography sx={{ fontSize: '0.78rem', color: isDarkBg ? 'rgba(248,250,252,0.6)' : '#64748B', fontWeight: 500 }}>
                    {school.schoolContact}
                  </Typography>
                </Box>
              )}
              {school.schoolWebsite && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Language sx={{ fontSize: 13, color: primary }} />
                  <Typography
                    component="a"
                    href={school.schoolWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ fontSize: '0.78rem', color: primary, fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                  >
                    {school.schoolWebsite.replace(/^https?:\/\//, '')}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default SchoolBrandingPanel;
