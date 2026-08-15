import React from 'react';
import { Box, Typography, Chip, Avatar, IconButton } from '@mui/material';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';

export interface MobileCardBadge {
  label: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'default';
  variant?: 'filled' | 'outlined';
}

export interface MobileCardMeta {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}

export interface MobileCardItemProps {
  id?: string | number;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  avatar?: React.ReactNode;
  avatarText?: string;
  avatarBg?: string;
  badge?: MobileCardBadge | React.ReactNode;
  badges?: (MobileCardBadge | React.ReactNode)[];
  metaItems?: MobileCardMeta[];
  onClick?: () => void;
  onMoreClick?: (e: React.MouseEvent) => void;
  rightAction?: React.ReactNode;
  highlightColor?: string;
  className?: string;
  children?: React.ReactNode;
}

export const MobileCardItem: React.FC<MobileCardItemProps> = ({
  title,
  subtitle,
  avatar,
  avatarText,
  avatarBg = '#4f46e5',
  badge,
  badges,
  metaItems,
  onClick,
  onMoreClick,
  rightAction,
  highlightColor,
  className = '',
  children,
}) => {
  const isClickable = Boolean(onClick);

  return (
    <Box
      onClick={onClick}
      className={`touch-card-active ${className}`}
      sx={{
        bgcolor: '#ffffff',
        borderRadius: '16px',
        p: 2,
        mb: 1.5,
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
        position: 'relative',
        overflow: 'hidden',
        cursor: isClickable ? 'pointer' : 'default',
        ...(highlightColor
          ? {
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '4px',
                bgcolor: highlightColor,
                borderTopLeftRadius: '16px',
                borderBottomLeftRadius: '16px',
              },
            }
          : {}),
      }}
    >
      {/* Top row: Avatar + Title/Subtitle + Badges/Actions */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
          {/* Avatar or Icon */}
          {avatar ? (
            avatar
          ) : avatarText ? (
            <Avatar
              sx={{
                width: 42,
                height: 42,
                bgcolor: avatarBg,
                fontSize: 16,
                fontWeight: 700,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                flexShrink: 0,
              }}
            >
              {avatarText.charAt(0).toUpperCase()}
            </Avatar>
          ) : null}

          {/* Title & Subtitle */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              noWrap
              sx={{
                fontWeight: 700,
                fontSize: '0.96rem',
                color: '#0f172a',
                lineHeight: 1.25,
                fontFamily: '"Outfit", sans-serif',
              }}
            >
              {title}
            </Typography>

            {subtitle && (
              <Typography
                noWrap
                sx={{
                  fontSize: '0.78rem',
                  color: '#64748b',
                  mt: 0.3,
                  fontWeight: 500,
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Right side: Badge, Action or More */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexShrink: 0 }}>
          {badge && (
            typeof badge === 'object' && 'label' in badge ? (
              <Chip
                label={badge.label}
                size="small"
                color={badge.color || 'primary'}
                variant={badge.variant || 'filled'}
                sx={{
                  height: 22,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  borderRadius: '6px',
                }}
              />
            ) : (
              badge
            )
          )}

          {badges?.map((b, idx) => (
            typeof b === 'object' && b && 'label' in b ? (
              <Chip
                key={idx}
                label={b.label}
                size="small"
                color={b.color || 'default'}
                variant={b.variant || 'filled'}
                sx={{
                  height: 22,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  borderRadius: '6px',
                }}
              />
            ) : (
              <React.Fragment key={idx}>{b}</React.Fragment>
            )
          ))}

          {rightAction}

          {onMoreClick && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onMoreClick(e);
              }}
              sx={{ color: '#94a3b8', p: 0.5 }}
            >
              <MoreVertRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          )}

          {isClickable && !rightAction && !onMoreClick && (
            <ChevronRightRoundedIcon sx={{ color: '#cbd5e1', fontSize: 20 }} />
          )}
        </Box>
      </Box>

      {/* Meta Grid if provided */}
      {metaItems && metaItems.length > 0 && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: metaItems.length > 2 ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 1,
            mt: 1.5,
            pt: 1.2,
            borderTop: '1px solid #f1f5f9',
          }}
        >
          {metaItems.map((meta, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.8, minWidth: 0 }}>
              {meta.icon && (
                <Box sx={{ color: '#94a3b8', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  {meta.icon}
                </Box>
              )}
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 500, lineHeight: 1 }} noWrap>
                  {meta.label}
                </Typography>
                <Typography sx={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: 600, mt: 0.2 }} noWrap>
                  {meta.value}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Custom Child Content */}
      {children && <Box sx={{ mt: 1.5 }}>{children}</Box>}
    </Box>
  );
};

export default MobileCardItem;
