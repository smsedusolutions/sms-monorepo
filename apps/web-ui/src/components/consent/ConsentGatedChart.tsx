/**
 * ConsentGatedChart — DPDP Act compliance wrapper
 *
 * Wraps react-google-charts <Chart> components so they only render
 * (and therefore contact gstatic.com) when the user has granted
 * analytics consent via the ConsentBanner.
 *
 * When consent is not granted, a privacy-friendly placeholder is shown
 * so the UI layout is preserved.
 *
 * Usage:
 *   <ConsentGatedChart height={260}>
 *     <Chart chartType="ColumnChart" data={...} />
 *   </ConsentGatedChart>
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
    // Consent granted — render the chart normally
    return <>{children}</>;
  }

  // Consent not granted — show placeholder
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
        gap: 1.5,
        bgcolor: 'rgba(99,102,241,0.04)',
        border: '1px dashed rgba(99,102,241,0.25)',
        borderRadius: '12px',
        p: 3,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: '12px',
          bgcolor: 'rgba(99,102,241,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {hasDecided ? (
          <BarChart sx={{ color: '#6366F1', fontSize: 22 }} />
        ) : (
          <Lock sx={{ color: '#6366F1', fontSize: 22 }} />
        )}
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#374151', mb: 0.5 }}>
          {hasDecided ? 'Chart Hidden' : 'Consent Required'}
        </Typography>
        <Typography sx={{ fontSize: '0.78rem', color: '#64748B', maxWidth: 240, lineHeight: 1.5 }}>
          {message}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
        {!hasDecided && (
          <Button
            size="small"
            variant="contained"
            onClick={acceptAll}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.75rem',
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
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
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.75rem',
            borderColor: '#6366F1',
            color: '#6366F1',
          }}
        >
          {hasDecided ? 'Change Preferences' : 'Privacy Policy'}
        </Button>
      </Box>
    </Box>
  );
};

export default ConsentGatedChart;
