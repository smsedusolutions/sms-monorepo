import { useState, useEffect } from 'react';
import { Box, CircularProgress, Alert, Paper, Tabs, Tab } from '@mui/material';
import SimpleAttendance from './SimpleAttendance';
import PeriodAttendance from './PeriodAttendance';
import CheckInAttendance from './CheckInAttendance';
import TeacherSelfCheckIn from './TeacherSelfCheckIn';
import { useGetSchoolById } from '../../../queries/School';
import TokenService from '../../../queries/token/tokenService';
import { useUrlTab } from '../../../hooks/useUrlTab';
import type { AttendanceMode } from '../../../types';

/**
 * Main Teacher Attendance Page
 * Tab 1: Student Attendance (mode-based: Simple/Period/CheckIn)
 * Tab 2: My Attendance (self check-in with geolocation)
 */
const TeacherAttendance = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const { data: schoolData, isLoading, error } = useGetSchoolById(schoolId);
    const [mode, setMode] = useState<AttendanceMode>('simple');
    const [activeTab, setActiveTab] = useUrlTab(0, ['students', 'my-attendance']);

    useEffect(() => {
        if (schoolData?.data?.attendanceSettings?.mode) {
            setMode(schoolData.data.attendanceSettings.mode as AttendanceMode);
        }
    }, [schoolData]);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Failed to load school settings</Alert>
            </Box>
        );
    }

    // Render student attendance component based on school's mode
    const renderStudentAttendance = () => {
        switch (mode) {
            case 'period_wise':
                return <PeriodAttendance />;
            case 'check_in_out':
                return <CheckInAttendance />;
            case 'simple':
            default:
                return <SimpleAttendance />;
        }
    };

    return (
        <Box sx={{ p: { xs: 0, sm: 0 } }}>
            {/* Tabs */}
            <Paper sx={{ mx: { xs: 2, sm: 3 }, mt: { xs: 2, sm: 3 }, mb: 0 }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, v) => setActiveTab(v)}
                    variant="fullWidth"
                >
                    <Tab label="Student Attendance" />
                    <Tab label="My Attendance" />
                </Tabs>
            </Paper>

            {/* Tab Content */}
            {activeTab === 0 && renderStudentAttendance()}
            {activeTab === 1 && <TeacherSelfCheckIn />}
        </Box>
    );
};

export default TeacherAttendance;
