import React from 'react';
import { Box, Container, Typography, Button, Stack } from '@mui/material';
import {
  ArrowForward,
  PlayCircleOutline,
  School,
  VerifiedUser,
  Security,
  CloudDone,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Interactive3DMockup } from './Interactive3DMockup';
import { useLandingTheme } from '../context/LandingThemeContext';

interface HeroSectionProps {
  onOpenDemo: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenDemo }) => {
  const navigate = useNavigate();
  const { isDark } = useLandingTheme();

  return (
    <Box
      sx={{
        position: 'relative',
        pt: { xs: 14, md: 17 },
        pb: { xs: 8, md: 12 },
        bgcolor: isDark ? '#0B0F19' : '#FFFFFF',
        borderBottom: isDark ? '1px solid #1E293B' : '1px solid #E2E8F0',
        transition: 'background-color 0.25s ease, border-color 0.25s ease',
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1.15fr' },
            gap: { xs: 6, lg: 5 },
            alignItems: 'center',
          }}
        >
          {/* Left Column: Headings, Value proposition, CTA buttons */}
          <Box sx={{ zIndex: 10 }}>
            {/* Top Institutional Badge */}
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 1.6,
                py: 0.6,
                borderRadius: '6px',
                bgcolor: isDark ? 'rgba(2, 132, 199, 0.12)' : '#F1F5F9',
                border: isDark ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid #CBD5E1',
                mb: 2.5,
              }}
            >
              <School sx={{ color: isDark ? '#38BDF8' : '#0284C7', fontSize: 16 }} />
              <Typography
                sx={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: isDark ? '#38BDF8' : '#0F172A',
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                }}
              >
                Institutional ERP & Campus Management
              </Typography>
            </Box>

            {/* Direct Headline */}
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.2rem', sm: '3rem', md: '3.6rem', lg: '3.8rem' },
                fontWeight: 900,
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                color: isDark ? '#F8FAFC' : '#0F172A',
                mb: 2.5,
              }}
            >
              Enterprise School Management & Campus Administration
            </Typography>

            {/* Clear, Concrete Value Proposition */}
            <Typography
              sx={{
                fontSize: { xs: '1rem', sm: '1.12rem' },
                color: isDark ? '#94A3B8' : '#475569',
                lineHeight: 1.65,
                maxWidth: 580,
                mb: 4,
                fontWeight: 400,
              }}
            >
              A unified, cloud-hosted operating platform for schools and colleges across India.
              Automate student admissions, daily attendance, fee collections with digital receipts,
              examination gradebooks, and GPS student bus transport with dedicated role-based portals.
            </Typography>

            {/* CTA Buttons - Rectangular 6px radius */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ mb: 4 }}
            >
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/login')}
                endIcon={<ArrowForward />}
                sx={{
                  background: isDark ? '#0284C7 !important' : '#0F172A !important',
                  bgcolor: isDark ? '#0284C7 !important' : '#0F172A !important',
                  color: '#FFFFFF !important',
                  fontWeight: 700,
                  fontSize: '0.98rem',
                  borderRadius: '6px',
                  px: 3.5,
                  py: 1.3,
                  textTransform: 'none',
                  boxShadow: 'none',
                  border: isDark ? '1px solid #0284C7' : '1px solid #0F172A',
                  transition: 'background-color 0.2s ease, border-color 0.2s ease',
                  '&:hover': {
                    background: isDark ? '#0369A1 !important' : '#1E293B !important',
                    bgcolor: isDark ? '#0369A1 !important' : '#1E293B !important',
                    borderColor: isDark ? '#0369A1' : '#1E293B',
                    boxShadow: 'none',
                  },
                }}
              >
                Launch Portal Login
              </Button>

              <Button
                variant="outlined"
                size="large"
                onClick={onOpenDemo}
                startIcon={<PlayCircleOutline />}
                sx={{
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                  bgcolor: isDark ? '#111827' : '#FFFFFF',
                  color: isDark ? '#F8FAFC' : '#0F172A',
                  fontWeight: 700,
                  fontSize: '0.98rem',
                  borderRadius: '6px',
                  px: 3,
                  py: 1.3,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: isDark ? '#64748B' : '#94A3B8',
                    bgcolor: isDark ? '#1E293B' : '#F8FAFC',
                  },
                }}
              >
                Schedule Live Demo
              </Button>
            </Stack>

            {/* Factual Institutional Guarantees */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: { xs: 2, sm: 3 },
                pt: 2.5,
                borderTop: isDark ? '1px solid #1E293B' : '1px solid #E2E8F0',
              }}
            >
              {[
                { icon: <CloudDone sx={{ color: isDark ? '#38BDF8' : '#0284C7', fontSize: 18 }} />, label: 'Cloud Hosted (Zero Hardware)' },
                { icon: <VerifiedUser sx={{ color: '#10B981', fontSize: 18 }} />, label: 'DPDP Act, 2023 Compliant' },
                { icon: <Security sx={{ color: isDark ? '#94A3B8' : '#334155', fontSize: 18 }} />, label: 'Role-Based Access Control' },
              ].map((item) => (
                <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  {item.icon}
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: isDark ? '#94A3B8' : '#475569' }}>
                    {item.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Right Column: Device Mockup */}
          <Box>
            <Interactive3DMockup />
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

