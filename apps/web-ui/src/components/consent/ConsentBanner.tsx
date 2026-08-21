/**
 * ConsentBanner — DPDP Act Compliance Component
 *
 * Professional bottom-docked privacy consent banner modeled after
 * modern enterprise standards (Stripe, Vercel, GitHub, Apple).
 *
 * Only shown until the user makes a consent decision.
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Slide,
  Paper,
  Chip,
  Collapse,
} from '@mui/material';
import {
  ShieldOutlined as ShieldIcon,
  CookieOutlined as CookieIcon,
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowUp as ArrowUpIcon,
  OpenInNew as ExternalIcon,
} from '@mui/icons-material';
import { useConsent } from './useConsent';
import { useNavigate } from 'react-router-dom';

const ConsentBanner: React.FC = () => {
  const { hasDecided, acceptAll, acceptNecessaryOnly } = useConsent();
  const [showDetails, setShowDetails] = useState(false);
  const navigate = useNavigate();

  if (hasDecided) return null;

  return (
    <Slide direction="up" in mountOnEnter unmountOnExit timeout={400}>
      <Paper
        elevation={0}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 99999,
          bgcolor: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid #e2e8f0',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.08), 0 -2px 6px rgba(0, 0, 0, 0.02)',
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 2, sm: 2.2 },
        }}
      >
        <Box
          sx={{
            maxWidth: 1320,
            mx: 'auto',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'stretch', md: 'center' },
            justifyContent: 'space-between',
            gap: { xs: 2, md: 3 },
          }}
        >
          {/* Left: Info section */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flex: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                bgcolor: '#f1f5f9',
                border: '1px solid #e2e8f0',
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: '#334155',
                mt: 0.2,
              }}
            >
              <CookieIcon sx={{ fontSize: 22 }} />
            </Box>

            <Box sx={{ flex: 1 }}>
              {/* Header line */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '0.92rem', sm: '0.98rem' },
                    color: '#0f172a',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Privacy & Cookie Preferences
                </Typography>
                <Chip
                  icon={<ShieldIcon sx={{ fontSize: '12px !important', color: '#475569' }} />}
                  label="DPDP Act 2023 Compliant"
                  size="small"
                  sx={{
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    bgcolor: '#f8fafc',
                    color: '#475569',
                    border: '1px solid #e2e8f0',
                    height: 22,
                  }}
                />
              </Box>

              {/* Description */}
              <Typography
                sx={{
                  fontSize: { xs: '0.8rem', sm: '0.84rem' },
                  color: '#475569',
                  lineHeight: 1.55,
                  maxWidth: { md: 780, lg: 900 },
                }}
              >
                We use essential cookies for secure login and session management. We also use Google Charts for analytics visualizations. You can choose to accept all or keep only essential cookies.{' '}
                <Box
                  component="span"
                  onClick={() => navigate('/privacy')}
                  sx={{
                    color: '#2563eb',
                    cursor: 'pointer',
                    fontWeight: 600,
                    textDecoration: 'underline',
                    '&:hover': { color: '#1d4ed8' },
                  }}
                >
                  Privacy Policy
                </Box>
                .
              </Typography>

              {/* Collapsible Details */}
              <Collapse in={showDetails}>
                <Box
                  sx={{
                    mt: 1.5,
                    p: 1.5,
                    borderRadius: '8px',
                    bgcolor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    maxWidth: 780,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      mb: 0.8,
                    }}
                  >
                    Non-Essential Processors (Requires Consent)
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#f59e0b' }} />
                      <Typography sx={{ fontSize: '0.78rem', color: '#334155' }}>
                        <strong style={{ color: '#0f172a' }}>Google Charts</strong> — Dashboard visual analytics & charts (gstatic.com)
                      </Typography>
                    </Box>
                    <Box
                      component="a"
                      href="https://policies.google.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        fontSize: '0.72rem',
                        textDecoration: 'none',
                        '&:hover': { color: '#0f172a' },
                      }}
                    >
                      Policy <ExternalIcon sx={{ fontSize: 12 }} />
                    </Box>
                  </Box>
                </Box>
              </Collapse>

              {/* Toggle details text button */}
              <Typography
                component="button"
                onClick={() => setShowDetails(prev => !prev)}
                sx={{
                  mt: 0.6,
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  color: '#64748b',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.3,
                  '&:hover': { color: '#0f172a' },
                }}
              >
                {showDetails ? 'Hide details' : 'View details'}
                {showDetails ? <ArrowUpIcon sx={{ fontSize: 14 }} /> : <ArrowDownIcon sx={{ fontSize: 14 }} />}
              </Typography>
            </Box>
          </Box>

          {/* Right: Actions */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              flexShrink: 0,
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            <Button
              fullWidth
              variant="outlined"
              onClick={acceptNecessaryOnly}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.84rem',
                py: 1,
                px: { xs: 2, sm: 2.5 },
                borderColor: '#cbd5e1',
                color: '#334155',
                bgcolor: '#ffffff',
                minWidth: { sm: 140 },
                '&:hover': {
                  borderColor: '#94a3b8',
                  bgcolor: '#f8fafc',
                },
              }}
            >
              Necessary Only
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={acceptAll}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.84rem',
                py: 1,
                px: { xs: 2, sm: 3 },
                bgcolor: '#2563eb',
                color: '#ffffff',
                boxShadow: 'none',
                minWidth: { sm: 130 },
                '&:hover': {
                  bgcolor: '#1d4ed8',
                  boxShadow: 'none',
                },
              }}
            >
              Accept All
            </Button>
          </Box>
        </Box>
      </Paper>
    </Slide>
  );
};

export default ConsentBanner;
