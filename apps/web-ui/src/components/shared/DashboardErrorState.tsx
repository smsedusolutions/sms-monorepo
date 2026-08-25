import React from 'react';
import { Box, Typography, Button, Paper, Stack } from '@mui/material';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import LogoutIcon from '@mui/icons-material/Logout';
import ReplayIcon from '@mui/icons-material/Replay';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useUserStore } from '../../stores/userStore';

interface DashboardErrorStateProps {
    title?: string;
    message?: string;
    error?: any;
    onRetry?: () => void;
}

const DashboardErrorState: React.FC<DashboardErrorStateProps> = ({
    title = 'Unable to Load Dashboard',
    message = 'We encountered an issue connecting to the server or loading your dashboard data after multiple attempts.',
    error,
    onRetry,
}) => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { clearStore } = useUserStore();

    const handleReload = () => {
        window.location.reload();
    };

    const handleLogout = () => {
        clearStore();
        logout();
        navigate('/login');
    };

    const errorMessage = error?.message || (typeof error === 'string' ? error : null);

    return (
        <Box
            sx={{
                py: { xs: 4, sm: 8 },
                px: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh',
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    maxWidth: 540,
                    width: '100%',
                    p: { xs: 3, sm: 4.5 },
                    borderRadius: 4,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
                    textAlign: 'center',
                    bgcolor: '#ffffff',
                }}
            >
                {/* Icon */}
                <Box
                    sx={{
                        width: 72,
                        height: 72,
                        borderRadius: '24px',
                        bgcolor: '#fef2f2',
                        color: '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2.5,
                        boxShadow: '0 4px 14px rgba(239, 68, 68, 0.15)',
                    }}
                >
                    <CloudOffIcon sx={{ fontSize: 36 }} />
                </Box>

                {/* Title & Message */}
                <Typography
                    variant="h5"
                    fontWeight={700}
                    color="#1e293b"
                    gutterBottom
                    sx={{ fontSize: { xs: '1.25rem', sm: '1.45rem' } }}
                >
                    {title}
                </Typography>

                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 3, lineHeight: 1.6, maxWidth: 440, mx: 'auto' }}
                >
                    {message}
                </Typography>

                {/* Optional Debug Error Pill */}
                {errorMessage && (
                    <Box
                        sx={{
                            mb: 3.5,
                            p: 1.5,
                            bgcolor: '#f8fafc',
                            borderRadius: 2,
                            border: '1px solid #f1f5f9',
                            fontSize: '0.78rem',
                            color: '#64748b',
                            fontFamily: 'monospace',
                            textAlign: 'left',
                            overflow: 'auto',
                            maxHeight: 90,
                            wordBreak: 'break-word',
                        }}
                    >
                        <strong>Detail:</strong> {errorMessage}
                    </Box>
                )}

                {/* Action Buttons */}
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.5}
                    justifyContent="center"
                    alignItems="center"
                >
                    {onRetry && (
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<ReplayIcon />}
                            onClick={onRetry}
                            sx={{
                                textTransform: 'none',
                                borderRadius: 2.5,
                                px: 3,
                                py: 1.1,
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                width: { xs: '100%', sm: 'auto' },
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
                            }}
                        >
                            Try Again
                        </Button>
                    )}

                    <Button
                        variant={onRetry ? "outlined" : "contained"}
                        color="primary"
                        startIcon={<RefreshIcon />}
                        onClick={handleReload}
                        sx={{
                            textTransform: 'none',
                            borderRadius: 2.5,
                            px: 3,
                            py: 1.1,
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            width: { xs: '100%', sm: 'auto' },
                        }}
                    >
                        Reload Page
                    </Button>

                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<LogoutIcon />}
                        onClick={handleLogout}
                        sx={{
                            textTransform: 'none',
                            borderRadius: 2.5,
                            px: 3,
                            py: 1.1,
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            width: { xs: '100%', sm: 'auto' },
                            borderColor: '#fca5a5',
                            color: '#ef4444',
                            '&:hover': {
                                bgcolor: '#fef2f2',
                                borderColor: '#ef4444',
                            }
                        }}
                    >
                        Sign Out
                    </Button>
                </Stack>
            </Paper>
        </Box>
    );
};

export default DashboardErrorState;
