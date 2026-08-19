import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, Button, Paper, Card, CardContent,
    Avatar, Chip, Grid, List, ListItem, ListItemText,
    ListItemIcon, Divider, CircularProgress, Alert
} from '@mui/material';
import {
    PlayArrow as StartIcon, Stop as StopIcon,
    MyLocation as GpsIcon, HeadsetMic as SupportIcon
} from '@mui/icons-material';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import TokenService from '../../queries/token/tokenService';
import { useUserStore } from '../../stores/userStore';
import { useUpdateTripStatus } from '../../queries/transport';
import RequestChangeDialog from '../../components/Dialogs/RequestChangeDialog';

const TRANSPORT_API = "http://localhost:5004/api/transport";
const SOCKET_URL = "http://localhost:5004";

const DriverDashboard: React.FC = () => {
    const [supportDialogOpen, setSupportDialogOpen] = useState(false);
    const [isTripActive, setIsTripActive] = useState(false);
    const [currentRoute, setCurrentRoute] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const socketRef = useRef<Socket | null>(null);
    const watchIdRef = useRef<number | null>(null);
    const { user, school } = useUserStore();
    const schoolId = school?.schoolId || TokenService.getSchoolId() || '';
    const userId = user?.userId || TokenService.getUserId() || '';

    const updateStatus = useUpdateTripStatus(schoolId, currentRoute?.routeId || '');

    useEffect(() => {
        const fetchAssignedRoute = async () => {
            try {
                // Fetch route assigned to this driver
                const res = await axios.get(`${TRANSPORT_API}/school/${schoolId}/routes`);
                const assigned = res.data.data.find((r: any) =>
                    userId && (r.driverId === userId || r.driver?.userId === userId || r.email === user?.email)
                );
                setCurrentRoute(assigned);
            } catch (err) {
                console.error("Failed to fetch assigned route:", err);
            } finally {
                setLoading(false);
            }
        };

        if (schoolId) {
            fetchAssignedRoute();
        }

        // Initialize Socket
        socketRef.current = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            withCredentials: true
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
            if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
        };
    }, [schoolId, userId]);

    // Auto-resume tracking if DB says trip is active
    useEffect(() => {
        if (currentRoute && currentRoute.currentTrip?.status !== 'stopped' && !isTripActive) {
            console.log("🚦 Resuming active trip from DB status...");
            handleStartTrip();
        }
    }, [currentRoute]);

    const handleStartTrip = async () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        setIsTripActive(true);

        // New: Explicit API call to save check-in status
        try {
            await updateStatus.mutateAsync({
                status: 'on-time',
                driverId: userId,
                vehicleId: currentRoute?.vehicleId || currentRoute?.vehicle?.id
            });
        } catch (err) {
            console.error("Failed to save check-in status to DB:", err);
            // We continue anyway so tracking works, but ideally this should succeed
        }

        // 1. Check-in to the route room
        if (socketRef.current && currentRoute) {
            socketRef.current.emit('driver-check-in', {
                schoolId,
                routeId: currentRoute.routeId,
                driverId: userId,
                vehicleId: currentRoute.vehicleId || currentRoute.vehicle?.id
            });
        }

        // 2. Start watching position
        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, heading, speed } = position.coords;

                // Emit location update via websocket
                if (socketRef.current && currentRoute) {
                    socketRef.current.emit('update-location', {
                        schoolId,
                        routeId: currentRoute.routeId,
                        latitude,
                        longitude,
                        heading: heading || 0,
                        speed: speed || 0,
                        driverId: userId
                    });
                }
            },
            (err) => console.error("GPS Error:", err),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
        );
    };

    const handleStopTrip = async () => {
        setIsTripActive(false);

        // New: Explicit API call to save check-out status
        try {
            await updateStatus.mutateAsync({ status: 'stopped' });
        } catch (err) {
            console.error("Failed to save check-out status to DB:", err);
        }

        // 1. Notify Backend
        if (socketRef.current && currentRoute) {
            socketRef.current.emit('driver-check-out', { schoolId, routeId: currentRoute.routeId });
        }

        // 2. Stop GPS
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress /></Box>;

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1200, mx: 'auto', minHeight: '100vh' }}>
            <Grid container spacing={{ xs: 2, sm: 2.5 }}>
                {/* Profile Header */}
                <Grid size={{ xs: 12 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 2, sm: 2.5 },
                            borderRadius: 2,
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            justifyContent: 'space-between',
                            gap: 2,
                            bgcolor: '#ffffff',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ width: { xs: 48, sm: 56 }, height: { xs: 48, sm: 56 }, bgcolor: 'primary.main', fontSize: { xs: '1.25rem', sm: '1.5rem' }, fontWeight: 700 }}>
                                {user?.firstName?.[0]}
                            </Avatar>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 800, fontSize: { xs: '1.2rem', sm: '1.45rem' }, lineHeight: 1.2 }}>
                                    Welcome, {user?.firstName}!
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                                    <Chip label="Verified Driver" color="success" size="small" sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem' }} />
                                    <Chip label={isTripActive ? "On Duty" : "Off Duty"} color={isTripActive ? "primary" : "default"} size="small" sx={{ height: 22, fontSize: '0.7rem' }} />
                                </Box>
                            </Box>
                        </Box>
                        <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            startIcon={<SupportIcon sx={{ fontSize: 18 }} />}
                            onClick={() => setSupportDialogOpen(true)}
                            sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', fontSize: '0.8rem', py: 0.5, alignSelf: { xs: 'stretch', sm: 'auto' } }}
                        >
                            Open Support Ticket
                        </Button>
                    </Paper>
                </Grid>

                {/* Trip Control Card */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Card elevation={0} sx={{ borderRadius: 2, height: '100%', border: '1px solid #e2e8f0', bgcolor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>Active Trip Control</Typography>

                            {!currentRoute ? (
                                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                                    No route currently assigned to you. Please contact administration.
                                </Alert>
                            ) : (
                                <Box>
                                    <Box sx={{ mb: 2.5, p: 2, bgcolor: 'rgba(99, 102, 241, 0.05)', borderRadius: 2.5, border: '1px solid rgba(99, 102, 241, 0.12)' }}>
                                        <Typography variant="caption" color="primary" sx={{ fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', mb: 0.25 }}>
                                            CURRENT ASSIGNMENT
                                        </Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', fontSize: { xs: '1.2rem', sm: '1.4rem' } }}>{currentRoute.name}</Typography>
                                        <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5, fontSize: '0.825rem' }}>
                                            Vehicle: <b>{currentRoute.vehicle?.name || "Bus 12"}</b> ({currentRoute.vehicle?.plateNumber || "KA05LS7929"})
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        {!isTripActive ? (
                                            <Button
                                                variant="contained"
                                                fullWidth
                                                size="medium"
                                                startIcon={<StartIcon />}
                                                onClick={handleStartTrip}
                                                sx={{ py: 1.25, borderRadius: 2.5, fontSize: '0.95rem', fontWeight: 700, textTransform: 'none', bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
                                            >
                                                Start Trip / Check-In
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="contained"
                                                color="error"
                                                fullWidth
                                                size="medium"
                                                startIcon={<StopIcon />}
                                                onClick={handleStopTrip}
                                                sx={{ py: 1.25, borderRadius: 2.5, fontSize: '0.95rem', fontWeight: 700, textTransform: 'none' }}
                                            >
                                                End Trip / Check-Out
                                            </Button>
                                        )}
                                    </Box>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Route Details */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>Route Schedule</Typography>
                            {currentRoute?.stops && currentRoute.stops.length > 0 ? (
                                <List disablePadding>
                                    {currentRoute.stops.map((stop: any, idx: number) => (
                                        <React.Fragment key={idx}>
                                            <ListItem sx={{ px: 0, py: 1 }}>
                                                <ListItemIcon sx={{ minWidth: 38 }}>
                                                    <Box sx={{
                                                        width: 26, height: 26, borderRadius: '50%',
                                                        bgcolor: idx === 0 ? 'primary.main' : 'rgba(0,0,0,0.06)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: idx === 0 ? 'white' : 'text.primary',
                                                        fontWeight: 700,
                                                        fontSize: '0.75rem'
                                                    }}>
                                                        {idx + 1}
                                                    </Box>
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={stop.name}
                                                    secondary={`Scheduled: ${stop.arrivalTime || '08:00 AM'}`}
                                                    primaryTypographyProps={{ fontWeight: 700, fontSize: '0.85rem' }}
                                                    secondaryTypographyProps={{ fontSize: '0.72rem' }}
                                                />
                                                <Chip label="On Time" size="small" variant="outlined" color="success" sx={{ height: 20, fontSize: '0.65rem' }} />
                                            </ListItem>
                                            {idx < currentRoute.stops.length - 1 && <Divider component="li" />}
                                        </React.Fragment>
                                    ))}
                                </List>
                            ) : (
                                <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.8rem' }}>No stops information available.</Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Status Bar */}
                {isTripActive && (
                    <Grid size={{ xs: 12 }}>
                        <Paper elevation={0} sx={{ p: 1.75, borderRadius: 2.5, bgcolor: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <GpsIcon sx={{ fontSize: 20 }} />
                                <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>GPS Tracking Active - Parents receiving live updates</Typography>
                            </Box>
                            <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>Last Update: {new Date().toLocaleTimeString()}</Typography>
                        </Paper>
                    </Grid>
                )}
            </Grid>

            <RequestChangeDialog
                open={supportDialogOpen}
                onClose={() => setSupportDialogOpen(false)}
                schoolId={schoolId}
                userId={userId}
                userName={`${user?.firstName || 'Driver'} ${user?.lastName || ''}`.trim()}
                userType="teacher"
                fieldType="general"
            />
        </Box>
    );
};

export default DriverDashboard;
