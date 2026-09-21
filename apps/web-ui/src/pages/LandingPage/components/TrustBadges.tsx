import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import {
  Security,
  CloudDone,
  Devices,
  Diversity3,
} from '@mui/icons-material';
import { use3DTilt } from '../hooks/use3DTilt';

interface BadgeItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accent: string;
}

const SingleBadgeCard: React.FC<BadgeItemProps> = ({ icon, title, subtitle, accent }) => {
  const { ref, style, glareStyle } = use3DTilt<HTMLDivElement>({
    maxRotation: 10,
    perspective: 900,
    scale: 1.03,
  });

  return (
    <Box
      ref={ref}
      style={style}
      sx={{
        position: 'relative',
        borderRadius: '18px',
        bgcolor: '#FFFFFF',
        p: { xs: 2.5, sm: 3 },
        border: '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: '0 8px 24px -6px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: accent,
          boxShadow: `0 16px 32px -10px ${accent}30`,
        },
      }}
    >
      {glareStyle && <Box style={glareStyle} />}

      <Box
        sx={{
          width: 52,
          height: 52,
          borderRadius: '14px',
          bgcolor: `${accent}14`,
          color: accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: `0 4px 12px ${accent}25`,
        }}
      >
        {icon}
      </Box>

      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: '1.02rem', color: '#0F172A', lineHeight: 1.25, mb: 0.3 }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: '0.8rem', color: '#64748B', lineHeight: 1.4 }}>
          {subtitle}
        </Typography>
      </Box>
    </Box>
  );
};

export const TrustBadges: React.FC = () => {
  const badges: BadgeItemProps[] = [
    {
      icon: <Security sx={{ fontSize: 28 }} />,
      title: 'Secure & Reliable',
      subtitle: 'Bank-grade encryption, DPDP compliance, role-based access control.',
      accent: '#0284C7',
    },
    {
      icon: <CloudDone sx={{ fontSize: 28 }} />,
      title: 'Cloud Based',
      subtitle: '99.9% high availability, zero on-premise servers or maintenance fees.',
      accent: '#06B6D4',
    },
    {
      icon: <Devices sx={{ fontSize: 28 }} />,
      title: 'Access Anytime, Anywhere',
      subtitle: 'Seamless responsive performance on Laptops, Tablets, and Mobile Phones.',
      accent: '#4F46E5',
    },
    {
      icon: <Diversity3 sx={{ fontSize: 28 }} />,
      title: 'Built for Everyone',
      subtitle: 'Tailored dashboards for Principals, Teachers, Students & Parents.',
      accent: '#8B5CF6',
    },
  ];

  return (
    <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: 'rgba(248, 250, 252, 0.6)' }}>
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
            <SingleBadgeCard key={b.title} {...b} />
          ))}
        </Box>
      </Container>
    </Box>
  );
};
