import React from 'react';
import {
    Dialog,
    DialogContent,
    Box,
    Typography,
    Button,
    Stack,
    Divider,
    Collapse,
} from '@mui/material';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import LogoutIcon from '@mui/icons-material/Logout';
import ReplayIcon from '@mui/icons-material/Replay';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useGlobalErrorStore } from '../../stores/globalErrorStore';
import TokenService from '../../queries/token/tokenService';
import { useUserStore } from '../../stores/userStore';
import { useQueryClient } from '@tanstack/react-query';

const GlobalApiErrorModal: React.FC = () => {
    const { isTriggered, lastError, reset } = useGlobalErrorStore();
    const { clearStore } = useUserStore();
    const queryClient = useQueryClient();
    const [showDetails, setShowDetails] = React.useState(false);

    if (!isTriggered) {
        return null;
    }

    const handleReload = () => {
        reset();
        window.location.reload();
    };

    const handleTryAgain = () => {
        reset();
        // Invalidate and refetch all active queries in React Query
        queryClient.invalidateQueries();
    };

    const handleLogout = () => {
        reset();
        clearStore();
        TokenService.removeToken();
        window.location.href = '/login';
    };

    return (
        <Dialog
            open={isTriggered}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    p: { xs: 1.5, sm: 3 },
                    boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    textAlign: 'center',
                    bgcolor: '#ffffff',
                },
            }}
        >
            <DialogContent sx={{ px: { xs: 1, sm: 2 }, py: 2 }}>
                {/* Warning Icon Badge */}
                <Box
                    sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '28px',
                        bgcolor: '#fef2f2',
                        color: '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2.5,
                        boxShadow: '0 8px 24px rgba(239, 68, 68, 0.18)',
                        animation: 'pulse 2s infinite ease-in-out',
                        '@keyframes pulse': {
                            '0%': { transform: 'scale(1)' },
                            '50%': { transform: 'scale(1.05)' },
                            '100%': { transform: 'scale(1)' },
                        },
                    }}
                >
                    <CloudOffIcon sx={{ fontSize: 42 }} />
                </Box>

                {/* Main Heading */}
                <Typography
                    variant="h5"
                    fontWeight={800}
                    color="#1e293b"
                    gutterBottom
                    sx={{ fontSize: { xs: '1.3rem', sm: '1.5rem' }, letterSpacing: '-0.3px' }}
                >
                    Server Connection Failed
                </Typography>

                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 3, lineHeight: 1.6, maxWidth: 440, mx: 'auto', fontSize: '0.9rem' }}
                >
                    Multiple consecutive server requests failed. This may be caused by a lost internet connection, server maintenance, or network restrictions.
                </Typography>

                {/* Diagnostics Toggle */}
                {lastError && (
                    <Box sx={{ mb: 3 }}>
                        <Button
                            size="small"
                            onClick={() => setShowDetails((prev) => !prev)}
                            endIcon={
                                <ExpandMoreIcon
                                    sx={{
                                        transform: showDetails ? 'rotate(180deg)' : 'none',
                                        transition: 'transform 0.2s',
                                    }}
                                />
                            }
                            sx={{
                                textTransform: 'none',
                                color: '#64748b',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                            }}
                        >
                            {showDetails ? 'Hide technical details' : 'View technical details'}
                        </Button>

                        <Collapse in={showDetails}>
                            <Box
                                sx={{
                                    mt: 1,
                                    p: 2,
                                    bgcolor: '#f8fafc',
                                    borderRadius: 2.5,
                                    border: '1px solid #e2e8f0',
                                    textAlign: 'left',
                                    fontSize: '0.78rem',
                                    color: '#475569',
                                    fontFamily: 'monospace',
                                    wordBreak: 'break-all',
                                }}
                            >
                                <div><strong>Error:</strong> {lastError.message}</div>
                                {lastError.status !== undefined && (
                                    <div><strong>Status Code:</strong> {lastError.status || 'No Response (Network / CORS)'}</div>
                                )}
                                {lastError.path && (
                                    <div><strong>Endpoint:</strong> {lastError.path}</div>
                                )}
                                <div><strong>Time:</strong> {new Date(lastError.timestamp).toLocaleTimeString()}</div>
                            </Box>
                        </Collapse>
                    </Box>
                )}

                <Divider sx={{ my: 2.5, borderColor: '#f1f5f9' }} />

                {/* Action Buttons */}
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.5}
                    justifyContent="center"
                    alignItems="center"
                >
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<ReplayIcon />}
                        onClick={handleTryAgain}
                        sx={{
                            textTransform: 'none',
                            borderRadius: 2.5,
                            px: 3,
                            py: 1.1,
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            width: { xs: '100%', sm: 'auto' },
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                        }}
                    >
                        Try Again
                    </Button>

                    <Button
                        variant="outlined"
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
                            borderColor: '#cbd5e1',
                            color: '#334155',
                            '&:hover': {
                                bgcolor: '#f8fafc',
                                borderColor: '#94a3b8',
                            },
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
                            },
                        }}
                    >
                        Sign Out
                    </Button>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};

export default GlobalApiErrorModal;
