// apps/web-ui/src/components/Transport/NotificationsPanel.tsx

import { useState } from 'react';
import {
    Box, Typography, Card, CardContent, Divider, Button, Chip,
    Select, MenuItem, FormControl, InputLabel, TextField, Alert,
    List, ListItem, ListItemText, ListItemIcon, CircularProgress,
    Accordion, AccordionSummary, AccordionDetails, IconButton,
} from '@mui/material';
import {
    Notifications as NotifIcon,
    DirectionsBus as BusIcon,
    Schedule as DelayIcon,
    CheckCircle as ArriveIcon,
    Cancel as DepartIcon,
    Send as SendIcon,
    ExpandMore as ExpandMoreIcon,
    History as HistoryIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import type { TransportRoute, TransportNotificationType, BusStatusPayload } from '../../types/transport';
import { useSendTransportNotification, useUpdateBusStatus, useGetTransportNotifications } from '../../queries/transport';
import { useNotificationStore } from '../../stores/notificationStore';

interface NotificationsPanelProps {
    routes: TransportRoute[];
    schoolId: string;
    onClose?: () => void;
}

const BUS_STATUS_OPTIONS: { value: BusStatusPayload['status']; label: string; color: string; icon: React.ReactNode }[] = [
    { value: 'departed', label: 'Bus Departed', color: '#4F46E5', icon: <DepartIcon fontSize="small" /> },
    { value: 'arrived', label: 'Bus Arrived at School', color: '#059669', icon: <ArriveIcon fontSize="small" /> },
    { value: 'delayed', label: 'Bus Delayed', color: '#D97706', icon: <DelayIcon fontSize="small" /> },
];

const QUICK_NOTIF_OPTIONS: { value: TransportNotificationType; label: string }[] = [
    { value: 'bus_departed', label: 'Bus Departed' },
    { value: 'bus_reached_school', label: 'Bus Reached School' },
    { value: 'bus_delayed', label: 'Bus Delayed' },
    { value: 'child_picked', label: 'Child Picked Up' },
    { value: 'child_dropped', label: 'Child Dropped Off' },
    { value: 'transport_update', label: 'Transport Update' },
];

const NotificationsPanel = ({ routes, schoolId, onClose }: NotificationsPanelProps) => {
    const { showNotification } = useNotificationStore();
    const [selectedRouteId, setSelectedRouteId] = useState('');
    const [busStatusValue, setBusStatusValue] = useState<BusStatusPayload['status']>('departed');
    const [customType, setCustomType] = useState<TransportNotificationType>('transport_update');
    const [customMessage, setCustomMessage] = useState('');
    const [historyOpen, setHistoryOpen] = useState(false);

    const sendBusStatus = useUpdateBusStatus(schoolId);
    const sendCustom = useSendTransportNotification(schoolId);

    const { data: historyData, isLoading: historyLoading } = useGetTransportNotifications(
        schoolId,
        { limit: 20 }
    );

    const notifications = historyData?.data || [];

    const handleSendBusStatus = async () => {
        if (!selectedRouteId) {
            showNotification('Please select a route first', 'warning');
            return;
        }
        try {
            const result = await sendBusStatus.mutateAsync({
                routeId: selectedRouteId,
                status: busStatusValue,
                customMessage: customMessage || undefined,
            });
            showNotification(result.message || 'Notifications sent!', 'success');
            setCustomMessage('');
        } catch (err: any) {
            showNotification(err?.message || 'Failed to send notification', 'error');
        }
    };

    const handleSendCustom = async () => {
        if (!selectedRouteId) {
            showNotification('Please select a route first', 'warning');
            return;
        }
        try {
            const result = await sendCustom.mutateAsync({
                routeId: selectedRouteId,
                type: customType,
                customMessage: customMessage || undefined,
            });
            showNotification(result.message || 'Notifications sent!', 'success');
            setCustomMessage('');
        } catch (err: any) {
            showNotification(err?.message || 'Failed to send notification', 'error');
        }
    };

    const isSending = sendBusStatus.isPending || sendCustom.isPending;

    return (
        <Card sx={{
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            overflow: 'visible',
        }}>
            <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: 'primary.main', color: 'white', display: 'flex' }}>
                            <NotifIcon fontSize="small" />
                        </Box>
                        <Typography variant="subtitle1" fontWeight={700}>
                            Send Notifications
                        </Typography>
                    </Box>
                    {onClose && (
                        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    )}
                </Box>

                {/* Route selector */}
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>Select Route</InputLabel>
                    <Select
                        value={selectedRouteId}
                        label="Select Route"
                        onChange={(e) => setSelectedRouteId(e.target.value)}
                    >
                        {routes.map(r => (
                            <MenuItem key={r._id} value={r._id}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: r.color || '#4F46E5' }} />
                                    {r.routeName}
                                </Box>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Quick Bus Status Buttons */}
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                    Quick Bus Status
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 0.75, mb: 2, flexWrap: 'wrap' }}>
                    {BUS_STATUS_OPTIONS.map(opt => (
                        <Chip
                            key={opt.value}
                            icon={opt.icon as any}
                            label={opt.label}
                            onClick={() => setBusStatusValue(opt.value)}
                            variant={busStatusValue === opt.value ? 'filled' : 'outlined'}
                            sx={{
                                height: 30,
                                fontSize: 11,
                                cursor: 'pointer',
                                ...(busStatusValue === opt.value && {
                                    bgcolor: opt.color,
                                    color: 'white',
                                    '& .MuiChip-icon': { color: 'white' },
                                }),
                            }}
                        />
                    ))}
                </Box>

                <TextField
                    fullWidth
                    size="small"
                    label="Custom message (optional)"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Leave empty to use default message..."
                    sx={{ mb: 1.5 }}
                />

                <Button
                    fullWidth
                    variant="contained"
                    startIcon={isSending ? <CircularProgress size={14} color="inherit" /> : <SendIcon fontSize="small" />}
                    onClick={handleSendBusStatus}
                    disabled={isSending || !selectedRouteId}
                    sx={{ mb: 2, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                    {isSending ? 'Sending...' : 'Send Bus Status to All Parents'}
                </Button>

                <Divider sx={{ mb: 2 }} />

                {/* Custom Notification Type */}
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                    Custom Notification
                </Typography>
                <FormControl fullWidth size="small" sx={{ mt: 0.75, mb: 1.5 }}>
                    <InputLabel>Notification Type</InputLabel>
                    <Select
                        value={customType}
                        label="Notification Type"
                        onChange={(e) => setCustomType(e.target.value as TransportNotificationType)}
                    >
                        {QUICK_NOTIF_OPTIONS.map(o => (
                            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<SendIcon fontSize="small" />}
                    onClick={handleSendCustom}
                    disabled={isSending || !selectedRouteId}
                    sx={{ mb: 2, borderRadius: 2, textTransform: 'none' }}
                >
                    Send Custom Notification
                </Button>

                {/* Notification History */}
                <Accordion
                    expanded={historyOpen}
                    onChange={() => setHistoryOpen(!historyOpen)}
                    disableGutters
                    elevation={0}
                    sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px !important', '&:before': { display: 'none' } }}
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />} sx={{ minHeight: 40, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <HistoryIcon fontSize="small" color="action" />
                            <Typography variant="caption" fontWeight={600}>Recent History</Typography>
                            {notifications.length > 0 && (
                                <Chip size="small" label={notifications.length} sx={{ height: 16, fontSize: 10 }} />
                            )}
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0, maxHeight: 240, overflowY: 'auto' }}>
                        {historyLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                <CircularProgress size={20} />
                            </Box>
                        ) : notifications.length === 0 ? (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', py: 2 }}>
                                No notifications sent yet
                            </Typography>
                        ) : (
                            <List dense disablePadding>
                                {notifications.map((n, i) => (
                                    <ListItem key={i} divider sx={{ py: 0.5 }}>
                                        <ListItemIcon sx={{ minWidth: 28 }}>
                                            <BusIcon fontSize="small" color="primary" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={<Typography variant="caption" fontWeight={600}>{n.title}</Typography>}
                                            secondary={
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                                                    {n.metadata?.routeName} • {new Date(n.createdAt).toLocaleString()}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </AccordionDetails>
                </Accordion>

                {(sendBusStatus.isSuccess || sendCustom.isSuccess) && (
                    <Alert severity="success" sx={{ mt: 1.5, py: 0.5, borderRadius: 2 }}>
                        Notifications sent successfully!
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
};

export default NotificationsPanel;
