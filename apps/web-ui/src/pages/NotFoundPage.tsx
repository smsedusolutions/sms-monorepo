import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AppButton } from '../components/shared/AppButton';
import { useAuth } from '../context/AuthContext';
import LogoutIcon from '@mui/icons-material/Logout';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#F8FAFC',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1, py: 6 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{ position: 'relative', mb: 3 }}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '6rem', md: '10rem' },
                fontWeight: 900,
                color: 'primary.main',
                lineHeight: 1,
                opacity: 0.12,
                userSelect: 'none',
                letterSpacing: '-0.05em',
                mb: 2,
              }}
            >
              404
            </Typography>

            <Box
              component="img"
              src="/not_found-bell.png"
              alt="Page Not Found"
              sx={{
                width: '100%',
                maxWidth: 240,
                height: 'auto',
                mx: 'auto',
                display: 'block',
                mt: -8,
                filter: 'drop-shadow(0 8px 16px rgba(2, 132, 199, 0.15))',
              }}
            />
          </Box>

          {/* Message Section */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: '#0F172A',
                mb: 1.5,
                fontSize: { xs: '1.75rem', md: '2rem' },
              }}
            >
              Page Not Found
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#64748B',
                fontWeight: 400,
                lineHeight: 1.6,
                maxWidth: 420,
                mx: 'auto',
              }}
            >
              The requested resource or page could not be located. Verify the URL or return to the main dashboard.
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <AppButton
                variant="outlined"
                color="primary"
                onClick={() => navigate(-1)}
                sx={{ px: 3.5, py: 1.25, minWidth: 140, borderRadius: '6px' }}
              >
                Go Back
              </AppButton>
              <AppButton
                variant="contained"
                color="primary"
                onClick={() => navigate('/')}
                sx={{ px: 3.5, py: 1.25, minWidth: 140, borderRadius: '6px' }}
              >
                Go Home
              </AppButton>
            </Box>
            {isAuthenticated && (
              <AppButton
                variant="text"
                color="error"
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
                sx={{ px: 3, py: 1, minWidth: 140 }}
              >
                Logout
              </AppButton>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default NotFoundPage;
