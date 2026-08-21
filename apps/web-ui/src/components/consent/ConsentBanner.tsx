/**
 * ConsentBanner — DPDP Act compliance component
 *
 * Displays a consent banner for non-essential data processors (Google Charts).
 * Only shown when the user has not yet made a consent decision.
 *
 * Decisions:
 *  - "Accept All"       → enables analytics/Google Charts
 *  - "Necessary Only"   → blocks non-essential scripts
 *
 * The banner itself is essential infrastructure and does not require consent.
 *
 * [LEGAL REVIEW REQUIRED] — Banner copy should be reviewed by a data protection
 * lawyer before production deployment.
 */

import React from 'react';
import {
  Box,
  Typography,
  Button,
  Fade,
  Paper,
  Divider,
  Chip,
} from '@mui/material';
import { Shield, Cookie, OpenInNew } from '@mui/icons-material';
import { useConsent } from './useConsent';
import { useNavigate } from 'react-router-dom';

const ConsentBanner: React.FC = () => {
  const { hasDecided, acceptAll, acceptNecessaryOnly } = useConsent();
  const navigate = useNavigate();

  if (hasDecided) return null;

  return (
    <Fade in timeout={800}>
      <Paper
        elevation={12}
        sx={{
          position: 'fixed',
          bottom: { xs: 0, sm: 24 },
          left: { xs: 0, sm: '50%' },
          transform: { xs: 'none', sm: 'translateX(-50%)' },
          width: { xs: '100%', sm: 'auto' },
          minWidth: { sm: 540 },
          maxWidth: { sm: 640 },
          zIndex: 9999,
          borderRadius: { xs: '16px 16px 0 0', sm: '16px' },
          overflow: 'hidden',
          border: '1px solid rgba(99,102,241,0.2)',
          background: 'linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%)',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 3,
            pt: 2.5,
            pb: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Cookie sx={{ color: 'white', fontSize: 18 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: 'white', lineHeight: 1.3 }}>
              Your Privacy Choices
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', mt: 0.2 }}>
              Under the Digital Personal Data Protection Act 2023 (India)
            </Typography>
          </Box>
          <Chip
            icon={<Shield sx={{ fontSize: 12 }} />}
            label="DPDP Act"
            size="small"
            sx={{
              ml: 'auto',
              fontSize: '0.6rem',
              fontWeight: 700,
              bgcolor: 'rgba(99,102,241,0.2)',
              color: '#A5B4FC',
              border: '1px solid rgba(99,102,241,0.3)',
              '& .MuiChip-icon': { color: '#A5B4FC' },
            }}
          />
        </Box>

        {/* Body */}
        <Box sx={{ px: 3, py: 2 }}>
          {/* [LEGAL REVIEW REQUIRED] Banner copy below */}
          <Typography sx={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.65, mb: 1.5 }}>
            We use <strong style={{ color: 'white' }}>necessary cookies</strong> to operate this platform (authentication, session management). We also use <strong style={{ color: 'white' }}>Google Charts</strong> to render dashboard analytics, which may send data to Google's servers.
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
            You may choose <em>Necessary Only</em> to block Google Charts without affecting platform functionality. Your choice is stored locally and can be changed at any time via the{' '}
            <Box
              component="span"
              onClick={() => navigate('/privacy')}
              sx={{
                color: '#A5B4FC',
                cursor: 'pointer',
                fontWeight: 600,
                textDecoration: 'underline',
                '&:hover': { color: '#C4B5FD' },
              }}
            >
              Privacy Policy
            </Box>
            .
          </Typography>

          {/* Third-party disclosure */}
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: '10px',
              bgcolor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', mb: 1, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Non-essential third parties (require consent)
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: '#F59E0B',
                  flexShrink: 0,
                }}
              />
              <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)', flex: 1 }}>
                <strong style={{ color: 'white' }}>Google Charts</strong> — Dashboard visualisations (gstatic.com)
              </Typography>
              <Box
                component="a"
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: '#A5B4FC', display: 'flex', alignItems: 'center' }}
              >
                <OpenInNew sx={{ fontSize: 12 }} />
              </Box>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)' }} />

        {/* Actions */}
        <Box
          sx={{
            px: 3,
            py: 2,
            display: 'flex',
            gap: 1.5,
            flexDirection: { xs: 'column', sm: 'row' },
          }}
        >
          <Button
            fullWidth
            variant="outlined"
            onClick={acceptNecessaryOnly}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.82rem',
              py: 1.2,
              borderColor: 'rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.7)',
              '&:hover': { borderColor: 'rgba(255,255,255,0.4)', bgcolor: 'rgba(255,255,255,0.05)' },
            }}
          >
            Necessary Only
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={acceptAll}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              py: 1.2,
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              boxShadow: '0 4px 16px rgba(99,102,241,0.45)',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(99,102,241,0.6)',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s',
            }}
          >
            Accept All
          </Button>
        </Box>
      </Paper>
    </Fade>
  );
};

export default ConsentBanner;
