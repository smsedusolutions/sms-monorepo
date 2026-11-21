import React from 'react';
import { Box, Typography, Fade } from '@mui/material';
import { VerifiedUser } from '@mui/icons-material';
import type { SchoolBranding } from '../../hooks/useSubdomainSchool';

interface SchoolHeaderBadgeProps {
  school: SchoolBranding | null;
}

/**
 * Premium badge shown above the login form.
 * Displays school logo + name with a verified indicator.
 */
const SchoolHeaderBadge: React.FC<SchoolHeaderBadgeProps> = ({ school }) => {
  if (!school) return null;

  const primary = school.loginTheme?.primaryColor || '#6366F1';

  return (
    <Fade in timeout={500}>
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1.25,
          mb: 4,
          px: 1.5,
          py: 1,
          bgcolor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)',
          width: 'fit-content',
          transition: 'box-shadow 0.2s',
          '&:hover': {
            boxShadow: `0 4px 20px rgba(0,0,0,0.1), 0 0 0 2px ${primary}30`,
          },
        }}
      >
        {/* School logo */}
        {school.schoolLogo ? (
          <Box
            component="img"
            src={school.schoolLogo}
            alt={school.schoolName}
            sx={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              objectFit: 'contain',
              bgcolor: '#F8FAFC',
              p: '3px',
              border: '1.5px solid rgba(0,0,0,0.06)',
            }}
          />
        ) : (
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${primary} 0%, ${primary}CC 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 900,
              fontSize: '0.8rem',
              flexShrink: 0,
            }}
          >
            {school.schoolName[0]?.toUpperCase()}
          </Box>
        )}

        {/* Divider */}
        <Box sx={{ width: '1px', height: 16, bgcolor: '#E2E8F0' }} />

        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '0.82rem',
            color: '#1E293B',
            letterSpacing: '-0.2px',
            lineHeight: 1,
            maxWidth: 200,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {school.schoolName}
        </Typography>

        {/* Verified badge */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.4,
            px: 0.75,
            py: 0.3,
            bgcolor: `${primary}12`,
            borderRadius: '10px',
          }}
        >
          <VerifiedUser sx={{ fontSize: 11, color: primary }} />
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: primary, letterSpacing: '0.03em' }}>
            Official
          </Typography>
        </Box>
      </Box>
    </Fade>
  );
};

export default SchoolHeaderBadge;
