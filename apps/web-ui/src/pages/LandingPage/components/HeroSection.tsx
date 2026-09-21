import React from 'react';
import { Box, Container, Typography, Button, Stack } from '@mui/material';
import { motion } from 'framer-motion';
import {
  ArrowForward,
  PlayCircleOutline,
  AutoAwesome,
  VerifiedUser,
  Speed,
  CloudDone,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Interactive3DMockup } from './Interactive3DMockup';

interface HeroSectionProps {
  onOpenDemo: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenDemo }) => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        position: 'relative',
        pt: { xs: 15, md: 19 },
        pb: { xs: 8, md: 14 },
        overflow: 'hidden',
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1.15fr' },
            gap: { xs: 6, lg: 4 },
            alignItems: 'center',
          }}
        >
          {/* Left Column: Headings, Value proposition, CTA buttons */}
          <Box sx={{ zIndex: 10 }}>
            {/* Top Pill / Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1.2,
                  px: 2,
                  py: 0.7,
                  borderRadius: '50px',
                  bgcolor: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  boxShadow: '0 4px 15px rgba(99, 102, 241, 0.12)',
                  mb: 2.5,
                }}
              >
                <AutoAwesome sx={{ color: '#4F46E5', fontSize: 16 }} />
                <Typography
                  sx={{
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    color: '#4F46E5',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  MANAGE • CONNECT • GROW
                </Typography>
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: '#10B981',
                  }}
                />
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#059669' }}>
                  Next-Gen 2026 ERP
                </Typography>
              </Box>
            </motion.div>

            {/* Main Headline from Image 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.4rem', sm: '3.3rem', md: '3.9rem', lg: '4.2rem' },
                  fontWeight: 900,
                  lineHeight: 1.08,
                  letterSpacing: '-0.035em',
                  color: '#0F172A',
                  mb: 2,
                }}
              >
                Simplifying School Management for a{' '}
                <Box
                  component="span"
                  sx={{
                    background: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 50%, #3B82F6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    display: 'inline-block',
                  }}
                >
                  Brighter Tomorrow
                </Box>
              </Typography>
            </motion.div>

            {/* Subheading from Image 1 ("Empowering Education") */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Typography
                sx={{
                  fontSize: { xs: '1.05rem', sm: '1.2rem' },
                  color: '#475569',
                  lineHeight: 1.6,
                  maxWidth: 580,
                  mb: 3.5,
                  fontWeight: 500,
                }}
              >
                <strong style={{ color: '#4F46E5' }}>Empowering Education.</strong> SMS EDU SOLUTIONS
                delivers an all-in-one, cloud-powered digital ecosystem uniting schools, teachers,
                students, and parents with live attendance, fee automation, exam analytics, and GPS transport.
              </Typography>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
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
                    background: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '1.05rem',
                    borderRadius: '50px',
                    px: 3.8,
                    py: 1.4,
                    textTransform: 'none',
                    boxShadow: '0 12px 28px -6px rgba(79, 70, 229, 0.5)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 18px 36px -6px rgba(79, 70, 229, 0.65)',
                      background: 'linear-gradient(135deg, #4338CA 0%, #0284C7 100%)',
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
                    borderColor: '#CBD5E1',
                    bgcolor: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    color: '#1E293B',
                    fontWeight: 700,
                    fontSize: '1.02rem',
                    borderRadius: '50px',
                    px: 3.2,
                    py: 1.4,
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: '#4F46E5',
                      color: '#4F46E5',
                      bgcolor: 'rgba(79, 70, 229, 0.05)',
                    },
                  }}
                >
                  Schedule Live Demo
                </Button>
              </Stack>
            </motion.div>

            {/* Trust Pill Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: { xs: 2, sm: 3 },
                  pt: 2.5,
                  borderTop: '1px solid rgba(226, 232, 240, 0.8)',
                }}
              >
                {[
                  { icon: <CloudDone sx={{ color: '#0284C7', fontSize: 18 }} />, label: '100% Cloud Native' },
                  { icon: <VerifiedUser sx={{ color: '#10B981', fontSize: 18 }} />, label: 'DPDP Act Compliant' },
                  { icon: <Speed sx={{ color: '#F59E0B', fontSize: 18 }} />, label: 'Sub-Second Speeds' },
                ].map((item) => (
                  <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    {item.icon}
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>
                      {item.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </motion.div>
          </Box>

          {/* Right Column: 3D Animated Device Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <Interactive3DMockup />
          </motion.div>
        </Box>
      </Container>
    </Box>
  );
};
