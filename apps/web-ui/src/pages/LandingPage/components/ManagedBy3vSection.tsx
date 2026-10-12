import React from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import {
  OpenInNew,
  Memory,
  ShieldOutlined,
  CloudQueue,
  SupportAgent,
} from '@mui/icons-material';
import { ThreeVLogo } from './BrandLogos';

export const ManagedBy3vSection: React.FC = () => {
  const pillars = [
    {
      icon: <CloudQueue sx={{ fontSize: 24, color: '#38BDF8' }} />,
      title: 'High-Availability Cloud Architecture',
      description: 'Distributed cloud architecture designed for high availability, automatic scaling, and zero hardware maintenance for campuses.',
    },
    {
      icon: <ShieldOutlined sx={{ fontSize: 24, color: '#38BDF8' }} />,
      title: 'Zero-Trust Security & DPDP Compliance',
      description: 'Role-based access control, encrypted backups, and full compliance with India’s Digital Personal Data Protection Act, 2023.',
    },
    {
      icon: <Memory sx={{ fontSize: 24, color: '#0284C7' }} />,
      title: 'Real-Time Telemetry & Sync',
      description: 'Real-time WebSocket alerts, responsive biometric attendance logging, and reliable GPS student bus telemetry.',
    },
    {
      icon: <SupportAgent sx={{ fontSize: 24, color: '#0284C7' }} />,
      title: 'Managed Operations & Support',
      description: 'Continuous infrastructure monitoring, zero-downtime application updates, and dedicated technical support.',
    },
  ];

  return (
    <Box
      id="managed-by-3v"
      sx={{
        py: { xs: 8, md: 12 },
        bgcolor: '#0B0F19',
        color: '#FFFFFF',
        borderBottom: '1px solid #1E293B',
      }}
    >
      <Container maxWidth="xl">
        {/* Top Company Header */}
        <Box sx={{ textAlign: 'center', maxWidth: 820, mx: 'auto', mb: 7 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1.2,
              px: 1.8,
              py: 0.6,
              borderRadius: '6px',
              bgcolor: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              mb: 3,
            }}
          >
            <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: '#38BDF8' }} />
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: '#7DD3FC', letterSpacing: '0.06em' }}>
              TECHNOLOGY & INFRASTRUCTURE PARTNER
            </Typography>
          </Box>

          {/* Logo Presentation */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <Box
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.04)',
                p: { xs: 2.5, sm: 3 },
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                mb: 1.5,
              }}
            >
              <ThreeVLogo height={60} alt="3v TechWorks Logo" />
            </Box>

            <Typography
              sx={{
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '0.2em',
                color: '#94A3B8',
                textTransform: 'uppercase',
              }}
            >
              ENGINEERING THE FUTURE
            </Typography>
          </Box>

          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '1.9rem', sm: '2.5rem', md: '3rem' },
              fontWeight: 900,
              lineHeight: 1.15,
              mb: 2,
              color: '#FFFFFF',
            }}
          >
            Architected & Managed by 3v TechWorks
          </Typography>

          <Typography sx={{ fontSize: { xs: '0.98rem', sm: '1.1rem' }, color: '#94A3B8', lineHeight: 1.65 }}>
            SMS EDU SOLUTIONS is engineered and supported by <strong>3v TechWorks</strong>, delivering
            enterprise cloud systems, secure database infrastructure, and robust educational applications.
          </Typography>
        </Box>

        {/* 4 Pillars Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 2.5,
            mb: 6,
          }}
        >
          {pillars.map((pillar) => (
            <Box
              key={pillar.title}
              sx={{
                bgcolor: '#111827',
                border: '1px solid #1F2937',
                borderRadius: '8px',
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'border-color 0.2s ease',
                '&:hover': {
                  borderColor: '#38BDF8',
                },
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '6px',
                  bgcolor: 'rgba(56, 189, 248, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                }}
              >
                {pillar.icon}
              </Box>
              <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', mb: 1, lineHeight: 1.3 }}>
                {pillar.title}
              </Typography>
              <Typography sx={{ fontSize: '0.82rem', color: '#94A3B8', lineHeight: 1.55, flex: 1 }}>
                {pillar.description}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Bottom Banner with Website Link */}
        <Box
          sx={{
            bgcolor: '#111827',
            border: '1px solid #1F2937',
            borderRadius: '8px',
            p: { xs: 3, sm: 4 },
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2.5,
          }}
        >
          <Box>
            <Typography sx={{ fontSize: { xs: '1.05rem', sm: '1.2rem' }, fontWeight: 800, color: '#FFFFFF', mb: 0.5 }}>
              Enterprise Digital Infrastructure for Schools
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', color: '#94A3B8' }}>
              Engineered with reliability by 3v TechWorks. Scalable for independent schools to multi-campus networks.
            </Typography>
          </Box>

          <Button
            component="a"
            href="https://3vtechworks.com"
            target="_blank"
            rel="noopener noreferrer"
            variant="contained"
            endIcon={<OpenInNew sx={{ fontSize: 16 }} />}
            sx={{
              background: '#0284C7 !important',
              bgcolor: '#0284C7 !important',
              color: '#FFFFFF !important',
              fontWeight: 700,
              fontSize: '0.92rem',
              borderRadius: '6px',
              px: 3.2,
              py: 1.2,
              textTransform: 'none',
              boxShadow: 'none',
              whiteSpace: 'nowrap',
              '&:hover': {
                background: '#0369A1 !important',
                bgcolor: '#0369A1 !important',
                boxShadow: 'none',
              },
            }}
          >
            Visit 3vtechworks.com
          </Button>
        </Box>
      </Container>
    </Box>
  );
};
