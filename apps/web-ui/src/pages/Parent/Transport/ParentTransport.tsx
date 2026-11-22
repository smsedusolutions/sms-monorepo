// apps/web-ui/src/pages/Parent/Transport/ParentTransport.tsx

import { useMemo } from 'react';
import {
    Box, Typography, Card, CardContent, Avatar, Divider, Chip,
    Alert, Skeleton, Grid, Button,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
    DirectionsBus as BusIcon,
    LocationOn as StopIcon,
    Person as DriverIcon,
    Phone as PhoneIcon,
    Badge as LicenseIcon,
    School as SchoolIcon,
    AccessTime as TimeIcon,
    ChildCare as ChildIcon,
    NotificationsActive as NotifIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import TokenService from '../../../queries/token/tokenService';
import { useChildSelector } from '../../../context/ChildSelectorContext';
import { useGetStudentRoute } from '../../../queries/transport';
import { useGetSchoolById } from '../../../queries/School';
import { getSchoolOrigin } from '../../../config/transportConfig';
import { Map, MapRoute, MapMarker, MapControls, MarkerContent } from '@/components/ui/map';
import { fetchRoadRoute } from '../../../utils/transport_routing';
import { useEffect, useState, useRef } from 'react';
import type { TransportStop } from '../../../types/transport';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = "http://localhost:5004";

const ParentTransport = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const schoolId = TokenService.getSchoolId() || '';
    const { selectedChild } = useChildSelector();

    const studentId = selectedChild?.studentId || '';

    const { data, isLoading, error } = useGetStudentRoute(schoolId, studentId);
    const { data: schoolData } = useGetSchoolById(schoolId);
    const schoolOrigin = useMemo(() => getSchoolOrigin(schoolData?.data), [schoolData?.data]);

    const route = data?.data?.route;
    const assignedStop = data?.data?.stop;

    const [roadRoute, setRoadRoute] = useState<[number, number][]>([]);
    const [isRouting, setIsRouting] = useState(false);
    const [busLocation, setBusLocation] = useState<{lat: number, lng: number} | null>(null);
    const mapRef = useRef<any>(null);
    const socketRef = useRef<Socket | null>(null);

    const getStopCoords = (stop: TransportStop): [number, number] => {
        if (stop.longitude !== undefined && stop.latitude !== undefined) {
            return [stop.longitude, stop.latitude];
        }
        return schoolOrigin ? [schoolOrigin.longitude, schoolOrigin.latitude] : [77.5946, 12.9716];
    };

    const initialCenter = useMemo<[number, number]>(
        () => schoolOrigin ? [schoolOrigin.longitude, schoolOrigin.latitude] : [77.5946, 12.9716],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    useEffect(() => {
        if (!route?.stops?.length) { setRoadRoute([]); return; }
        const stops = route.stops.map(s => {
            const [lng, lat] = getStopCoords(s);
            return { longitude: lng, latitude: lat };
        });
        setIsRouting(true);
        const origin = schoolOrigin ? { longitude: schoolOrigin.longitude, latitude: schoolOrigin.latitude } : undefined;
        fetchRoadRoute(stops, origin).then(r => { 
            setRoadRoute(r); 
            setIsRouting(false); 
            
            if (assignedStop && mapRef.current) {
                const [lng, lat] = getStopCoords(assignedStop);
                setTimeout(() => {
                    mapRef.current?.flyTo({ center: [lng, lat], zoom: 15, speed: 1.2 });
                }, 500); // Slight delay for smoother UX after route loads
            }
        });

        // Bootstrap bus location from DB initial state
        if (route.currentLocation?.latitude && route.currentLocation?.longitude) {
            setBusLocation({ 
                lat: route.currentLocation.latitude, 
                lng: route.currentLocation.longitude 
            });
        }
    }, [route, schoolOrigin, assignedStop]);

    useEffect(() => {
        if (!route?.routeId) return;

        // Initialize Socket
        socketRef.current = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            withCredentials: true
        });
        
        socketRef.current.on('connect', () => {
            socketRef.current?.emit('join-route', { schoolId, routeId: route.routeId });
        });

        socketRef.current.on('location-update', (data: any) => {
            setBusLocation({ lat: data.latitude, lng: data.longitude });
        });

        socketRef.current.on('trip-started', () => {
            console.log("Trip has started!");
        });

        socketRef.current.on('trip-stopped', () => {
            console.log("Trip has ended!");
            setBusLocation(null);
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [route?.routeId, schoolId]);

    if (!studentId) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Please select a child from the top bar to view their transport details.
                </Alert>
            </Box>
        );
    }

    if (isLoading) {
        return (
            <Box sx={{ p: 3 }}>
                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2, mb: 2 }} />
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}><Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} /></Grid>
                    <Grid size={{ xs: 12, md: 6 }}><Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} /></Grid>
                </Grid>
            </Box>
        );
    }

    if (error || !route) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="info" sx={{ borderRadius: 2, mb: 2 }}>
                    <Typography fontWeight={600}>No transport route assigned</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {selectedChild
                            ? `${selectedChild.firstName} ${selectedChild.lastName} has not been assigned to any bus route yet.`
                            : 'Your child has not been assigned to any bus route yet.'}
                    </Typography>
                </Alert>
                <Button variant="outlined" size="small" onClick={() => navigate('/parent/notifications')}>
                    View Notifications
                </Button>
            </Box>
        );
    }

    const assignedStopIdx = route.stops.findIndex(s => s.stopId === assignedStop?.stopId);

    return (
        <Box sx={{
            p: { xs: 1.5, sm: 2 },
            minHeight: '100vh',
            bgcolor: 'background.default',
            backgroundImage: 'radial-gradient(at 0% 0%, rgba(79, 70, 229, 0.05) 0px, transparent 50%)',
        }}>
            {/* Page Header */}
            <Box sx={{ mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: 'primary.main', color: 'white', display: 'flex' }}>
                        <BusIcon fontSize="small" />
                    </Box>
                    My Child's Transport
                </Typography>
                {selectedChild && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, ml: 0.5 }}>
                        Showing transport details for <strong>{selectedChild.firstName} {selectedChild.lastName}</strong>
                    </Typography>
                )}
            </Box>

            {/* Route summary strip */}
            <Box sx={{
                display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2,
                p: 1.5, bgcolor: 'primary.main', borderRadius: 2, color: 'white',
            }}>
                <Chip icon={<BusIcon />} label={route.routeName} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }} />
                {route.busNumber && <Chip icon={<BusIcon />} label={`Bus: ${route.busNumber}`} sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white' }} />}
                <Chip
                    label={route.status === 'active' ? 'Active' : 'Inactive'}
                    color={route.status === 'active' ? 'success' : 'warning'}
                    size="small"
                    sx={{ fontWeight: 600 }}
                />
                <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NotifIcon fontSize="small" sx={{ opacity: 0.8 }} />
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        {route.stops.length} stops
                    </Typography>
                </Box>
            </Box>

            <Grid container spacing={2}>
                {/* Map */}
                <Grid size={{ xs: 12, lg: 8 }}>
                    <Card sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                        <CardContent sx={{ p: 0, height: '380px', position: 'relative', '&:last-child': { pb: 0 } }}>
                            <Map ref={mapRef} center={initialCenter} zoom={13} className="h-full w-full">
                                <MapControls showZoom showLocate />

                                {/* School marker */}
                                {schoolOrigin && (
                                    <MapMarker longitude={schoolOrigin.longitude} latitude={schoolOrigin.latitude}>
                                        <MarkerContent>
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-indigo-900 text-white shadow-xl">
                                                <SchoolIcon sx={{ fontSize: 16 }} />
                                            </div>
                                        </MarkerContent>
                                    </MapMarker>
                                )}

                                {/* All stop markers */}
                                {route.stops.map((stop, i) => {
                                    const [lng, lat] = getStopCoords(stop);
                                    const isAssigned = stop.stopId === assignedStop?.stopId;
                                    return (
                                        <MapMarker key={i} longitude={lng} latitude={lat}>
                                            <MarkerContent>
                                                <Box sx={{
                                                    width: isAssigned ? 34 : 26,
                                                    height: isAssigned ? 34 : 26,
                                                    borderRadius: '50%',
                                                    bgcolor: isAssigned ? 'primary.main' : 'text.secondary',
                                                    border: isAssigned ? '3px solid white' : '2px solid white',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: isAssigned ? '13px' : '11px',
                                                    fontWeight: 700, color: 'white',
                                                    boxShadow: isAssigned ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.4)}` : '0 2px 8px rgba(0,0,0,0.4)',
                                                    animation: isAssigned ? 'pulse 2s infinite' : 'none',
                                                }}>
                                                    {i + 1}
                                                </Box>
                                            </MarkerContent>
                                        </MapMarker>
                                    );
                                })}

                                {/* Road route polyline */}
                                {roadRoute.length > 0 && (
                                    <MapRoute coordinates={roadRoute} color={theme.palette.primary.main} width={4} opacity={0.8} />
                                )}

                                {/* Live Bus Marker */}
                                {busLocation && (
                                    <MapMarker longitude={busLocation.lng} latitude={busLocation.lat}>
                                        <MarkerContent>
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-blue-600 text-white shadow-2xl transition-all duration-1000 ease-linear">
                                                <div className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-25"></div>
                                                <BusIcon sx={{ fontSize: 24, zIndex: 10 }} />
                                            </div>
                                        </MarkerContent>
                                    </MapMarker>
                                )}
                            </Map>

                            {isRouting && (
                                <Box sx={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', bgcolor: 'background.paper', px: 2, py: 0.5, borderRadius: 20, boxShadow: 2, zIndex: 10 }}>
                                    <Typography variant="caption">Updating route...</Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>

                    {/* Stop timeline */}
                    <Card sx={{ mt: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                        <CardContent sx={{ p: 2 }}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                                Route Stop Schedule
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                {route.stops.map((stop, i) => {
                                    const isHighlighted = stop.stopId === assignedStop?.stopId;
                                    const isLast = i === route.stops.length - 1;
                                    return (
                                        <Box key={i} sx={{ display: 'flex', gap: 1.5 }}>
                                            {/* Timeline connector */}
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 24 }}>
                                                <Box sx={{
                                                    width: 22, height: 22, borderRadius: '50%',
                                                    bgcolor: isHighlighted ? 'success.main' : 'primary.main',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: 10, fontWeight: 700, color: 'white', flexShrink: 0,
                                                    boxShadow: isHighlighted ? '0 0 0 3px rgba(5,150,105,0.3)' : 'none',
                                                }}>
                                                    {i + 1}
                                                </Box>
                                                {!isLast && <Box sx={{ width: 2, flex: 1, bgcolor: 'divider', my: 0.25 }} />}
                                            </Box>

                                            {/* Stop info */}
                                            <Box sx={{
                                                flex: 1, pb: 1.5,
                                                ...(isHighlighted && {
                                                    bgcolor: 'rgba(34, 197, 94, 0.08)',
                                                    border: '1px solid rgba(34, 197, 94, 0.2)',
                                                    p: 1.5, borderRadius: 2, mb: 1,
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                                }),
                                            }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="body2" fontWeight={isHighlighted ? 800 : 500} color={isHighlighted ? 'success.dark' : 'text.primary'}>
                                                        {stop.name}
                                                        {isHighlighted && (
                                                            <Chip size="small" label="Your Stop" color="success" sx={{ ml: 1, height: 18, fontSize: 10 }} />
                                                        )}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="caption" color={isHighlighted ? 'text.primary' : 'text.secondary'} sx={{ display: 'flex', gap: 1.5, mt: 0.5, fontWeight: isHighlighted ? 600 : 400 }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><TimeIcon sx={{ fontSize: 13, color: 'primary.main' }}/> {stop.pickupTime || '—'}</span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><TimeIcon sx={{ fontSize: 13, color: 'secondary.main' }}/> {stop.dropTime || '—'}</span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ChildIcon sx={{ fontSize: 13, color: 'action.active' }}/> {stop.students?.length || 0} students</span>
                                                </Typography>
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right column: Your Stop + Driver */}
                <Grid size={{ xs: 12, lg: 4 }}>
                    {/* Your Stop Card */}
                    {assignedStop && (
                        <Card sx={{ mb: 2, borderRadius: 2, border: '2px solid', borderColor: 'success.main', boxShadow: '0 4px 20px rgba(5,150,105,0.15)' }}>
                            <Box sx={{ bgcolor: 'success.main', px: 2, py: 1.5 }}>
                                <Typography variant="subtitle1" fontWeight={700} color="white" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ChildIcon fontSize="small" /> Your Child's Stop
                                </Typography>
                            </Box>
                            <CardContent sx={{ p: 2 }}>
                                <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <StopIcon color="success" fontSize="small" />
                                    Stop {assignedStopIdx + 1}: {assignedStop.name}
                                </Typography>
                                <Divider sx={{ my: 1.5 }} />
                                <Box sx={{ display: 'flex', gap: 3 }}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>PICKUP TIME</Typography>
                                        <Typography variant="body1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <TimeIcon fontSize="small" color="primary" />
                                            {assignedStop.pickupTime || '—'}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>DROP TIME</Typography>
                                        <Typography variant="body1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <TimeIcon fontSize="small" color="secondary" />
                                            {assignedStop.dropTime || '—'}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    )}

                    {/* Driver Card */}
                    <Card sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                        <Box sx={{ bgcolor: 'primary.main', px: 2, py: 1.5 }}>
                            <Typography variant="subtitle1" fontWeight={700} color="white" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <DriverIcon fontSize="small" /> Driver Information
                            </Typography>
                        </Box>
                        <CardContent sx={{ p: 2 }}>
                            {route.driver ? (
                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                        <Avatar sx={{ width: 52, height: 52, bgcolor: 'primary.light', fontSize: 22 }}>
                                            {route.driver.name?.[0] || 'D'}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body1" fontWeight={700}>{route.driver.name}</Typography>
                                            <Chip size="small" label="Verified Driver" color="success" sx={{ mt: 0.25, height: 18, fontSize: 10 }} />
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <PhoneIcon fontSize="small" color="primary" />
                                            <Typography variant="body2">{route.driver.phone}</Typography>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                href={`tel:${route.driver.phone}`}
                                                sx={{ ml: 'auto', borderRadius: 2, height: 26, fontSize: 11, textTransform: 'none' }}
                                            >
                                                Call
                                            </Button>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <LicenseIcon fontSize="small" color="action" />
                                            <Typography variant="body2" color="text.secondary">
                                                License: {route.driver.licenseNumber}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary">No driver assigned yet</Typography>
                            )}
                        </CardContent>
                    </Card>

                    {/* Live tracking status */}
                    <Card sx={{
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: busLocation ? 'success.light' : 'primary.light',
                        bgcolor: busLocation ? 'rgba(34, 197, 94, 0.04)' : 'rgba(79,70,229,0.04)',
                    }}>
                        <CardContent sx={{ p: 2 }}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                {busLocation ? <Box className="animate-pulse h-2 w-2 rounded-full bg-green-500" /> : <Box className="h-2 w-2 rounded-full bg-slate-400" />}
                                {busLocation ? 'Live Bus Tracking Active' : 'Waiting for Bus GPS...'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {busLocation 
                                    ? `The bus is currently active on its route. You can see its live position above.`
                                    : `The bus has not started its trip yet. You'll see its position here once the driver checks in.`}
                            </Typography>
                        </CardContent>
                    </Card>

                    {/* Notification tip */}
                    <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }} icon={<NotifIcon />}>
                        <Typography variant="caption" fontWeight={600}>Stay updated!</Typography>
                        <Typography variant="caption" display="block">
                            You'll receive in-app notifications when the bus departs, is delayed, or your child is picked up.
                        </Typography>
                    </Alert>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ParentTransport;
