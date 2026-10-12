import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import {
  Security,
  CloudDone,
  Devices,
  Diversity3,
} from '@mui/icons-material';
import { useLandingTheme } from '../context/LandingThemeContext';

interface BadgeItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accent: string;
  isDark: boolean;
}

const SingleBadgeCard: React.FC<BadgeItemProps> = ({ icon, title, subtitle, accent, isDark }) => {
  return (
    <Box
      sx={{
        borderRadius: '8px',
        bgcolor: isDark ? '#111827' : '#FFFFFF',
        p: { xs: 2.5, sm: 3 },
        border: isDark ? '1px solid #1F2937' : '1px solid #E2E8F0',
        boxShadow: isDark ? '0 4px 12px rgba(0, 0, 0, 0.25)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.25s ease',
        '&:hover': {
          borderColor: accent,
          boxShadow: isDark ? '0 6px 20px rgba(0, 0, 0, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.06)',
        },
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: '6px',
          bgcolor: isDark ? `${accent}22` : `${accent}14`,
          color: accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>

      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: isDark ? '#F8FAFC' : '#0F172A', lineHeight: 1.25, mb: 0.4 }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: '0.82rem', color: isDark ? '#94A3B8' : '#64748B', lineHeight: 1.45 }}>
          {subtitle}
        </Typography>
      </Box>
    </Box>
  );
};

export const TrustBadges: React.FC = () => {
  const { isDark } = useLandingTheme();

  const badges = [
    {
      icon: <Security sx={{ fontSize: 26 }} />,
      title: 'Secure & Reliable',
      subtitle: 'Data encryption, DPDP Act compliance, role-based access control.',
      accent: '#0284C7',
    },
    {
      icon: <CloudDone sx={{ fontSize: 26 }} />,
      title: 'Cloud Hosted',
      subtitle: 'Continuous availability with zero on-premise servers or maintenance overhead.',
      accent: '#38BDF8',
    },
    {
      icon: <Devices sx={{ fontSize: 26 }} />,
      title: 'Multi-Device Access',
      subtitle: 'Optimized responsive access across Laptops, Tablets, and Mobile Phones.',
      accent: isDark ? '#CBD5E1' : '#0F172A',
    },
    {
      icon: <Diversity3 sx={{ fontSize: 26 }} />,
      title: 'Built for Campuses',
      subtitle: 'Tailored portals for Principals, Teachers, Students, and Parents.',
      accent: '#10B981',
    },
  ];

  return (
    <Box
      sx={{
        py: { xs: 5, md: 7 },
        bgcolor: isDark ? '#0F172A' : '#F8FAFC',
        borderBottom: isDark ? '1px solid #1E293B' : '1px solid #E2E8F0',
        transition: 'background-color 0.25s ease, border-color 0.25s ease',
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
            gap: 2.5,
          }}
        >
          {badges.map((b) => (
            <SingleBadgeCard key={b.title} {...b} isDark={isDark} />
          ))}
        </Box>
      </Container>
    </Box>
  );
};
