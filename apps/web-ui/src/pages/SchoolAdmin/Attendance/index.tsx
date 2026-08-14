import { Box, Tabs, Tab, Paper } from '@mui/material';
import { useUrlTab } from '../../../hooks/useUrlTab';
import Reports from './Reports';
import TeacherAttendance from './TeacherAttendance';

/**
 * School Admin Attendance Management
 * Provides access to reports and teacher attendance marking
 */
const AttendanceAdmin = () => {
    const [tab, setTab] = useUrlTab(0, ['reports', 'teachers']);

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Paper sx={{ mb: 3 }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                    <Tab label="Reports & Analytics" />
                    <Tab label="Teacher Attendance" />
                </Tabs>
            </Paper>

            {tab === 0 && <Reports />}
            {tab === 1 && <TeacherAttendance />}
        </Box>
    );
};

export default AttendanceAdmin;
