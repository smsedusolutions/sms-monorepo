import { Box, Typography, Paper, Tabs, Tab } from '@mui/material';
import { useUrlTab } from '../../hooks/useUrlTab';
import Reports from '../SchoolAdmin/Attendance/Reports';

/**
 * Principal Attendance Page — Read-only school-wide attendance overview.
 * Reuses the existing Reports component from SchoolAdmin.
 */
const PrincipalAttendance = () => {
    const [tab, setTab] = useUrlTab(0, ['reports']);

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>
                School Attendance Overview
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                View attendance reports for all classes and students across the school. (Read-only)
            </Typography>

            <Paper sx={{ mb: 3 }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                    <Tab label="Reports & Analytics" />
                </Tabs>
            </Paper>

            {tab === 0 && <Reports />}
        </Box>
    );
};

export default PrincipalAttendance;
