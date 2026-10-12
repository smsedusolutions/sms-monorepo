import React from 'react';
import { Box, Skeleton } from '@mui/material';

const LoginPageSkeleton: React.FC = () => (
  <Box sx={{ display: 'flex', minHeight: '100vh', background: '#0F172A', position: 'relative' }}>

    {/* Left panel skeleton */}
    <Box sx={{ flex: 1, display: { xs: 'none', md: 'flex' }, flexDirection: 'column', p: '48px 64px', gap: 3 }}>
      {/* Collab header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Skeleton variant="rounded" width={52} height={52} sx={{ borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.07)' }} />
        <Box>
          <Skeleton variant="text" width={140} height={18} sx={{ bgcolor: 'rgba(255,255,255,0.07)' }} />
          <Skeleton variant="text" width={100} height={12} sx={{ bgcolor: 'rgba(255,255,255,0.05)', mt: 0.5 }} />
        </Box>
        <Box sx={{ width: 1, height: 48, bgcolor: 'rgba(255,255,255,0.08)', mx: 2 }} />
        <Skeleton variant="rounded" width={48} height={48} sx={{ borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.07)' }} />
        <Box>
          <Skeleton variant="text" width={80} height={18} sx={{ bgcolor: 'rgba(255,255,255,0.07)' }} />
          <Skeleton variant="text" width={60} height={10} sx={{ bgcolor: 'rgba(255,255,255,0.05)', mt: 0.5 }} />
        </Box>
      </Box>

      {/* Hero */}
      <Box sx={{ my: 'auto' }}>
        <Skeleton variant="text" width="40%" height={38} sx={{ bgcolor: 'rgba(255,255,255,0.07)', mb: 0.5 }} />
        <Skeleton variant="rounded" width="80%" height={52} sx={{ bgcolor: 'rgba(2,132,199,0.2)', mb: 1, borderRadius: '8px' }} />
        <Skeleton variant="rounded" width="65%" height={52} sx={{ bgcolor: 'rgba(2,132,199,0.15)', mb: 3, borderRadius: '8px' }} />
        <Skeleton variant="rounded" width={48} height={3} sx={{ bgcolor: 'rgba(2,132,199,0.3)', mb: 3, borderRadius: '2px' }} />
        <Skeleton variant="text" width="60%" height={22} sx={{ bgcolor: 'rgba(255,255,255,0.07)', mb: 1 }} />
        <Skeleton variant="text" width="80%" height={16} sx={{ bgcolor: 'rgba(255,255,255,0.05)', mb: 0.5 }} />
        <Skeleton variant="text" width="70%" height={16} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
      </Box>

      {/* Info rows */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Skeleton variant="rounded" width="100%" height={52} sx={{ bgcolor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }} />
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Skeleton variant="rounded" width="50%" height={52} sx={{ bgcolor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }} />
          <Skeleton variant="rounded" width="50%" height={52} sx={{ bgcolor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }} />
        </Box>
      </Box>
    </Box>

    {/* Right card skeleton */}
    <Box sx={{ width: { xs: '100%', md: '540px', lg: '580px' }, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
      <Box sx={{
        bgcolor: '#FFFFFF',
        borderRadius: '8px',
        p: '44px 48px',
        width: '100%',
        maxWidth: 480,
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        position: 'relative',
      }}>
        {/* Secure badge */}
        <Skeleton variant="rounded" width={100} height={26} sx={{ position: 'absolute', top: 20, right: 24, borderRadius: '6px', bgcolor: 'rgba(2,132,199,0.1)' }} />

        {/* Heading */}
        <Skeleton variant="rounded" width="75%" height={44} sx={{ mb: 1.5, borderRadius: '6px', bgcolor: 'rgba(0,0,0,0.06)' }} />
        <Skeleton variant="text" width="90%" height={16} sx={{ mb: 0.5, bgcolor: 'rgba(0,0,0,0.05)' }} />
        <Skeleton variant="text" width="70%" height={16} sx={{ mb: 4, bgcolor: 'rgba(0,0,0,0.05)' }} />

        {/* Email */}
        <Skeleton variant="rounded" width="100%" height={52} sx={{ mb: 2.5, borderRadius: '6px', bgcolor: 'rgba(0,0,0,0.06)' }} />
        {/* Password */}
        <Skeleton variant="rounded" width="100%" height={52} sx={{ mb: 1.5, borderRadius: '6px', bgcolor: 'rgba(0,0,0,0.06)' }} />
        {/* Remember */}
        <Skeleton variant="rounded" width="55%" height={20} sx={{ mb: 3, borderRadius: '6px', bgcolor: 'rgba(0,0,0,0.05)' }} />
        {/* Button */}
        <Skeleton variant="rounded" width="100%" height={52} sx={{ mb: 3, borderRadius: '6px', bgcolor: 'rgba(2,132,199,0.15)' }} />
        {/* Contact */}
        <Skeleton variant="text" width="65%" height={16} sx={{ mx: 'auto', bgcolor: 'rgba(0,0,0,0.05)' }} />

        {/* Footer */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 4, pt: 3, borderTop: '1px solid #F1F5F9' }}>
          {[65, 55, 50].map((w, i) => (
            <Skeleton key={i} variant="text" width={w} height={14} sx={{ bgcolor: 'rgba(0,0,0,0.05)' }} />
          ))}
        </Box>
      </Box>
    </Box>
  </Box>
);

export default LoginPageSkeleton;
