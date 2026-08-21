/**
 * ConsentGatedChart — DPDP Act compliance wrapper
 *
 * Wraps react-google-charts <Chart> components so they only render
 * (and therefore contact gstatic.com) when the user has granted
 * analytics consent via the ConsentBanner.
 *
 * Minimal, clean styling with neutral tones.
 */

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { BarChart, Lock } from '@mui/icons-material';
import { useConsent } from './useConsent';
import { useNavigate } from 'react-router-dom';

interface ConsentGatedChartProps {
  /** Pixel/string height to maintain layout when chart is blocked */
  height?: number | string;
  children: React.ReactNode;
}

const ConsentGatedChart: React.FC<ConsentGatedChartProps> = ({
  height = 260,
  children,
}) => {
  const { hasAnalyticsConsent, hasDecided, acceptAll } = useConsent();
  const navigate = useNavigate();

  if (hasAnalyticsConsent) {
    return <>{children}</>;
  }

  const message = hasDecided
    ? 'Analytics charts are disabled (Necessary Only consent).'
    : 'Please choose your privacy preferences to enable charts.';

  return (
    <Box
      sx={{
        height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.2,
        bgcolor: '#f8fafc',
        border: '1px dashed #cbd5e1',
        borderRadius: '10px',
        p: 3,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '8px',
          bgcolor: '#f1f5f9',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {hasDecided ? (
          <BarChart sx={{ color: '#475569', fontSize: 20 }} />
        ) : (
          <Lock sx={{ color: '#475569', fontSize: 20 }} />
        )}
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a', mb: 0.3 }}>
          {hasDecided ? 'Chart Hidden' : 'Consent Required'}
        </Typography>
        <Typography sx={{ fontSize: '0.78rem', color: '#64748b', maxWidth: 260, lineHeight: 1.5 }}>
          {message}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', mt: 0.5 }}>
        {!hasDecided && (
          <Button
            size="small"
            variant="contained"
            onClick={acceptAll}
            sx={{
              borderRadius: '6px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.75rem',
              bgcolor: '#0f172a',
              color: '#ffffff',
              boxShadow: 'none',
              '&:hover': { bgcolor: '#1e293b', boxShadow: 'none' },
            }}
          >
            Accept Analytics
          </Button>
        )}
        <Button
          size="small"
          variant="outlined"
          onClick={() => navigate('/privacy#consent')}
          sx={{
            borderRadius: '6px',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.75rem',
            borderColor: '#cbd5e1',
            color: '#475569',
            '&:hover': { borderColor: '#94a3b8', bgcolor: '#ffffff' },
          }}
        >
          {hasDecided ? 'Change Preferences' : 'Privacy Policy'}
        </Button>
      </Box>
    </Box>
  );
};

export default ConsentGatedChart;
