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
        {/* ── HIGHLIGHT CONTACT BAR ── */}
        <Box
          sx={{
            borderRadius: '8px',
            bgcolor: '#111827',
            border: '1px solid #1F2937',
            p: { xs: 3, md: 3.5 },
            mb: 7,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr 1fr 1.2fr' },
            gap: 3,
            alignItems: 'center',
          }}
        >
          {/* Phone Numbers */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '6px',
                bgcolor: 'rgba(2, 132, 199, 0.15)',
                color: '#38BDF8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Phone sx={{ fontSize: 22 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                Direct Hotline
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography
                  component="a"
                  href="tel:+916361888927"
                  sx={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none', '&:hover': { color: '#38BDF8' } }}
                >
                  6361888927
                </Typography>
                <Typography
                  component="a"
                  href="tel:+917259237030"
                  sx={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none', '&:hover': { color: '#38BDF8' } }}
                >
                  72592 37030
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Support Email */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '6px',
                bgcolor: 'rgba(14, 165, 233, 0.15)',
                color: '#38BDF8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Email sx={{ fontSize: 22 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                Official Email
              </Typography>
              <Typography
                component="a"
                href="mailto:support@smsedusolutions.in"
                sx={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none', wordBreak: 'break-all', '&:hover': { color: '#38BDF8' } }}
              >
                support@smsedusolutions.in
              </Typography>
            </Box>
          </Box>

          {/* Website */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '6px',
                bgcolor: 'rgba(16, 185, 129, 0.15)',
                color: '#34D399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Language sx={{ fontSize: 22 }} />
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
                sx={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none', '&:hover': { color: '#38BDF8' } }}
              >
                www.smsedusolutions.in
              </Typography>
            </Box>
          </Box>

          {/* Slogan */}
          <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Typography
              sx={{
                fontSize: '0.95rem',
                fontWeight: 800,
                color: '#38BDF8',
              }}
            >
              Technology for Tomorrow's Learners
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>
              Cloud Management Platform for Educational Institutions
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
            mb: 7,
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
              <ThreeVLogo height={30} />
            </Box>
          </Box>

          {/* Quick Links */}
          <Box>
            <Typography sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.95rem', mb: 2 }}>
              Modules
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              {['Student Lifecycle', 'Attendance & Biometrics', 'Examinations & Grades', 'Fee Management', 'GPS Bus Tracking', 'Parent Portal'].map((item) => (
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
            <Typography sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.95rem', mb: 2 }}>
              Legal & Compliance
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              {[
                { label: 'Privacy Policy', path: '/privacy-policy' },
                { label: 'Terms & Conditions', path: '/terms-and-conditions' },
                { label: 'Data Rights (DPDP Act)', path: '/data-rights' },
                { label: 'Infrastructure & Security', path: '#managed-by-3v' },
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
              bgcolor: '#111827',
              borderRadius: '8px',
              p: 3,
              border: '1px solid #1F2937',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '0.98rem', mb: 0.8 }}>
                School Portal Access
              </Typography>
              <Typography sx={{ color: '#94A3B8', fontSize: '0.82rem', lineHeight: 1.5, mb: 2 }}>
                Affiliated school administrators, teachers, and parents can sign in below.
              </Typography>
            </Box>

            <Button
              variant="contained"
              onClick={() => navigate('/login')}
              sx={{
                background: '#0284C7 !important',
                bgcolor: '#0284C7 !important',
                color: 'white !important',
                fontWeight: 700,
                borderRadius: '6px',
                py: 1.1,
                fontSize: '0.9rem',
                textTransform: 'none',
                boxShadow: 'none',
                '&:hover': {
                  background: '#0369A1 !important',
                  bgcolor: '#0369A1 !important',
                  boxShadow: 'none',
                },
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
