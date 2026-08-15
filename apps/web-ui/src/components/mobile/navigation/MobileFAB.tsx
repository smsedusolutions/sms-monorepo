import React, { useState } from 'react';
import { Fab, Zoom, SpeedDial, SpeedDialAction, SpeedDialIcon } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

export interface MobileFABAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

export interface MobileFABProps {
  onClick?: () => void;
  icon?: React.ReactNode;
  label?: string;
  actions?: MobileFABAction[];
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  visible?: boolean;
}

export const MobileFAB: React.FC<MobileFABProps> = ({
  onClick,
  icon,
  label = 'Add',
  actions,
  color = 'primary',
  visible = true,
}) => {
  const [open, setOpen] = useState(false);

  if (!visible) return null;

  // If actions list is provided, render SpeedDial
  if (actions && actions.length > 0) {
    return (
      <SpeedDial
        ariaLabel={label}
        sx={{
          position: 'fixed',
          bottom: 'calc(var(--mobile-bottom-nav-height) + var(--safe-area-bottom) + 16px)',
          right: '16px',
          zIndex: 35,
          '& .MuiFab-primary': {
            bgcolor: '#4f46e5',
            boxShadow: '0 8px 24px rgba(79, 70, 229, 0.4)',
            '&:hover, &:active': { bgcolor: '#4338ca' },
          },
        }}
        icon={<SpeedDialIcon icon={icon || <AddRoundedIcon />} openIcon={<CloseRoundedIcon />} />}
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        open={open}
      >
        {actions.map((action) => (
          <SpeedDialAction
            key={action.id}
            icon={action.icon}
            tooltipTitle={action.label}
            tooltipOpen
            onClick={() => {
              setOpen(false);
              action.onClick();
            }}
            FabProps={{
              sx: {
                bgcolor: '#ffffff',
                color: '#4f46e5',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                '&:hover': { bgcolor: '#f8fafc' },
              },
            }}
          />
        ))}
      </SpeedDial>
    );
  }

  // Simple FAB
  return (
    <Zoom in={visible}>
      <Fab
        color={color}
        onClick={onClick}
        aria-label={label}
        sx={{
          position: 'fixed',
          bottom: 'calc(var(--mobile-bottom-nav-height) + var(--safe-area-bottom) + 16px)',
          right: '16px',
          zIndex: 35,
          bgcolor: '#4f46e5',
          boxShadow: '0 8px 24px rgba(79, 70, 229, 0.4)',
          '&:hover, &:active': { bgcolor: '#4338ca', transform: 'scale(1.05)' },
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {icon || <AddRoundedIcon sx={{ fontSize: 28 }} />}
      </Fab>
    </Zoom>
  );
};

export default MobileFAB;
