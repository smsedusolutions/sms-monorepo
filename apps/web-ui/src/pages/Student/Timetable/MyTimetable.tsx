import { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    ToggleButtonGroup,
    ToggleButton,
    Chip,
    Card,
    CardContent,
    Divider,
    Button,
    Tooltip,
} from '@mui/material';
import {
    TableChart as TableIcon,
    List as ListIcon,
    Today as TodayIcon,
    PictureAsPdf as PdfIcon,
    SwapHoriz as SwapIcon,
} from '@mui/icons-material';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useGetClassTimetable, useGetActiveConfig, useGetSubstitutesForDate } from '../../../queries/Timetable';
import TokenService from '../../../queries/token/tokenService';
import type { TimetableEntry } from '../../../types/timetable.types';
import { useIsMobile } from '../../../hooks/useIsMobile';
import MobileSegmentedTabs from '../../../components/mobile/navigation/MobileSegmentedTabs';
import MobileCardItem from '../../../components/mobile/data/MobileCardItem';
import MobileCardList from '../../../components/mobile/data/MobileCardList';

type ViewMode = 'table' | 'list';

interface MyTimetableProps {
    studentClassId?: string;
    studentSectionId?: string;
}

const MyTimetable = ({ studentClassId, studentSectionId }: MyTimetableProps = {}) => {
    const isMobile = useIsMobile();
    const schoolId = TokenService.getSchoolId() || '';
    // Get class and section from props (for parents) or student token (for students)
    const user = TokenService.getUser();
    const classId = studentClassId || user?.class || '';
    const sectionId = studentSectionId || user?.section || '';

    const [viewMode, setViewMode] = useState<ViewMode>('table');

    // Get today's day
    const today = new Date();
    const todayDayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const [selectedMobileDay, setSelectedMobileDay] = useState<string>(todayDayName);

    // Get today's date for substitute fetching
    const todayDate = new Date().toISOString().split('T')[0];

    const { data: configData } = useGetActiveConfig(schoolId);
    const { data: timetableData, isLoading, error } = useGetClassTimetable(schoolId, classId, sectionId);
    const { data: substitutesData } = useGetSubstitutesForDate(schoolId, todayDate);

    const config = configData?.data;
    const entries = timetableData?.data?.entries || [];
    const substitutes = substitutesData?.data || [];

    // Get regular periods only
    const regularPeriods = useMemo(() => {
        return config?.periods?.filter((p) => p.type === 'regular') || [];
    }, [config]);

    // Create entry lookup map
    const entryMap = useMemo(() => {
        const map: Record<string, TimetableEntry> = {};
        entries.forEach((entry: TimetableEntry) => {
            map[`${entry.dayOfWeek}-${entry.periodNumber}`] = entry;
        });
        return map;
    }, [entries]);

    // Create substitute lookup map by day-period for current class/section
    const substituteMap = useMemo(() => {
        const map: Record<string, any> = {};
        substitutes.forEach((sub: any) => {
            // Only include substitutes for the current class/section
            if (sub.entry?.classId === classId && sub.entry?.sectionId === sectionId) {
                map[`${sub.entry?.dayOfWeek}-${sub.entry?.periodNumber}`] = sub;
            }
        });
        return map;
    }, [substitutes, classId, sectionId]);

    // Today's schedule with substitutes
    const todaySchedule = useMemo(() => {
        return entries.filter((e: TimetableEntry) => e.dayOfWeek === todayDayName)
            .sort((a: TimetableEntry, b: TimetableEntry) => a.periodNumber - b.periodNumber);
    }, [entries, todayDayName]);

    const getEntryColor = (entry: TimetableEntry) => {
        const hash = entry.subjectId.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        const hue = Math.abs(hash) % 360;
        return `hsl(${hue}, 70%, 85%)`;
    };

    // Export to PDF functionality
    const handleExportPdf = () => {
        if (!config) return;

        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
        });

        // Title
        doc.setFontSize(18);
        doc.setTextColor(46, 125, 50); // Success green color
        doc.text('My Class Timetable', 14, 20);

        // Date
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

        // Prepare table data
        const headers = ['Period', ...config.workingDays.map(day => day.charAt(0).toUpperCase() + day.slice(1))];

        const rows = regularPeriods.map((period) => {
            const row = [`${period.name}\n(${period.startTime} - ${period.endTime})`];
            config.workingDays.forEach((day) => {
                const entry = entryMap[`${day}-${period.periodNumber}`];
                if (entry) {
                    row.push(`${entry.subject?.name || entry.subjectId}\n${entry.teacher?.name || 'TBA'}`);
                } else {
                    row.push('-');
                }
            });
            return row;
        });

        // Generate table
        autoTable(doc, {
            head: [headers],
            body: rows,
            startY: 35,
            theme: 'grid',
            headStyles: {
                fillColor: [46, 125, 50],
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center',
            },
            bodyStyles: {
                halign: 'center',
                valign: 'middle',
            },
            columnStyles: {
                0: { fontStyle: 'bold', fillColor: [245, 245, 245] },
            },
            styles: {
                fontSize: 9,
                cellPadding: 3,
            },
        });

        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(
                `Page ${i} of ${pageCount}`,
                doc.internal.pageSize.getWidth() / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: 'center' }
            );
        }

        // Save
        doc.save('my-class-timetable.pdf');
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Failed to load timetable</Alert>
            </Box>
        );
    }

    if (!config) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="info">No timetable configuration found for this school.</Alert>
            </Box>
        );
    }

    if (!classId || !sectionId) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="warning">Class information not found. Please contact your administrator.</Alert>
            </Box>
        );
    }

    // Mobile Day Tab Options
    const mobileDayOptions = (config?.workingDays || []).map((day) => ({
        id: day,
        label: day.substring(0, 3).toUpperCase(),
        count: entries.filter((e) => e.dayOfWeek === day).length,
    }));

    const currentMobileDaySchedule = entries
        .filter((e: TimetableEntry) => e.dayOfWeek === selectedMobileDay)
        .sort((a: TimetableEntry, b: TimetableEntry) => a.periodNumber - b.periodNumber);

    if (isMobile) {
        return (
            <Box sx={{ width: '100%' }}>
                {/* Mobile Title & Action */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', fontFamily: '"Outfit", sans-serif', color: '#0f172a' }}>
                        Class Schedule
                    </Typography>
                    <Button
                        variant="outlined"
                        color="success"
                        startIcon={<PdfIcon sx={{ fontSize: 18 }} />}
                        onClick={handleExportPdf}
                        size="small"
                        sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontSize: '0.78rem' }}
                    >
                        PDF
                    </Button>
                </Box>

                {/* Day Segmented Tabs */}
                {mobileDayOptions.length > 0 && (
                    <MobileSegmentedTabs
                        options={mobileDayOptions}
                        activeId={selectedMobileDay}
                        onChange={(id) => setSelectedMobileDay(id)}
                    />
                )}

                {/* Today Badge if viewing today */}
                {selectedMobileDay === todayDayName && (
                    <Box sx={{ mb: 1.5, px: 0.5 }}>
                        <Chip
                            icon={<TodayIcon sx={{ fontSize: 16 }} />}
                            label="Today's Active Classes"
                            size="small"
                            color="success"
                            variant="filled"
                            sx={{ fontWeight: 700, borderRadius: '8px' }}
                        />
                    </Box>
                )}

                {/* Period Cards Timeline */}
                <MobileCardList
                    emptyTitle="No Classes Scheduled"
                    emptyMessage={`There are no classes scheduled for ${selectedMobileDay.toUpperCase()}.`}
                    itemCount={currentMobileDaySchedule.length}
                >
                    {regularPeriods.map((period) => {
                        const entry = entryMap[`${selectedMobileDay}-${period.periodNumber}`];
                        const substitute = substituteMap[`${selectedMobileDay}-${period.periodNumber}`];
                        const hasSubstitute = !!substitute && selectedMobileDay === todayDayName;

                        if (!entry) {
                            return (
                                <MobileCardItem
                                    key={period.periodNumber}
                                    title="Free Period"
                                    subtitle={`${period.name} (${period.startTime} - ${period.endTime})`}
                                    avatarText={`P${period.periodNumber}`}
                                    avatarBg="#94a3b8"
                                    badge={{ label: 'Free', color: 'default' }}
                                />
                            );
                        }

                        const subjectName = entry.subject?.name || entry.subjectId;
                        const teacherName = hasSubstitute
                            ? `Sub: ${substitute.substituteTeacher?.name || 'Substitute'}`
                            : entry.teacher?.name || 'Instructor TBA';

                        return (
                            <MobileCardItem
                                key={entry.entryId || period.periodNumber}
                                title={subjectName}
                                subtitle={teacherName}
                                avatarText={`P${entry.periodNumber}`}
                                avatarBg="#4f46e5"
                                highlightColor={hasSubstitute ? '#f59e0b' : '#4f46e5'}
                                badges={[
                                    { label: `${period.startTime} - ${period.endTime}`, color: 'primary', variant: 'outlined' },
                                    ...(hasSubstitute ? [{ label: 'Substitute', color: 'warning' as const }] : []),
                                ]}
                                metaItems={[
                                    { label: 'Period', value: period.name },
                                    { label: 'Room', value: entry.roomId || 'Main Class' },
                                ]}
                            />
                        );
                    })}
                </MobileCardList>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h5" fontWeight={600}>My Class Timetable</Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Button
                        variant="outlined"
                        color="success"
                        startIcon={<PdfIcon />}
                        onClick={handleExportPdf}
                        size="small"
                    >
                        Export PDF
                    </Button>
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={(_, v) => v && setViewMode(v)}
                        size="small"
                    >
                        <ToggleButton value="table"><TableIcon /></ToggleButton>
                        <ToggleButton value="list"><ListIcon /></ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            </Box>

            {/* Today's Schedule Card */}
            <Card sx={{ mb: 3, bgcolor: 'success.light', color: 'success.contrastText' }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <TodayIcon />
                        <Typography variant="h6">Today's Schedule ({todayDayName.charAt(0).toUpperCase() + todayDayName.slice(1)})</Typography>
                    </Box>
                    {todaySchedule.length === 0 ? (
                        <Typography>No classes scheduled for today</Typography>
                    ) : (
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            {todaySchedule.map((entry: TimetableEntry) => {
                                const period = regularPeriods.find((p) => p.periodNumber === entry.periodNumber);
                                const substitute = substituteMap[`${entry.dayOfWeek}-${entry.periodNumber}`];
                                const hasSubstitute = !!substitute;

                                return (
                                    <Tooltip
                                        key={entry.entryId}
                                        title={hasSubstitute ? `Substitute for: ${entry.teacher?.name || 'Original'}` : ''}
                                    >
                                        <Chip
                                            icon={hasSubstitute ? <SwapIcon /> : undefined}
                                            label={
                                                hasSubstitute
                                                    ? `P${entry.periodNumber} (${period?.startTime || ''}): ${entry.subject?.name} - ${substitute.substituteTeacher?.name || 'Sub'}`
                                                    : `P${entry.periodNumber} (${period?.startTime || ''}): ${entry.subject?.name || entry.subjectId} - ${entry.teacher?.name || 'TBA'}`
                                            }
                                            sx={{
                                                bgcolor: hasSubstitute ? '#fff3e0' : 'white',
                                                color: hasSubstitute ? '#e65100' : 'success.dark',
                                                border: hasSubstitute ? '2px solid #ff9800' : undefined
                                            }}
                                        />
                                    </Tooltip>
                                );
                            })}
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Timetable View */}
            <Paper sx={{ p: 2, overflow: 'auto' }}>
                {viewMode === 'table' ? (
                    /* Table View */
                    <Box sx={{ overflowX: 'auto' }}>
                        <Box
                            component="table"
                            sx={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                '& th, & td': {
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    p: 1,
                                    textAlign: 'center',
                                    minWidth: 100,
                                },
                                '& th': {
                                    bgcolor: 'success.main',
                                    color: 'white',
                                    fontWeight: 600,
                                },
                            }}
                        >
                            <thead>
                                <tr>
                                    <th>Period</th>
                                    {config.workingDays.map((day) => (
                                        <th
                                            key={day}
                                            style={{ backgroundColor: day === todayDayName ? '#2e7d32' : undefined }}
                                        >
                                            {day.charAt(0).toUpperCase() + day.slice(1)}
                                            {day === todayDayName && ' ★'}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {regularPeriods.map((period) => (
                                    <tr key={period.periodNumber}>
                                        <td style={{ fontWeight: 600, backgroundColor: '#f5f5f5' }}>
                                            <Typography variant="body2" fontWeight={600}>{period.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {period.startTime} - {period.endTime}
                                            </Typography>
                                        </td>
                                        {config.workingDays.map((day) => {
                                            const entry = entryMap[`${day}-${period.periodNumber}`];
                                            const substitute = substituteMap[`${day}-${period.periodNumber}`];
                                            const hasSubstitute = !!substitute && day === todayDayName;

                                            return (
                                                <td
                                                    key={`${day}-${period.periodNumber}`}
                                                    style={{
                                                        backgroundColor: hasSubstitute
                                                            ? '#fff3e0' // Orange tint for substituted
                                                            : (entry ? getEntryColor(entry) : (day === todayDayName ? '#e8f5e9' : 'white')),
                                                        border: hasSubstitute ? '2px solid #ff9800' : undefined,
                                                    }}
                                                >
                                                    {entry ? (
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={600}>
                                                                {entry.subject?.name || entry.subjectId}
                                                            </Typography>

                                                            {/* Original Teacher - strikethrough if has substitute */}
                                                            <Typography
                                                                variant="caption"
                                                                color={hasSubstitute ? 'error' : 'text.secondary'}
                                                                sx={hasSubstitute ? { textDecoration: 'line-through' } : {}}
                                                            >
                                                                {entry.teacher?.name || 'TBA'}
                                                            </Typography>

                                                            {/* Substitute Teacher Display */}
                                                            {hasSubstitute && (
                                                                <Tooltip title={`Substitute for: ${entry.teacher?.name || 'Original'}`}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                                                        <SwapIcon sx={{ fontSize: 14, color: 'success.main' }} />
                                                                        <Typography variant="caption" color="success.main" fontWeight={600}>
                                                                            {substitute.substituteTeacher?.name}
                                                                        </Typography>
                                                                    </Box>
                                                                </Tooltip>
                                                            )}
                                                        </Box>
                                                    ) : (
                                                        <Typography variant="body2" color="text.disabled">-</Typography>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </Box>
                    </Box>
                ) : (
                    /* List View */
                    <Box>
                        {config.workingDays.map((day) => (
                            <Box key={day} sx={{ mb: 3 }}>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        mb: 1,
                                        textTransform: 'capitalize',
                                        color: day === todayDayName ? 'success.main' : 'text.primary',
                                    }}
                                >
                                    {day} {day === todayDayName && '(Today)'}
                                </Typography>
                                {regularPeriods.map((period) => {
                                    const entry = entryMap[`${day}-${period.periodNumber}`];
                                    return (
                                        <Box
                                            key={period.periodNumber}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                p: 1,
                                                mb: 1,
                                                borderRadius: 1,
                                                bgcolor: entry ? getEntryColor(entry) : 'action.hover',
                                            }}
                                        >
                                            <Box sx={{ minWidth: 100 }}>
                                                <Typography variant="body2" fontWeight={600}>{period.name}</Typography>
                                                <Typography variant="caption">{period.startTime} - {period.endTime}</Typography>
                                            </Box>
                                            <Box sx={{ ml: 2, flex: 1 }}>
                                                {entry ? (
                                                    <Typography variant="body2">
                                                        {entry.subject?.name} - {entry.teacher?.name || 'TBA'}
                                                    </Typography>
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">Free Period</Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    );
                                })}
                                <Divider sx={{ mt: 2 }} />
                            </Box>
                        ))}
                    </Box>
                )}
            </Paper>

            {/* Stats */}
            <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip label={`Total Periods: ${entries.length}`} color="success" variant="outlined" />
                <Chip label={`Per Week: ${entries.length}`} color="secondary" variant="outlined" />
            </Box>
        </Box>
    );
};

export default MyTimetable;

