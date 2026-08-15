import { useMemo, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    Chip,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Grid,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Divider,
    Tooltip,
    LinearProgress,
} from '@mui/material';
import {
    Person as PersonIcon,
    MeetingRoom as RoomIcon,
    Refresh as RefreshIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import {
    useGetConflictReport,
    useDeleteEntry,
    useUpdateEntry,
    useGetFreeTeachers
} from '../../../queries/Timetable';
import TokenService from '../../../queries/token/tokenService';
import ConfirmationDialog from '../../../components/Dialogs/ConfirmationDialog';
import { useIsMobile } from '../../../hooks/useIsMobile';

const ConflictManagement = () => {
    const isMobile = useIsMobile();
    const schoolId = TokenService.getSchoolId() || '';

    const { data: conflictData, isLoading, error, refetch, isRefetching } = useGetConflictReport(schoolId);
    const deleteEntryMutation = useDeleteEntry(schoolId);
    const updateEntryMutation = useUpdateEntry(schoolId);

    const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<any>(null);
    const [entryIdToDelete, setEntryIdToDelete] = useState<string | null>(null);
    const [newTeacherId, setNewTeacherId] = useState('');
    const [selectedConflictParams, setSelectedConflictParams] = useState({ day: '', period: 0 });

    const { data: freeTeachersData, isLoading: isLoadingFreeTeachers } = useGetFreeTeachers(
        schoolId,
        selectedConflictParams.day,
        selectedConflictParams.period
    );

    const freeTeachers = freeTeachersData?.data || [];

    const handleDeleteEntry = (entryId: string) => {
        setEntryIdToDelete(entryId);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!entryIdToDelete) return;
        try {
            await deleteEntryMutation.mutateAsync(entryIdToDelete);
            setDeleteDialogOpen(false);
            setEntryIdToDelete(null);
            refetch();
        } catch (err) {
            console.error('Failed to delete entry:', err);
        }
    };

    const handleCloseDelete = () => {
        setDeleteDialogOpen(false);
        setEntryIdToDelete(null);
    };

    const handleOpenReassign = (entry: any, day: string, period: number) => {
        setSelectedEntry(entry);
        setNewTeacherId(entry.teacherId);
        setSelectedConflictParams({ day, period });
        setReassignDialogOpen(true);
    };

    const handleCloseReassign = () => {
        setReassignDialogOpen(false);
        setSelectedEntry(null);
        setNewTeacherId('');
    };

    const handleConfirmReassign = async () => {
        if (!selectedEntry || !newTeacherId) return;

        try {
            await updateEntryMutation.mutateAsync({
                entryId: selectedEntry.entryId,
                data: { teacherId: newTeacherId }
            });
            handleCloseReassign();
            refetch();
        } catch (err) {
            console.error('Failed to reassign teacher:', err);
        }
    };

    const conflictReport = conflictData?.data;

    // Filter conflicts by type
    const teacherConflicts = useMemo(() => {
        return conflictReport?.conflicts?.filter((c) => c.type === 'teacher') || [];
    }, [conflictReport]);

    const roomConflicts = useMemo(() => {
        return conflictReport?.conflicts?.filter((c) => c.type === 'room') || [];
    }, [conflictReport]);

    const totalConflicts = conflictReport?.totalConflicts || 0;

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
                <Alert severity="error">Failed to load conflict report</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 1.5, sm: 3 }, position: 'relative' }}>
            {/* Global Loader during Refetching */}
            {(isRefetching || updateEntryMutation.isPending || deleteEntryMutation.isPending) && (
                <Box sx={{ width: '100%', position: 'absolute', top: 0, left: 0, zIndex: 10 }}>
                    <LinearProgress color="primary" />
                </Box>
            )}

            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
                {!isMobile ? (
                    <Typography variant="h5" fontWeight={700} color="#0f172a">
                        Conflict Management
                    </Typography>
                ) : (
                    <Chip 
                        label={totalConflicts === 0 ? "All Schedules Conflict-free" : `${totalConflicts} Active Conflict${totalConflicts > 1 ? 's' : ''}`}
                        color={totalConflicts === 0 ? "success" : "error"}
                        size="small"
                        sx={{ fontWeight: 700 }}
                    />
                )}
                <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={() => refetch()}
                    size="small"
                    sx={{ borderRadius: 2 }}
                >
                    Refresh
                </Button>
            </Box>

            {/* Summary Cards */}
            <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(3, 1fr)' }, 
                gap: 1.5, 
                mb: 2.5 
            }}>
                <Card 
                    variant="outlined"
                    sx={{ 
                        borderRadius: 2.5,
                        bgcolor: totalConflicts === 0 ? '#15803d' : '#b91c1c',
                        color: 'white',
                        textAlign: 'center',
                    }}
                >
                    <CardContent sx={{ p: { xs: 1.25, sm: 2 }, '&:last-child': { pb: { xs: 1.25, sm: 2 } } }}>
                        <Typography variant="h5" fontWeight={800} color="inherit">
                            {totalConflicts}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.95, color: 'inherit', fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem' } }} display="block">
                            Total Conflicts
                        </Typography>
                    </CardContent>
                </Card>

                <Card variant="outlined" sx={{ borderRadius: 2.5, textAlign: 'center', bgcolor: 'background.paper' }}>
                    <CardContent sx={{ p: { xs: 1.25, sm: 2 }, '&:last-child': { pb: { xs: 1.25, sm: 2 } } }}>
                        <Typography variant="h5" fontWeight={800} color="primary.main">
                            {teacherConflicts.length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }} display="block">
                            Teacher Conflicts
                        </Typography>
                    </CardContent>
                </Card>

                <Card variant="outlined" sx={{ borderRadius: 2.5, textAlign: 'center', bgcolor: 'background.paper' }}>
                    <CardContent sx={{ p: { xs: 1.25, sm: 2 }, '&:last-child': { pb: { xs: 1.25, sm: 2 } } }}>
                        <Typography variant="h5" fontWeight={800} color="secondary.main">
                            {roomConflicts.length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }} display="block">
                            Room Conflicts
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            {totalConflicts === 0 ? (
                <Alert severity="success" sx={{ mb: 3, borderRadius: 2.5 }}>
                    No scheduling conflicts detected. Your timetable is conflict-free!
                </Alert>
            ) : (
                <>
                    {/* Teacher Conflicts */}
                    {teacherConflicts.length > 0 && (
                        <Paper sx={{ mb: 3, p: { xs: 1.5, sm: 2 }, borderRadius: 3 }} variant="outlined">
                            <Typography variant="h6" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                                <PersonIcon color="primary" />
                                Teacher Double-Booking Conflicts
                            </Typography>
                            {isMobile ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {teacherConflicts.map((conflict, index) => (
                                        <Card key={index} variant="outlined" sx={{ borderRadius: 2, p: 1.5, borderColor: 'error.light', bgcolor: 'error.50' }}>
                                            <Typography variant="subtitle2" fontWeight={700} color="error.dark">
                                                {conflict.description}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1, my: 1 }}>
                                                <Chip label={conflict.dayOfWeek?.toUpperCase()} size="small" variant="outlined" />
                                                <Chip label={`Period ${conflict.periodNumber}`} size="small" color="primary" />
                                            </Box>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                                                {conflict.entries?.map((entry: any, i: number) => (
                                                    <Paper key={i} sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'background.paper', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} elevation={0}>
                                                        <Box>
                                                            <Typography variant="subtitle2" fontWeight={700} color="primary">
                                                                {entry.className} - {entry.sectionName}
                                                            </Typography>
                                                            <Typography variant="body2">{entry.subjectName}</Typography>
                                                            <Typography variant="caption" color="text.secondary">Teacher: {entry.teacherName}</Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                            <IconButton
                                                                size="small"
                                                                color="primary"
                                                                onClick={() => handleOpenReassign(entry, conflict.dayOfWeek, conflict.periodNumber)}
                                                            >
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => handleDeleteEntry(entry.entryId)}
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Box>
                                                    </Paper>
                                                ))}
                                            </Box>
                                        </Card>
                                    ))}
                                </Box>
                            ) : (
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: 'grey.100' }}>
                                                <TableCell><strong>Description</strong></TableCell>
                                                <TableCell><strong>Timing</strong></TableCell>
                                                <TableCell><strong>Conflicting Assignments</strong></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {teacherConflicts.map((conflict, index) => (
                                                <TableRow 
                                                    key={index} 
                                                    sx={{ 
                                                        '&:vertical-align': 'top',
                                                        '& td': {
                                                            borderBottom: index < teacherConflicts.length - 1 ? '2px dashed !important' : 'none',
                                                            borderColor: 'grey.400 !important',
                                                            pb: 3,
                                                            pt: 3
                                                        }
                                                    }}
                                                >
                                                    <TableCell sx={{ minWidth: 200 }}>
                                                        <Typography variant="body2" fontWeight={600} color="error.main">
                                                            {conflict.description}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" display="block">
                                                            Resolve this by reassigning or deleting one of the entries below.
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                            <Chip
                                                                label={conflict.dayOfWeek?.charAt(0).toUpperCase() + conflict.dayOfWeek?.slice(1)}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                            <Chip
                                                                label={`Period ${conflict.periodNumber}`}
                                                                size="small"
                                                                color="primary"
                                                            />
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Grid container spacing={1}>
                                                            {conflict.entries?.map((entry: any, i: number) => (
                                                                <Grid size={{ xs: 12, md: 6 }} key={i}>
                                                                    <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                                                                        <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                            <Box>
                                                                                <Typography variant="subtitle2" color="primary.main" fontWeight={700}>
                                                                                    {entry.className} - {entry.sectionName}
                                                                                </Typography>
                                                                                <Typography variant="body2" fontWeight={500}>
                                                                                    {entry.subjectName}
                                                                                </Typography>
                                                                                <Typography variant="caption" color="text.secondary">
                                                                                    Teacher: {entry.teacherName}
                                                                                </Typography>
                                                                            </Box>
                                                                            <Box sx={{ display: 'flex' }}>
                                                                                <Tooltip title="Reassign Teacher">
                                                                                    <IconButton
                                                                                        size="small"
                                                                                        color="primary"
                                                                                        onClick={() => handleOpenReassign(entry, conflict.dayOfWeek, conflict.periodNumber)}
                                                                                    >
                                                                                        <EditIcon fontSize="small" />
                                                                                    </IconButton>
                                                                                </Tooltip>
                                                                                <Tooltip title="Delete Entry">
                                                                                    <IconButton
                                                                                        size="small"
                                                                                        color="error"
                                                                                        onClick={() => handleDeleteEntry(entry.entryId)}
                                                                                    >
                                                                                        <DeleteIcon fontSize="small" />
                                                                                    </IconButton>
                                                                                </Tooltip>
                                                                            </Box>
                                                                        </Box>
                                                                    </Card>
                                                                </Grid>
                                                            ))}
                                                        </Grid>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Paper>
                    )}

                    {/* Room Conflicts */}
                    {roomConflicts.length > 0 && (
                        <Paper sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3, mb: 3 }} variant="outlined">
                            <Typography variant="h6" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                                <RoomIcon color="secondary" />
                                Room Double-Booking Conflicts
                            </Typography>
                            {isMobile ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {roomConflicts.map((conflict, index) => (
                                        <Card key={index} variant="outlined" sx={{ borderRadius: 2, p: 1.5, borderColor: 'secondary.light' }}>
                                            <Typography variant="subtitle2" fontWeight={700} color="secondary.main">
                                                {conflict.description}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1, my: 1 }}>
                                                <Chip label={conflict.dayOfWeek?.toUpperCase()} size="small" variant="outlined" />
                                                <Chip label={`Period ${conflict.periodNumber}`} size="small" color="secondary" />
                                            </Box>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                                                {conflict.entries?.map((entry: any, i: number) => (
                                                    <Paper key={i} sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'background.paper', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} elevation={0}>
                                                        <Box>
                                                            <Typography variant="subtitle2" fontWeight={700} color="secondary">
                                                                {entry.className} - {entry.sectionName}
                                                            </Typography>
                                                            <Typography variant="body2">{entry.subjectName}</Typography>
                                                            <Typography variant="caption" color="text.secondary">Room: {entry.roomName || entry.roomId}</Typography>
                                                        </Box>
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleDeleteEntry(entry.entryId)}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Paper>
                                                ))}
                                            </Box>
                                        </Card>
                                    ))}
                                </Box>
                            ) : (
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: 'grey.100' }}>
                                                <TableCell><strong>Description</strong></TableCell>
                                                <TableCell><strong>Timing</strong></TableCell>
                                                <TableCell><strong>Conflicting Assignments</strong></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {roomConflicts.map((conflict, index) => (
                                                <TableRow key={index}>
                                                    <TableCell sx={{ minWidth: 200 }}>
                                                        <Typography variant="body2" fontWeight={600} color="error.main">
                                                            {conflict.description}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                            <Chip
                                                                label={conflict.dayOfWeek?.charAt(0).toUpperCase() + conflict.dayOfWeek?.slice(1)}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                            <Chip
                                                                label={`Period ${conflict.periodNumber}`}
                                                                size="small"
                                                                color="secondary"
                                                            />
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Grid container spacing={1}>
                                                            {conflict.entries?.map((entry: any, i: number) => (
                                                                <Grid size={{ xs: 12, md: 6 }} key={i}>
                                                                    <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                                                                        <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                            <Box>
                                                                                <Typography variant="subtitle2" color="secondary.main" fontWeight={700}>
                                                                                    {entry.className} - {entry.sectionName}
                                                                                </Typography>
                                                                                <Typography variant="body2" fontWeight={500}>
                                                                                    {entry.subjectName}
                                                                                </Typography>
                                                                                <Typography variant="caption" color="text.secondary">
                                                                                    Room: {entry.roomName || entry.roomId}
                                                                                </Typography>
                                                                            </Box>
                                                                            <IconButton
                                                                                size="small"
                                                                                color="error"
                                                                                onClick={() => handleDeleteEntry(entry.entryId)}
                                                                            >
                                                                                <DeleteIcon fontSize="small" />
                                                                            </IconButton>
                                                                        </Box>
                                                                    </Card>
                                                                </Grid>
                                                            ))}
                                                        </Grid>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Paper>
                    )}
                </>
            )}

            {/* Reassign Teacher Dialog */}
            <Dialog 
                open={reassignDialogOpen} 
                onClose={handleCloseReassign} 
                maxWidth="xs" 
                fullWidth
                fullScreen={isMobile}
                PaperProps={{
                    sx: {
                        borderRadius: isMobile ? 0 : 3,
                    }
                }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider', py: { xs: 1.5, sm: 2 } }}>
                    <Typography variant="h6" fontWeight={700}>Reassign Teacher</Typography>
                    <IconButton onClick={handleCloseReassign} size="small" edge="end">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Box sx={{ mt: 1, mb: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Class:</strong> {selectedEntry?.className} - {selectedEntry?.sectionName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Subject:</strong> {selectedEntry?.subjectName}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Select an available teacher for {selectedConflictParams.day} - Period {selectedConflictParams.period}
                        </Typography>
                        <FormControl fullWidth size="small">
                            <InputLabel>Select Free Teacher</InputLabel>
                            <Select
                                value={newTeacherId}
                                label="Select Free Teacher"
                                onChange={(e) => setNewTeacherId(e.target.value)}
                                disabled={isLoadingFreeTeachers}
                            >
                                <MenuItem value=""><em>Select Teacher</em></MenuItem>
                                {freeTeachers.map((t) => (
                                    <MenuItem key={t.teacherId} value={t.teacherId}>
                                        {t.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {freeTeachers.length === 0 && !isLoadingFreeTeachers && (
                            <Alert severity="warning" sx={{ mt: 2 }}>
                                No other free teachers found for this slot.
                            </Alert>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ 
                    px: { xs: 2, sm: 3 }, 
                    py: 2, 
                    borderTop: '1px solid', 
                    borderColor: 'divider',
                    flexDirection: { xs: 'column-reverse', sm: 'row' },
                    gap: 1,
                    '& > button': {
                        width: { xs: '100%', sm: 'auto' },
                        height: 44,
                    }
                }}>
                    <Button onClick={handleCloseReassign} color="inherit">Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleConfirmReassign}
                        disabled={!newTeacherId || newTeacherId === selectedEntry?.teacherId || updateEntryMutation.isPending}
                    >
                        {updateEntryMutation.isPending ? 'Updating...' : 'Assign Teacher'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <ConfirmationDialog
                open={deleteDialogOpen}
                onClose={handleCloseDelete}
                onConfirm={handleConfirmDelete}
                title="Delete Timetable Entry"
                description="Are you sure you want to delete this timetable entry? This action cannot be undone."
                confirmLabel="Delete"
                cancelLabel="Cancel"
                variant="danger"
                isLoading={deleteEntryMutation.isPending}
            />

            {/* Info Box */}
            <Alert severity="info" sx={{ mt: 3, borderRadius: 2.5, '& .MuiAlert-message': { width: '100%' } }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    How to Resolve Conflicts:
                </Typography>
                <Typography variant="body2" component="div">
                    <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
                        <li><strong>Reassign:</strong> Click the <EditIcon sx={{ fontSize: 16, verticalAlign: 'middle', mx: 0.5 }} color="primary" /> icon to move a teacher to a different class or choose an available teacher from the free list.</li>
                        <li><strong>Delete:</strong> Click the <DeleteIcon sx={{ fontSize: 16, verticalAlign: 'middle', mx: 0.5 }} color="error" /> icon to remove an erroneous entry entirely.</li>
                        <li><strong>Room Conflicts:</strong> These occur when multiple classes are scheduled in the same room. Delete the conflicting entry and assign a different room in the Master Timetable.</li>
                    </ul>
                </Typography>
            </Alert>
        </Box>
    );
};

export default ConflictManagement;
