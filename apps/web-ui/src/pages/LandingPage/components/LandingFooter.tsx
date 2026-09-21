import React from 'react';
import { Box, Container, Typography, Link, Button, Divider } from '@mui/material';
import {
  Phone,
  Email,
  Language,
  ArrowUpward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { SmsEduLogo, ThreeVLogo } from './BrandLogos';

export const LandingFooter: React.FC = () => {
  const navigate = useNavigate();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Box
      id="contact"
      component="footer"
      sx={{
        bgcolor: '#0B0F19',
        color: '#94A3B8',
        pt: { xs: 8, md: 10 },
        pb: 4,
        position: 'relative',
        zIndex: 5,
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <Container maxWidth="xl">
        {/* ── HIGHLIGHT CONTACT BAR (from Image 1) ── */}
        <Box
          sx={{
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            p: { xs: 3, md: 4 },
            mb: 8,
            boxShadow: '0 15px 35px -10px rgba(0, 0, 0, 0.5)',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr 1fr 1.2fr' },
            gap: 3,
            alignItems: 'center',
          }}
        >
          {/* Phone Numbers from Image 1 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: '12px',
                bgcolor: 'rgba(99, 102, 241, 0.15)',
                color: '#818CF8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Phone sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                Direct Hotline
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography
                  component="a"
                  href="tel:+916361888927"
                  sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.98rem', textDecoration: 'none', '&:hover': { color: '#38BDF8' } }}
                >
                  6361888927
                </Typography>
                <Typography
                  component="a"
                  href="tel:+917259237030"
                  sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.98rem', textDecoration: 'none', '&:hover': { color: '#38BDF8' } }}
                >
                  72592 37030
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Support Email from Image 1 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: '12px',
                bgcolor: 'rgba(14, 165, 233, 0.15)',
                color: '#38BDF8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Email sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                Official Email
              </Typography>
              <Typography
                component="a"
                href="mailto:support@smsedusolutions.in"
                sx={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.92rem', textDecoration: 'none', wordBreak: 'break-all', '&:hover': { color: '#38BDF8' } }}
              >
                support@smsedusolutions.in
              </Typography>
            </Box>
          </Box>

          {/* Website from Image 1 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: '12px',
                bgcolor: 'rgba(16, 185, 129, 0.15)',
                color: '#34D399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Language sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                Web Domain
              </Typography>
              <Typography
                component="a"
                href="https://www.smsedusolutions.in"
                target="_blank"
                rel="noreferrer"
                sx={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.92rem', textDecoration: 'none', '&:hover': { color: '#38BDF8' } }}
              >
                www.smsedusolutions.in
              </Typography>
            </Box>
          </Box>

          {/* Slogan Right from Image 1: Technology for Tomorrow's Learners */}
          <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Typography
              sx={{
                fontSize: '1rem',
                fontWeight: 800,
                color: '#38BDF8',
                letterSpacing: '-0.01em',
              }}
            >
              Technology for Tomorrow's Learners
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>
              Transforming campuses with AI & Cloud
            </Typography>
          </Box>
        </Box>

        {/* Footer Navigation Columns */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: '2fr 1fr 1fr 1.5fr',
            },
            gap: 5,
            mb: 8,
          }}
        >
          {/* Brand Info */}
          <Box>
            <Box sx={{ mb: 2 }}>
              <SmsEduLogo size={42} variant="dark" />
            </Box>
            <Typography sx={{ fontSize: '0.88rem', color: '#94A3B8', lineHeight: 1.65, mb: 3, maxWidth: 360 }}>
              The comprehensive School Management System uniting students, educators, and families
              with cloud automation, real-time analytics, and mobile portals.
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <ThreeVLogo height={32} />
            </Box>
          </Box>

          {/* Quick Links */}
          <Box>
            <Typography sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.95rem', mb: 2.2 }}>
              Modules
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              {['Student Lifecycle', 'Attendance & Biometrics', 'Examinations & Grades', 'Fee Management', 'GPS Bus Tracking', 'Parents Portal'].map((item) => (
                <Typography
                  key={item}
                  component="a"
                  href="#features"
                  sx={{
                    color: '#94A3B8',
                    fontSize: '0.88rem',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                    '&:hover': { color: '#38BDF8' },
                  }}
                >
                  {item}
                </Typography>
              ))}
            </Box>
          </Box>

          {/* Legal & Compliance */}
          <Box>
            <Typography sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.95rem', mb: 2.2 }}>
              Compliance
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              {[
                { label: 'Privacy Policy', path: '/privacy' },
                { label: 'Terms of Service', path: '/terms' },
                { label: 'Data Rights (DPDP)', path: '/data-rights' },
                { label: 'Security Overview', path: '#managed-by-3v' },
              ].map((item) => (
                <Typography
                  key={item.label}
                  onClick={() => {
                    if (item.path.startsWith('/')) navigate(item.path);
                    else {
                      const el = document.querySelector(item.path);
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  sx={{
                    color: '#94A3B8',
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                    '&:hover': { color: '#38BDF8' },
                  }}
                >
                  {item.label}
                </Typography>
              ))}
            </Box>
          </Box>

          {/* Direct Login Card */}
          <Box
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '20px',
              p: 3,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1rem', mb: 0.8 }}>
                School Portal Access
              </Typography>
              <Typography sx={{ color: '#94A3B8', fontSize: '0.82rem', lineHeight: 1.5, mb: 2 }}>
                Already an affiliated school or registered parent? Sign in to access your dashboard.
              </Typography>
            </Box>

            <Button
              variant="contained"
              onClick={() => navigate('/login')}
              sx={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
                color: 'white',
                fontWeight: 800,
                borderRadius: '50px',
                py: 1.1,
                fontSize: '0.9rem',
                textTransform: 'none',
                boxShadow: '0 8px 20px -4px rgba(79, 70, 229, 0.4)',
              }}
            >
              Sign In to Portal
            </Button>
          </Box>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)', mb: 3.5 }} />

        {/* Bottom Sub-footer */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            fontSize: '0.8rem',
          }}
        >
          <Typography sx={{ fontSize: '0.8rem', color: '#64748B' }}>
            © {new Date().getFullYear()} SMS EDU SOLUTIONS. All rights reserved. Technology powered and managed by{' '}
            <Link
              href="https://3vtechworks.com"
              target="_blank"
              rel="noopener"
              sx={{ color: '#38BDF8', fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              3v TechWorks
            </Link>
            .
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              onClick={scrollToTop}
              size="small"
              startIcon={<ArrowUpward sx={{ fontSize: 16 }} />}
              sx={{
                color: '#94A3B8',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'none',
                '&:hover': { color: 'white' },
              }}
            >
              Back to Top
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};
