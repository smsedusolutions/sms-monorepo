import React from 'react';
import { Box, Typography } from '@mui/material';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';

export interface MobileStatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  gradient?: string;
  trend?: {
    value: string | number;
    isPositive?: boolean;
    label?: string;
  };
  subtitle?: string;
  onClick?: () => void;
}

export const MobileStatCard: React.FC<MobileStatCardProps> = ({
  title,
  value,
  icon,
  gradient = 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
  trend,
  subtitle,
  onClick,
}) => {
  return (
    <Box
      onClick={onClick}
      className="touch-card-active"
      sx={{
        bgcolor: '#ffffff',
        borderRadius: '20px',
        p: 2,
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top row: Icon + Trend Pill */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '14px',
            background: gradient,
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
          }}
        >
          {icon}
        </Box>

        {trend && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.3,
              px: 1,
              py: 0.3,
              borderRadius: '20px',
              bgcolor: trend.isPositive ? '#ecfdf5' : '#fef2f2',
              color: trend.isPositive ? '#059669' : '#dc2626',
              fontSize: '0.72rem',
              fontWeight: 700,
            }}
          >
            {trend.isPositive ? (
              <TrendingUpRoundedIcon sx={{ fontSize: 14 }} />
            ) : (
              <TrendingDownRoundedIcon sx={{ fontSize: 14 }} />
            )}
            <span>{trend.value}</span>
          </Box>
        )}
      </Box>

      {/* Main Value & Title */}
      <Box>
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: '1.45rem',
            color: '#0f172a',
            fontFamily: '"Outfit", sans-serif',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            mb: 0.4,
          }}
        >
          {value}
        </Typography>

        <Typography
          sx={{
            fontSize: '0.78rem',
            fontWeight: 600,
            color: '#64748b',
            lineHeight: 1.2,
          }}
        >
          {title}
        </Typography>

        {subtitle && (
          <Typography
            sx={{
              fontSize: '0.7rem',
              color: '#94a3b8',
              mt: 0.5,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default MobileStatCard;
