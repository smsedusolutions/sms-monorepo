import React from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';
import {
  OpenInNew,
  Memory,
  ShieldOutlined,
  CloudQueue,
  SupportAgent,
} from '@mui/icons-material';
import { ThreeVLogo } from './BrandLogos';
import { use3DTilt } from '../hooks/use3DTilt';

export const ManagedBy3vSection: React.FC = () => {
  const { ref, style, glareStyle } = use3DTilt<HTMLDivElement>({
    maxRotation: 7,
    perspective: 1200,
    scale: 1.01,
  });

  const pillars = [
    {
      icon: <CloudQueue sx={{ fontSize: 24, color: '#38BDF8' }} />,
      title: 'High-Availability Cloud Architecture',
      description: 'Engineered on resilient distributed cloud clusters delivering 99.9% uptime and zero hardware overhead for educational campuses.',
    },
    {
      icon: <ShieldOutlined sx={{ fontSize: 24, color: '#818CF8' }} />,
      title: 'Zero-Trust Security & DPDP Compliance',
      description: 'End-to-end data encryption, automated multi-zone encrypted snapshots, and strict compliance with the Digital Personal Data Protection Act.',
    },
    {
      icon: <Memory sx={{ fontSize: 24, color: '#22D3EE' }} />,
      title: 'Sub-Second Database & Telemetry',
      description: 'Real-time WebSocket notifications, high-performance RFID muster logging, and low-latency school bus GPS tracking.',
    },
    {
      icon: <SupportAgent sx={{ fontSize: 24, color: '#C084FC' }} />,
      title: '24/7 Managed Operations & Support',
      description: 'Continuous proactive infrastructure monitoring, zero-downtime rolling updates, and priority enterprise technical support.',
    },
  ];

  return (
    <Box
      id="managed-by-3v"
      sx={{
        py: { xs: 10, md: 14 },
        position: 'relative',
        background: 'linear-gradient(180deg, #0B0F19 0%, #0F172A 100%)',
        color: '#FFFFFF',
        overflow: 'hidden',
        zIndex: 5,
      }}
    >
      {/* Background Tech Mesh & Glow Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '20%',
          left: '-10%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '10%',
          right: '-5%',
          width: 450,
          height: 450,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2 }}>
        {/* Top Company Header */}
        <Box sx={{ textAlign: 'center', maxWidth: 820, mx: 'auto', mb: 8 }}>
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1.5,
                px: 2.2,
                py: 0.7,
                borderRadius: '50px',
                bgcolor: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                mb: 3,
              }}
            >
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#38BDF8', boxShadow: '0 0 10px #38BDF8' }} />
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: '#7DD3FC', letterSpacing: '0.08em' }}>
                TECHNOLOGY & INFRASTRUCTURE PARTNER
              </Typography>
            </Box>
          </motion.div>

          {/* Logo Presentation from Image 2 */}
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
              ref={ref}
              style={style}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.04)',
                p: { xs: 2.5, sm: 3.5 },
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5)',
                mb: 2,
                position: 'relative',
              }}
            >
              {glareStyle && <Box style={glareStyle} />}
              <ThreeVLogo height={65} alt="3v TechWorks Logo" />
            </Box>

            <Typography
              sx={{
                fontSize: '0.85rem',
                fontWeight: 700,
                letterSpacing: '0.25em',
                color: '#94A3B8',
                textTransform: 'uppercase',
                mt: 1,
              }}
            >
              ENGINEERING THE FUTURE
            </Typography>
          </Box>

          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '2rem', sm: '2.8rem', md: '3.3rem' },
              fontWeight: 900,
              lineHeight: 1.15,
              mb: 2.5,
              background: 'linear-gradient(135deg, #FFFFFF 0%, #BAE6FD 50%, #38BDF8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Architected & Managed by 3v TechWorks
          </Typography>

          <Typography sx={{ fontSize: { xs: '1rem', sm: '1.15rem' }, color: '#94A3B8', lineHeight: 1.7 }}>
            SMS EDU SOLUTIONS is powered by <strong>3v TechWorks</strong>, a modern software
            engineering powerhouse specializing in enterprise cloud architecture, real-time data
            pipelines, and mission-critical educational platforms.
          </Typography>
        </Box>

        {/* 4 Pillars Grid with 3D Tilt */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 3,
            mb: 7,
          }}
        >
          {pillars.map((pillar, idx) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
            >
              <Box
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '20px',
                  p: 3.5,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.35s ease',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.06)',
                    borderColor: 'rgba(56, 189, 248, 0.4)',
                    transform: 'translateY(-6px)',
                    boxShadow: '0 20px 35px -10px rgba(56, 189, 248, 0.2)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '14px',
                    bgcolor: 'rgba(56, 189, 248, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2.5,
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                  }}
                >
                  {pillar.icon}
                </Box>
                <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', mb: 1.2, lineHeight: 1.3 }}>
                  {pillar.title}
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', color: '#94A3B8', lineHeight: 1.6, flex: 1 }}>
                  {pillar.description}
                </Typography>
              </Box>
            </motion.div>
          ))}
        </Box>

        {/* Bottom Banner with Website Link */}
        <Box
          sx={{
            bgcolor: 'rgba(56, 189, 248, 0.06)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: '24px',
            p: { xs: 3, sm: 4.5 },
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 3,
          }}
        >
          <Box>
            <Typography sx={{ fontSize: { xs: '1.1rem', sm: '1.3rem' }, fontWeight: 800, color: '#FFFFFF', mb: 0.5 }}>
              Ready to modernize your institution's digital infrastructure?
            </Typography>
            <Typography sx={{ fontSize: '0.9rem', color: '#94A3B8' }}>
              Built with precision by 3v TechWorks. Scalable for single campuses to statewide multi-school chains.
            </Typography>
          </Box>

          <Button
            component="a"
            href="https://3vtechworks.com"
            target="_blank"
            rel="noopener noreferrer"
            variant="contained"
            endIcon={<OpenInNew className="w-4 h-4" />}
            sx={{
              background: 'linear-gradient(135deg, #0284C7 0%, #06B6D4 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.95rem',
              borderRadius: '50px',
              px: 3.5,
              py: 1.3,
              textTransform: 'none',
              boxShadow: '0 8px 25px -4px rgba(6, 182, 212, 0.45)',
              whiteSpace: 'nowrap',
              '&:hover': {
                background: 'linear-gradient(135deg, #0369A1 0%, #0891B2 100%)',
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
