import { Box, Tabs, Tab, Paper } from '@mui/material';
import { useUrlTab } from '../../../hooks/useUrlTab';
import { useIsMobile } from '../../../hooks/useIsMobile';
import MobileSegmentedTabs from '../../../components/mobile/navigation/MobileSegmentedTabs';
import Reports from './Reports';
import TeacherAttendance from './TeacherAttendance';

/**
 * School Admin Attendance Management
 * Provides access to reports and teacher attendance marking
 */
const AttendanceAdmin = () => {
    const isMobile = useIsMobile();
    const [tab, setTab] = useUrlTab(0, ['reports', 'teachers']);

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {isMobile ? (
                <Box sx={{ mb: 2.5 }}>
                    <MobileSegmentedTabs
                        options={[
                            { id: 'reports', label: 'Reports & Analytics' },
                            { id: 'teachers', label: 'Teacher Attendance' },
                        ]}
                        activeId={tab === 0 ? 'reports' : 'teachers'}
                        onChange={(id) => setTab(id === 'reports' ? 0 : 1)}
                    />
                </Box>
            ) : (
                <Paper sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
                    <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                        <Tab label="Reports & Analytics" sx={{ fontWeight: 600, px: 3 }} />
                        <Tab label="Teacher Attendance" sx={{ fontWeight: 600, px: 3 }} />
                    </Tabs>
                </Paper>
            )}

            {tab === 0 && <Reports />}
            {tab === 1 && <TeacherAttendance />}
        </Box>
    );
};

export default AttendanceAdmin;
