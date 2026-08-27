import { Box, Typography, Grid, Skeleton, Alert, Paper, Avatar } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import DomainAddIcon from '@mui/icons-material/DomainAdd';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DashboardCard from '../../components/Dashboard/DashboardCard';
import DashboardRefreshButton from '../../components/shared/DashboardRefreshButton';
import { useGetDashboardStats } from '../../queries/Dashboard';
import { useNavigate } from 'react-router-dom';

const SuperAdminDashboard = () => {
    const { data, isLoading, error, refetch } = useGetDashboardStats();
    const navigate = useNavigate();

    const stats = data?.data;

    const quickActions = [
        { label: 'All Schools', icon: <SchoolIcon />, path: '/super-admin/schools', color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' },
        { label: 'Administrators', icon: <PeopleIcon />, path: '/super-admin/users', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' },
        { label: 'Add School', icon: <DomainAddIcon />, path: '/super-admin/schools', color: '#10b981', gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
        { label: 'Add Admin', icon: <PersonAddIcon />, path: '/super-admin/users', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' },
    ];

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
            <Box sx={{ mb: { xs: 2, sm: 3 }, mt: 0.5, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                        variant="h4"
                        fontWeight={800}
                        sx={{
                            mb: 0.25,
                            background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontSize: { xs: '1.45rem', sm: '1.85rem', md: '2.25rem' },
                            letterSpacing: '-0.02em',
                            lineHeight: 1.2
                        }}
                    >
                        Super Admin Dashboard
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                        Welcome to the Super Admin Dashboard. Manage schools and platform administrators.
                    </Typography>
                </Box>

                <DashboardRefreshButton
                    onRefresh={async () => {
                        await refetch();
                    }}
                />
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2.5 }}>
                    Failed to load dashboard stats. Please try again.
                </Alert>
            )}

            {/* Stats Cards - 2 in row on mobile */}
            <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                {isLoading ? (
                    [1, 2].map((i) => (
                        <Grid size={{ xs: 6, sm: 6, md: 4 }} key={i}>
                            <Skeleton variant="rectangular" height={90} sx={{ borderRadius: 2.5 }} />
                        </Grid>
                    ))
                ) : stats ? (
                    <>
                        <Grid size={{ xs: 6, sm: 6, md: 4 }}>
                            <DashboardCard
                                title="Total Schools"
                                value={stats.totalSchools}
                                subtitle={`${stats.activeSchools} active`}
                                icon={<SchoolIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />}
                                color="#3b82f6"
                                bgColor="#eff6ff"
                                to="/super-admin/schools"
                            />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 6, md: 4 }}>
                            <DashboardCard
                                title="Administrators"
                                value={stats.totalUsers}
                                subtitle={`${stats.activeUsers} active`}
                                icon={<PeopleIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />}
                                color="#8b5cf6"
                                bgColor="#f5f3ff"
                                to="/super-admin/users"
                            />
                        </Grid>
                    </>
                ) : null}
            </Grid>

            {/* Quick Actions */}
            <Box sx={{ mt: { xs: 3, sm: 4 }, mb: 2 }}>
                <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    color="#1e293b"
                    sx={{ mb: 0.25, fontSize: { xs: '0.95rem', sm: '1.15rem' } }}
                >
                    Quick Navigation
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block', fontSize: '0.75rem' }}>
                    Quick access to platform management tools
                </Typography>

                <Grid container spacing={{ xs: 1, sm: 1.5, md: 2 }}>
                    {quickActions.map((action) => (
                        <Grid size={{ xs: 6, sm: 3 }} key={action.label}>
                            <Paper
                                elevation={0}
                                onClick={() => navigate(action.path)}
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 0.75,
                                    p: { xs: 1.5, sm: 2 },
                                    borderRadius: 2.5,
                                    background: 'white',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    transition: 'all 0.18s ease-in-out',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                                        borderColor: '#cbd5e1',
                                    },
                                }}
                            >
                                <Avatar
                                    sx={{
                                        width: { xs: 38, sm: 44 },
                                        height: { xs: 38, sm: 44 },
                                        borderRadius: '10px',
                                        background: action.gradient,
                                        color: 'white',
                                        boxShadow: `0 3px 10px ${action.color}35`,
                                        mb: 0.5,
                                    }}
                                >
                                    {action.icon}
                                </Avatar>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontWeight: 700,
                                        color: '#1e293b',
                                        fontSize: { xs: '0.75rem', sm: '0.8rem' },
                                    }}
                                    noWrap
                                >
                                    {action.label}
                                </Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </Box>
    );
};

export default SuperAdminDashboard;
