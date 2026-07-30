import React from 'react';
import { Card, type CardProps, Box } from '@mui/material';
import { motion, type HTMLMotionProps } from 'framer-motion';

const MotionCard = motion(Card);

type MergedCardProps = Omit<HTMLMotionProps<'div'>, keyof CardProps> & CardProps;

interface AppCardProps extends MergedCardProps {
  hover?: boolean;
}

export const AppCard: React.FC<AppCardProps> = ({ 
  children, 
  hover = true, 
  sx, 
  onClick,
  ...props 
}) => {
  return (
    <MotionCard
      whileHover={hover ? { y: -4, boxShadow: '0 12px 24px -10px rgba(0,0,0,0.15)' } : {}}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      sx={{
        overflow: 'visible',
        cursor: onClick ? 'pointer' : 'default',
        ...sx
      }}
      {...props as any}
    >
      <Box sx={{ p: 2 }}>
        {children}
      </Box>
    </MotionCard>
  );
};
