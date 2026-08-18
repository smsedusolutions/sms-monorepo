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
    Stack,
} from '@mui/material';
import {
    TableChart as TableIcon,
    List as ListIcon,
    Today as TodayIcon,
    PictureAsPdf as PdfIcon,
    EventAvailable as FreePeriodIcon,
    SwapHoriz as SwapIcon,
} from '@mui/icons-material';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useGetTeacherTimetable, useGetTeacherFreePeriods, useGetSubstitutesForDate } from '../../../queries/Timetable';
import TokenService from '../../../queries/token/tokenService';
import type { TimetableEntry } from '../../../types/timetable.types';
import { useIsMobile } from '../../../hooks/useIsMobile';

type ViewMode = 'table' | 'list' | 'free';

const MyTimetable = () => {
    const isMobile = useIsMobile();
    const schoolId = TokenService.getSchoolId() || '';
    const teacherId = TokenService.getUserId() || '';
    const [viewMode, setViewMode] = useState<ViewMode>('table');

    // Get today's date for substitutes
    const todayDate = new Date().toISOString().split('T')[0];

    const { data: timetableData, isLoading, error } = useGetTeacherTimetable(schoolId, teacherId);
    const { data: freePeriodsData } = useGetTeacherFreePeriods(schoolId, teacherId);
    const { data: substitutesData } = useGetSubstitutesForDate(schoolId, todayDate);

    const config = timetableData?.data?.config;
    const entries = timetableData?.data?.entries || [];
    const freePeriods = freePeriodsData?.data || { teacherId: '', freePeriods: {} as Record<string, any[]> };
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

    // Substitutes where this teacher's periods are being covered by someone else
    const coveredPeriodsMap = useMemo(() => {
        const map: Record<string, any> = {};
        substitutes.forEach((sub: any) => {
            if (sub.originalTeacherId === teacherId) {
                map[`${sub.entry?.dayOfWeek}-${sub.entry?.periodNumber}`] = sub;
            }
        });
        return map;
    }, [substitutes, teacherId]);

    // Substitutes where this teacher is covering for someone else
    const substituteAssignmentsMap = useMemo(() => {
        const map: Record<string, any> = {};
        substitutes.forEach((sub: any) => {
            if (sub.substituteTeacherId === teacherId) {
                map[`${sub.entry?.dayOfWeek}-${sub.entry?.periodNumber}`] = sub;
            }
        });
        return map;
    }, [substitutes, teacherId]);

    // Get today's day
    const today = new Date();
    const todayDayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const [selectedMobileDay, setSelectedMobileDay] = useState<string>(todayDayName);

    // Today's schedule (including substitute assignments as extra periods)
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
        doc.setTextColor(25, 118, 210); // Primary blue color
        doc.text('My Timetable', 14, 20);

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
                    row.push(`${entry.subject?.name || entry.subjectId}\n${entry.class?.name || ''} ${entry.class?.section || ''}`);
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
                fillColor: [25, 118, 210],
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
        doc.save('my-timetable.pdf');
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

    const currentMobileDaySchedule = entries
        .filter((e: TimetableEntry) => e.dayOfWeek === selectedMobileDay)
        .sort((a: TimetableEntry, b: TimetableEntry) => a.periodNumber - b.periodNumber);

    // Mobile View
    if (isMobile) {
        return (
            <Box sx={{ width: '100%', p: { xs: 1.5, sm: 2 }, pb: { xs: 9, sm: 4 } }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" fontWeight={700} color="text.primary">
                        My Timetable
                    </Typography>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<PdfIcon fontSize="small" />}
                        onClick={handleExportPdf}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                    >
                        Export PDF
                    </Button>
                </Box>

                {/* Simple Day Buttons Row */}
                <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1, mb: 2, '&::-webkit-scrollbar': { display: 'none' } }}>
                    {(config?.workingDays || []).map((day) => {
                        const isSelected = selectedMobileDay === day;
                        const isToday = day === todayDayName;
                        const count = entries.filter((e) => e.dayOfWeek === day).length;

                        return (
                            <Button
                                key={day}
                                variant={isSelected ? 'contained' : 'outlined'}
                                color={isSelected ? 'primary' : 'inherit'}
                                onClick={() => setSelectedMobileDay(day)}
                                size="small"
                                sx={{
                                    minWidth: 64,
                                    py: 0.8,
                                    px: 1.5,
                                    borderRadius: 2.5,
                                    border: isSelected ? 'none' : '1px solid #e2e8f0',
                                    bgcolor: isSelected ? 'primary.main' : '#ffffff',
                                    color: isSelected ? '#ffffff' : '#334155',
                                    boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.12)' : 'none',
                                    textTransform: 'none',
                                    flexShrink: 0,
                                }}
                            >
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="body2" fontWeight={700} sx={{ textTransform: 'capitalize' }}>
                                        {day.slice(0, 3)}
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontSize: '0.68rem', opacity: isSelected ? 0.9 : 0.7, display: 'block', lineHeight: 1 }}>
                                        {isToday ? 'Today' : `${count} classes`}
                                    </Typography>
                                </Box>
                            </Button>
                        );
                    })}
                </Box>

                {/* Day Summary Title */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, px: 0.5 }}>
                    <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                        {selectedMobileDay} Schedule
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {currentMobileDaySchedule.length} of {regularPeriods.length} periods active
                    </Typography>
                </Box>

                {/* Simple Period Cards List */}
                <Stack spacing={1.5}>
                    {regularPeriods.map((period) => {
                        const entry = entryMap[`${selectedMobileDay}-${period.periodNumber}`];
                        const isCovered = coveredPeriodsMap[`${selectedMobileDay}-${period.periodNumber}`] && selectedMobileDay === todayDayName;
                        const substituteAssignment = substituteAssignmentsMap[`${selectedMobileDay}-${period.periodNumber}`];
                        const isSubstituting = !!substituteAssignment && selectedMobileDay === todayDayName;
                        const isFree = !entry && !isSubstituting;

                        const subjectName = isSubstituting
                            ? substituteAssignment.entry?.subject?.name || 'Substitute Class'
                            : entry?.subject?.name || entry?.subjectId || 'Free Period';

                        const className = isSubstituting
                            ? `${substituteAssignment.entry?.class?.name || substituteAssignment.entry?.classId || ''} ${substituteAssignment.entry?.class?.section || substituteAssignment.entry?.sectionId || ''}`
                            : entry
                                ? `${entry.class?.name || entry.classId || ''} ${entry.class?.section || ''}`
                                : 'No class scheduled';

                        const roomInfo = entry?.roomId ? `Room: ${entry.roomId}` : '';

                        return (
                            <Paper
                                key={period.periodNumber}
                                elevation={0}
                                sx={{
                                    p: 1.5,
                                    borderRadius: 2.5,
                                    border: '1px solid',
                                    borderColor: isSubstituting
                                        ? '#f59e0b'
                                        : isCovered
                                            ? '#cbd5e1'
                                            : isFree
                                                ? '#e2e8f0'
                                                : '#e2e8f0',
                                    bgcolor: isFree ? '#f8fafc' : '#ffffff',
                                    opacity: isCovered ? 0.65 : 1,
                                }}
                            >
                                {/* Top Row: Period Tag + Subject + Time */}
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                        <Box
                                            sx={{
                                                px: 0.9,
                                                py: 0.2,
                                                borderRadius: 1.5,
                                                bgcolor: isSubstituting ? '#fffbe6' : isFree ? '#e2e8f0' : '#eff6ff',
                                                color: isSubstituting ? '#d97706' : isFree ? '#64748b' : '#2563eb',
                                                fontWeight: 700,
                                                fontSize: '0.75rem',
                                                flexShrink: 0,
                                            }}
                                        >
                                            P{period.periodNumber}
                                        </Box>
                                        <Typography
                                            variant="subtitle1"
                                            fontWeight={700}
                                            noWrap
                                            sx={{
                                                color: isFree ? 'text.secondary' : 'text.primary',
                                                textDecoration: isCovered ? 'line-through' : 'none',
                                                fontSize: '0.95rem',
                                            }}
                                        >
                                            {subjectName}
                                        </Typography>
                                    </Box>

                                    <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ flexShrink: 0 }}>
                                        {period.startTime} - {period.endTime}
                                    </Typography>
                                </Box>

                                {/* Bottom Row: Class, Section, Room, Badges */}
                                <Box sx={{ pl: 4.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 0.5 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                        {className} {roomInfo ? `• ${roomInfo}` : ''}
                                    </Typography>

                                    {isSubstituting && (
                                        <Chip
                                            label={`Covering for ${substituteAssignment.originalTeacher?.name || 'Peer'}`}
                                            size="small"
                                            color="warning"
                                            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }}
                                        />
                                    )}

                                    {isCovered && (
                                        <Chip
                                            label={`Covered by ${coveredPeriodsMap[`${selectedMobileDay}-${period.periodNumber}`]?.substituteTeacher?.name || 'Sub'}`}
                                            size="small"
                                            sx={{ height: 20, fontSize: '0.68rem', bgcolor: '#e2e8f0' }}
                                        />
                                    )}

                                    {isFree && (
                                        <Chip
                                            label="Free"
                                            size="small"
                                            sx={{ height: 20, fontSize: '0.68rem', bgcolor: '#f1f5f9', color: '#64748b' }}
                                        />
                                    )}
                                </Box>
                            </Paper>
                        );
                    })}
                </Stack>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h5" fontWeight={600}>My Timetable</Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Button
                        variant="outlined"
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
                        <ToggleButton value="free"><FreePeriodIcon /></ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            </Box>

            {/* Today's Schedule Card */}
            <Card sx={{ mb: 3, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
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
                                return (
                                    <Chip
                                        key={entry.entryId}
                                        label={`P${entry.displayPeriodNumber || entry.periodNumber} (${period?.startTime || ''}): ${entry.subject?.name || entry.subjectId} - ${entry.class?.name || entry.classId} ${entry.class?.section || ''}`}
                                        sx={{ bgcolor: 'white', color: 'primary.main' }}
                                    />
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
                                    bgcolor: 'primary.main',
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
                                            style={{ backgroundColor: day === todayDayName ? '#1976d2' : undefined }}
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
                                            <Typography variant="body2" fontWeight={600}>
                                                {period.displayPeriodNumber ? `P${period.displayPeriodNumber} - ` : ''}{period.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {period.startTime} - {period.endTime}
                                            </Typography>
                                        </td>
                                        {config.workingDays.map((day) => {
                                            const entry = entryMap[`${day}-${period.periodNumber}`];
                                            const isCovered = coveredPeriodsMap[`${day}-${period.periodNumber}`] && day === todayDayName;
                                            const substituteAssignment = substituteAssignmentsMap[`${day}-${period.periodNumber}`];
                                            const isSubstituting = !!substituteAssignment && day === todayDayName;

                                            return (
                                                <td
                                                    key={`${day}-${period.periodNumber}`}
                                                    style={{
                                                        backgroundColor: isSubstituting
                                                            ? '#fff3e0' // Orange for substitute assignment
                                                            : isCovered
                                                                ? '#f5f5f5' // Grey for covered period
                                                                : (entry ? getEntryColor(entry) : (day === todayDayName ? '#e3f2fd' : 'white')),
                                                        border: isSubstituting
                                                            ? '2px solid #ff9800'
                                                            : isCovered
                                                                ? '2px dashed #bdbdbd'
                                                                : undefined,
                                                        opacity: isCovered && !isSubstituting ? 0.6 : 1,
                                                    }}
                                                >
                                                    {/* Show substitute assignment (covering for someone) */}
                                                    {isSubstituting ? (
                                                        <Tooltip title={`Covering for: ${substituteAssignment.originalTeacher?.name}`}>
                                                            <Box>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                                                    <SwapIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                                                                    <Typography variant="body2" fontWeight={600} color="warning.dark">
                                                                        {substituteAssignment.entry?.subject?.name || 'Cover'}
                                                                    </Typography>
                                                                </Box>
                                                                <Typography variant="caption" color="warning.dark">
                                                                    {substituteAssignment.entry?.classId} {substituteAssignment.entry?.sectionId}
                                                                </Typography>
                                                                <Chip
                                                                    label="Substitute"
                                                                    size="small"
                                                                    color="warning"
                                                                    sx={{ fontSize: '0.6rem', height: 16, mt: 0.5 }}
                                                                />
                                                            </Box>
                                                        </Tooltip>
                                                    ) : isCovered ? (
                                                        /* Period is covered by someone else */
                                                        <Tooltip title={`Covered by: ${coveredPeriodsMap[`${day}-${period.periodNumber}`]?.substituteTeacher?.name}`}>
                                                            <Box>
                                                                <Typography
                                                                    variant="body2"
                                                                    color="text.disabled"
                                                                    sx={{ textDecoration: 'line-through' }}
                                                                >
                                                                    {entry?.subject?.name || entry?.subjectId}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.disabled">
                                                                    {entry?.class?.name} {entry?.class?.section}
                                                                </Typography>
                                                                <Chip
                                                                    label="Covered"
                                                                    size="small"
                                                                    sx={{ fontSize: '0.6rem', height: 16, mt: 0.5, bgcolor: '#e0e0e0' }}
                                                                />
                                                            </Box>
                                                        </Tooltip>
                                                    ) : entry ? (
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={600}>
                                                                {entry.subject?.name || entry.subjectId}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {entry.class?.name} {entry.class?.section}
                                                            </Typography>
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
                ) : viewMode === 'list' ? (
                    /* List View */
                    <Box>
                        {config.workingDays.map((day) => (
                            <Box key={day} sx={{ mb: 3 }}>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        mb: 1,
                                        textTransform: 'capitalize',
                                        color: day === todayDayName ? 'primary.main' : 'text.primary',
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
                                                        {entry.subject?.name} - {entry.class?.name} {entry.class?.section}
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
                ) : (
                    /* Free Periods View */
                    <Box>
                        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FreePeriodIcon color="success" />
                            My Free Periods
                        </Typography>

                        {/* Today's Free Periods Highlight */}
                        {freePeriods.freePeriods?.[todayDayName] && (
                            <Card sx={{ mb: 3, bgcolor: 'success.main', color: 'success.contrastText' }}>
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                                        Today's Free Periods ({todayDayName.charAt(0).toUpperCase() + todayDayName.slice(1)})
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        {freePeriods.freePeriods[todayDayName]?.map((fp: any) => (
                                            <Chip
                                                key={fp.periodNumber}
                                                label={`${fp.periodName || 'Period ' + fp.periodNumber} (${fp.startTime} - ${fp.endTime})`}
                                                sx={{ bgcolor: 'white', color: 'success.dark' }}
                                            />
                                        ))}
                                    </Box>
                                </CardContent>
                            </Card>
                        )}

                        {/* All Days Free Periods */}
                        {config.workingDays.map((day) => {
                            const dayFreePeriods = freePeriods.freePeriods?.[day] || [];
                            return (
                                <Box key={day} sx={{ mb: 2 }}>
                                    <Typography
                                        variant="subtitle1"
                                        fontWeight={600}
                                        sx={{
                                            textTransform: 'capitalize',
                                            color: day === todayDayName ? 'success.main' : 'text.primary',
                                            mb: 1,
                                        }}
                                    >
                                        {day} {day === todayDayName && '(Today)'}
                                    </Typography>
                                    {dayFreePeriods.length === 0 ? (
                                        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                            No free periods
                                        </Typography>
                                    ) : (
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', ml: 2 }}>
                                            {dayFreePeriods.map((fp: any) => (
                                                <Chip
                                                    key={fp.periodNumber}
                                                    label={`${fp.periodName || 'Period ' + fp.periodNumber} (${fp.startTime} - ${fp.endTime})`}
                                                    color={day === todayDayName ? 'success' : 'default'}
                                                    variant="outlined"
                                                />
                                            ))}
                                        </Box>
                                    )}
                                    <Divider sx={{ mt: 2 }} />
                                </Box>
                            );
                        })}

                        {/* Summary */}
                        <Box sx={{ mt: 3 }}>
                            <Alert severity="info">
                                <Typography variant="body2">
                                    <strong>Total Free Periods:</strong> {Object.values(freePeriods.freePeriods || {}).flat().length} per week
                                </Typography>
                            </Alert>
                        </Box>
                    </Box>
                )}
            </Paper>

            {/* Stats */}
            <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip label={`Total Classes: ${entries.length}`} color="primary" variant="outlined" />
                <Chip label={`Classes per Week: ${entries.length}`} color="secondary" variant="outlined" />
                <Chip label={`Free Periods: ${Object.values(freePeriods.freePeriods || {}).flat().length}`} color="success" variant="outlined" />
            </Box>
        </Box>
    );
};

export default MyTimetable;

