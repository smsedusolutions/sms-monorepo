import React from 'react';
import { Box, Typography } from '@mui/material';
import smsLogoImg from '../../../assets/logo/smslogo.png';
import threeVLogoImg from '../../../assets/logo/3vlogobright.png';

interface SmsLogoProps {
  size?: number;
  showText?: boolean;
  variant?: 'light' | 'dark';
}

export const SmsEduLogo: React.FC<SmsLogoProps> = ({
  size = 48,
  showText = true,
  variant = 'light',
}) => {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, textDecoration: 'none' }}>
      {/* Official SMS Logo Image */}
      <Box
        component="img"
        src={smsLogoImg}
        alt="SMS Edu Solutions"
        sx={{
          height: size,
          width: 'auto',
          maxHeight: size,
          objectFit: 'contain',
          filter: 'drop-shadow(0 4px 12px rgba(99, 102, 241, 0.35))',
          flexShrink: 0,
          transition: 'transform 0.25s ease',
          '&:hover': {
            transform: 'scale(1.05)',
          },
        }}
      />

      {showText && (
        <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.6 }}>
            <Typography
              component="span"
              sx={{
                fontWeight: 900,
                fontSize: size > 40 ? '1.45rem' : '1.2rem',
                letterSpacing: '-0.03em',
                background: variant === 'dark'
                  ? 'linear-gradient(135deg, #FFFFFF 0%, #BAE6FD 100%)'
                  : 'linear-gradient(135deg, #1E1B4B 0%, #4338CA 50%, #0284C7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1,
              }}
            >
              SMS
            </Typography>
            <Typography
              component="span"
              sx={{
                fontWeight: 800,
                fontSize: size > 40 ? '1.05rem' : '0.9rem',
                letterSpacing: '0.04em',
                color: variant === 'dark' ? '#38BDF8' : '#0284C7',
                lineHeight: 1,
              }}
            >
              EDU SOLUTIONS
            </Typography>
          </Box>
          <Typography
            sx={{
              fontSize: '0.62rem',
              fontWeight: 600,
              color: variant === 'dark' ? 'rgba(255,255,255,0.75)' : '#64748B',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              mt: 0.3,
            }}
          >
            powered by{' '}
            <strong style={{ color: variant === 'dark' ? '#67E8F9' : '#0284C7' }}>
              3v TechWorks
            </strong>
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export const ThreeVLogo: React.FC<{ height?: number; className?: string; alt?: string }> = ({
  height = 38,
  alt = '3v TechWorks - Engineering the Future',
}) => {
  return (
    <Box
      component="img"
      src={threeVLogoImg}
      alt={alt}
      sx={{
        height,
        width: 'auto',
        objectFit: 'contain',
        filter: 'drop-shadow(0 4px 14px rgba(56, 189, 248, 0.25))',
        transition: 'transform 0.3s ease',
        '&:hover': {
          transform: 'scale(1.04)',
        },
      }}
    />
  );
};
