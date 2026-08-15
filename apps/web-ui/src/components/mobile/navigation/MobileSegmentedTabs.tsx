import React from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

export interface SegmentedTabOption {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface MobileSegmentedTabsProps {
  options: SegmentedTabOption[];
  activeId: string;
  onChange: (id: string) => void;
  fullWidth?: boolean;
}

export const MobileSegmentedTabs: React.FC<MobileSegmentedTabsProps> = ({
  options,
  activeId,
  onChange,
  fullWidth = true,
}) => {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        width: fullWidth ? '100%' : 'auto',
        bgcolor: '#e2e8f0',
        p: '4px',
        borderRadius: '14px',
        gap: '4px',
        mb: 2,
        overflowX: 'auto',
      }}
    >
      {options.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="relative flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-[10px] cursor-pointer outline-none border-none bg-transparent touch-active"
            style={{
              minWidth: fullWidth ? 0 : '80px',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {isActive && (
              <motion.div
                layoutId="segmentedTabIndicator"
                className="absolute inset-0 bg-white rounded-[10px] shadow-sm -z-0"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}

            <span className="relative z-10 flex items-center gap-1.5">
              {tab.icon && (
                <span style={{ color: isActive ? '#4f46e5' : '#64748b', display: 'flex' }}>
                  {tab.icon}
                </span>
              )}
              <Typography
                noWrap
                sx={{
                  fontWeight: isActive ? 700 : 600,
                  fontSize: '0.84rem',
                  color: isActive ? '#0f172a' : '#64748b',
                  lineHeight: 1.2,
                  fontFamily: '"Outfit", sans-serif',
                  transition: 'color 0.2s ease',
                }}
              >
                {tab.label}
              </Typography>

              {typeof tab.count === 'number' && (
                <Box
                  sx={{
                    px: 0.8,
                    py: 0.1,
                    borderRadius: '10px',
                    bgcolor: isActive ? '#4f46e5' : '#cbd5e1',
                    color: '#ffffff',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                  }}
                >
                  {tab.count}
                </Box>
              )}
            </span>
          </button>
        );
      })}
    </Box>
  );
};

export default MobileSegmentedTabs;
