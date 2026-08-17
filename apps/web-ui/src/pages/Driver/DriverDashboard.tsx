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
        <Box sx={{ p: { xs: 2, sm: 4 }, background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', minHeight: '100vh' }}>
            <Grid container spacing={4}>
                {/* Profile Header */}
                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 3, borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem' }}>
                                {user?.firstName?.[0]}
                            </Avatar>
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 800 }}>Welcome, {user?.firstName}!</Typography>
                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                    <Chip label="Verified Driver" color="success" size="small" sx={{ fontWeight: 700 }} />
                                    <Chip label={isTripActive ? "On Duty" : "Off Duty"} color={isTripActive ? "primary" : "default"} size="small" />
                                </Box>
                            </Box>
                        </Box>
                        <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<SupportIcon />}
                            onClick={() => setSupportDialogOpen(true)}
                            sx={{ borderRadius: '12px', fontWeight: 700, textTransform: 'none' }}
                        >
                            Open Support Ticket
                        </Button>
                    </Paper>
                </Grid>

                {/* Trip Control Card */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Card sx={{ borderRadius: '24px', height: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
                        <CardContent sx={{ p: 4 }}>
                            <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Active Trip Control</Typography>
                            
                            {!currentRoute ? (
                                <Alert severity="warning" sx={{ borderRadius: '12px' }}>
                                    No route currently assigned to you. Please contact administration.
                                </Alert>
                            ) : (
                                <Box>
                                    <Box sx={{ mb: 4, p: 3, bgcolor: 'rgba(99, 102, 241, 0.05)', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                                        <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, mb: 1 }}>CURRENT ASSIGNMENT</Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b' }}>{currentRoute.name}</Typography>
                                        <Typography variant="body1" color="textSecondary">Vehicle: {currentRoute.vehicle?.name || "Bus 12"} ({currentRoute.vehicle?.plateNumber || "KA05LS7929"})</Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        {!isTripActive ? (
                                            <Button 
                                                variant="contained" 
                                                fullWidth 
                                                size="large"
                                                startIcon={<StartIcon />}
                                                onClick={handleStartTrip}
                                                sx={{ py: 2, borderRadius: '16px', fontSize: '1.1rem', fontWeight: 700, textTransform: 'none', boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)' }}
                                            >
                                                Start Trip / Check-In
                                            </Button>
                                        ) : (
                                            <Button 
                                                variant="contained" 
                                                color="error"
                                                fullWidth 
                                                size="large"
                                                startIcon={<StopIcon />}
                                                onClick={handleStopTrip}
                                                sx={{ py: 2, borderRadius: '16px', fontSize: '1.1rem', fontWeight: 700, textTransform: 'none' }}
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
                    <Card sx={{ borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
                        <CardContent sx={{ p: 4 }}>
                            <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Route Schedule</Typography>
                            {currentRoute?.stops ? (
                                <List>
                                    {currentRoute.stops.map((stop: any, idx: number) => (
                                        <React.Fragment key={idx}>
                                            <ListItem sx={{ px: 0 }}>
                                                <ListItemIcon>
                                                    <Box sx={{ 
                                                        width: 32, height: 32, borderRadius: '50%', 
                                                        bgcolor: idx === 0 ? 'primary.main' : 'rgba(0,0,0,0.05)', 
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: idx === 0 ? 'white' : 'text.primary',
                                                        fontWeight: 700
                                                    }}>
                                                        {idx + 1}
                                                    </Box>
                                                </ListItemIcon>
                                                <ListItemText 
                                                    primary={stop.name} 
                                                    secondary={`Scheduled: ${stop.arrivalTime || '08:00 AM'}`}
                                                    primaryTypographyProps={{ fontWeight: 700 }}
                                                />
                                                <Chip label="On Time" size="small" variant="outlined" color="success" />
                                            </ListItem>
                                            {idx < currentRoute.stops.length - 1 && <Divider variant="inset" component="li" />}
                                        </React.Fragment>
                                    ))}
                                </List>
                            ) : (
                                <Typography color="textSecondary">No stops information available.</Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Status Bar */}
                {isTripActive && (
                    <Grid size={{ xs: 12 }}>
                        <Paper sx={{ p: 2, borderRadius: '16px', bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <GpsIcon className="animate-pulse" />
                                <Typography sx={{ fontWeight: 700 }}>GPS Tracking Active - Parents are being notified of your location</Typography>
                            </Box>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>Last Update: {new Date().toLocaleTimeString()}</Typography>
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
