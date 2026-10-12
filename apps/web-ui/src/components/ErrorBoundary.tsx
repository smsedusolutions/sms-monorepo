import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import RefreshIcon from '@mui/icons-material/Refresh';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('Error caught by ErrorBoundary:', error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReload = (): void => {
        window.location.reload();
    };

    handleGoHome = (): void => {
        window.location.href = '/';
    };


    render(): ReactNode {
        if (this.state.hasError) {
            return (
                <Box
                    sx={{
                        minHeight: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    }}
                >
                    <Container maxWidth="md">
                        <Box
                            sx={{
                                textAlign: 'center',
                                color: 'white',
                            }}
                        >
                            <BugReportIcon
                                sx={{
                                    fontSize: 100,
                                    color: '#ef4444',
                                    mb: 2,
                                }}
                            />
                            <Typography
                                variant="h3"
                                sx={{
                                    fontWeight: 700,
                                    mb: 2,
                                    color: '#e2e8f0',
                                }}
                            >
                                Oops! Something went wrong
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: '#94a3b8',
                                    mb: 4,
                                    maxWidth: 500,
                                    mx: 'auto',
                                }}
                            >
                                We're sorry, but something unexpected happened. Please try refreshing the page or go back to the home page.
                            </Typography>

                            {/* Error Details (Development Only) */}
                            {import.meta.env.VITE_APP_ENV === 'development' && this.state.error && (
                                <Box
                                    sx={{
                                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        borderRadius: 2,
                                        p: 3,
                                        mb: 4,
                                        textAlign: 'left',
                                        maxHeight: 200,
                                        overflow: 'auto',
                                    }}
                                >
                                    <Typography
                                        variant="subtitle2"
                                        sx={{ color: '#ef4444', mb: 1, fontWeight: 600 }}
                                    >
                                        Error Details:
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        component="pre"
                                        sx={{
                                            color: '#fca5a5',
                                            fontFamily: 'monospace',
                                            fontSize: '0.85rem',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                        }}
                                    >
                                        {this.state.error.toString()}
                                        {this.state.errorInfo?.componentStack}
                                    </Typography>
                                </Box>
                            )}

                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                                <Button
                                    variant="contained"
                                    onClick={this.handleReload}
                                    startIcon={<RefreshIcon />}
                                    sx={{
                                        px: 4,
                                        py: 1.5,
                                        borderRadius: '6px',
                                        textTransform: 'none',
                                        fontSize: '1rem',
                                        backgroundColor: '#334155',
                                        '&:hover': {
                                            backgroundColor: '#475569',
                                        },
                                    }}
                                >
                                    Refresh Page
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={this.handleGoHome}
                                    sx={{
                                        px: 4,
                                        py: 1.5,
                                        borderRadius: '6px',
                                        textTransform: 'none',
                                        fontSize: '1rem',
                                        bgcolor: '#0284C7',
                                        '&:hover': {
                                            bgcolor: '#0369A1',
                                        },
                                    }}
                                >
                                    Go Home
                                </Button>
                            </Box>
                        </Box>
                    </Container>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
