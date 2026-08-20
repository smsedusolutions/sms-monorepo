import React from 'react';
import { Box, Typography, Paper, Chip, Stack, Divider } from '@mui/material';
import {
    DirectionsBus as BusIcon,
    LocationOn as PinIcon,
    Schedule as TimeIcon,
    Person as PersonIcon,
} from '@mui/icons-material';

interface Stop {
    stopName: string;
    pickupTime?: string;
    dropTime?: string;
    landmark?: string;
    studentCount?: number;
}

interface RouteMapViewProps {
    routeName: string;
    routeNumber?: string;
    stops: Stop[];
    vehicleNumber?: string;
    driverName?: string;
    driverPhone?: string;
}

export const RouteMapView: React.FC<RouteMapViewProps> = ({
    routeName,
    routeNumber,
    stops = [],
    vehicleNumber,
    driverName,
    driverPhone,
}) => {
    return (
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            {/* Header info */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <BusIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                    <Box>
                        <Typography fontWeight={700} sx={{ fontSize: '1.1rem' }}>{routeName}</Typography>
                        {routeNumber && (
                            <Typography variant="caption" color="text.secondary">Route #{routeNumber}</Typography>
                        )}
                    </Box>
                </Box>
                {vehicleNumber && (
                    <Chip label={`Bus: ${vehicleNumber}`} color="primary" variant="outlined" size="small" />
                )}
            </Box>

            {(driverName || driverPhone) && (
                <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                        Driver: <strong>{driverName || 'Assigned Driver'}</strong> {driverPhone ? `• 📞 ${driverPhone}` : ''}
                    </Typography>
                </Box>
            )}

            <Divider sx={{ mb: 3 }} />

            {/* Visual Timeline Stops Route */}
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
                Route Stops & Schedule ({stops.length} Stops)
            </Typography>

            {stops.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No stops configured for this route.</Typography>
            ) : (
                <Box sx={{ position: 'relative', pl: { xs: 2, sm: 3 }, py: 1 }}>
                    {/* Continuous vertical line */}
                    <Box
                        sx={{
                            position: 'absolute',
                            left: { xs: 15, sm: 23 },
                            top: 20,
                            bottom: 20,
                            width: 3,
                            bgcolor: 'primary.light',
                            zIndex: 0,
                        }}
                    />

                    <Stack spacing={3}>
                        {stops.map((stop, idx) => {
                            const isFirst = idx === 0;
                            const isLast = idx === stops.length - 1;
                            return (
                                <Box key={idx} sx={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 2, zIndex: 1 }}>
                                    {/* Stop Node Indicator */}
                                    <Box
                                        sx={{
                                            width: { xs: 24, sm: 28 },
                                            height: { xs: 24, sm: 28 },
                                            borderRadius: '50%',
                                            bgcolor: isFirst ? 'success.main' : isLast ? 'error.main' : 'primary.main',
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 0 0 4px white',
                                            flexShrink: 0,
                                            mt: 0.25,
                                        }}
                                    >
                                        <PinIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />
                                    </Box>

                                    {/* Stop Content */}
                                    <Box sx={{ flex: 1, p: 1.5, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                            <Typography fontWeight={700} sx={{ fontSize: '0.95rem' }}>
                                                {stop.stopName}
                                            </Typography>
                                            {isFirst && <Chip label="Start Point" size="small" color="success" sx={{ height: 20, fontSize: '0.7rem' }} />}
                                            {isLast && <Chip label="School / End" size="small" color="error" sx={{ height: 20, fontSize: '0.7rem' }} />}
                                        </Box>
                                        {stop.landmark && (
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                                                Near: {stop.landmark}
                                            </Typography>
                                        )}
                                        <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                                            {stop.pickupTime && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <TimeIcon sx={{ fontSize: 13, color: 'success.main' }} />
                                                    <Typography variant="caption" color="text.secondary">
                                                        Pickup: <strong>{stop.pickupTime}</strong>
                                                    </Typography>
                                                </Box>
                                            )}
                                            {stop.dropTime && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <TimeIcon sx={{ fontSize: 13, color: 'info.main' }} />
                                                    <Typography variant="caption" color="text.secondary">
                                                        Drop: <strong>{stop.dropTime}</strong>
                                                    </Typography>
                                                </Box>
                                            )}
                                            {stop.studentCount !== undefined && (
                                                <Chip label={`${stop.studentCount} Students`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                            );
                        })}
                    </Stack>
                </Box>
            )}
        </Paper>
    );
};

export default RouteMapView;
