import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface DashboardCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    to?: string;
    subtitle?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
    title,
    value,
    icon,
    color,
    bgColor,
    to,
    subtitle,
}) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (to) {
            navigate(to);
        }
    };

    return (
        <Paper
            elevation={0}
            onClick={handleClick}
            sx={{
                p: { xs: 1.5, sm: 2, md: 2.5 },
                borderRadius: 2.5,
                cursor: to ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                background: 'white',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                '&:hover': to ? {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    borderColor: color,
                } : {},
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                <Box sx={{ minWidth: 0 }}>
                    <Typography
                        variant="body2"
                        sx={{
                            color: '#64748b',
                            fontWeight: 600,
                            mb: 0.5,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            fontSize: { xs: '0.65rem', sm: '0.72rem' },
                        }}
                        noWrap
                    >
                        {title}
                    </Typography>
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 800,
                            color: '#1e293b',
                            lineHeight: 1.1,
                            fontSize: { xs: '1.4rem', sm: '1.75rem', md: '2.1rem' },
                        }}
                    >
                        {value}
                    </Typography>
                    {subtitle && (
                        <Typography
                            variant="caption"
                            sx={{
                                color: '#94a3b8',
                                mt: 0.5,
                                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                display: 'block'
                            }}
                            noWrap
                        >
                            {subtitle}
                        </Typography>
                    )}
                </Box>
                <Box
                    sx={{
                        width: { xs: 38, sm: 46, md: 52 },
                        height: { xs: 38, sm: 46, md: 52 },
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: bgColor,
                        color: color,
                        flexShrink: 0,
                    }}
                >
                    {icon}
                </Box>
            </Box>
            {to && (
                <Box sx={{ mt: 1.5, pt: 1.25, borderTop: '1px solid #f1f5f9' }}>
                    <Typography
                        variant="caption"
                        sx={{
                            color: color,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            fontSize: { xs: '0.7rem', sm: '0.75rem' },
                        }}
                    >
                        View Details →
                    </Typography>
                </Box>
            )}
        </Paper>
    );
};

export default DashboardCard;
