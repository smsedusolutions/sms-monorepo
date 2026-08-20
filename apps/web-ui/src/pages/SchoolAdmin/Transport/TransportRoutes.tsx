import { useState, useEffect, useMemo } from 'react';
import { Box, IconButton, Tooltip, Switch, Typography, Card, CardContent, Divider, Alert, Button, Avatar, Chip, Dialog } from '@mui/material';
import { Edit as EditIcon, DirectionsBus as BusIcon, Route as RouteIcon, School as SchoolIcon, Close as CloseIcon, Person as PersonIcon, Notifications as NotificationsIcon } from '@mui/icons-material';
import DataTable, { StatusChip } from '../../../components/Table/DataTable';
import type { Column } from '../../../components/Table/DataTable';
import TransportRouteDialog from '../../../components/Dialogs/TransportRouteDialog';
import { useGetTransportRoutes, useUpdateTransportRoute } from '../../../queries/transport';
import { useGetSchoolById } from '../../../queries/School';
import type { TransportRoute, TransportStop } from '../../../types/transport';
import TokenService from '../../../queries/token/tokenService';
import { useNotificationStore } from '../../../stores/notificationStore';
import { Map, MapRoute, MapMarker, MapControls, MarkerContent, useMap } from '@/components/ui/map';
import { fetchRoadRoute } from '../../../utils/transport_routing';
import { AppButton } from '../../../components/shared/AppButton';
import { getSchoolOrigin } from '../../../config/transportConfig';
import { useNavigate } from 'react-router-dom';
import NotificationsPanel from '../../../components/Transport/NotificationsPanel';

// ---------------------------------------------------------------------------
// MapFlyTo — must live inside <Map> to use useMap().
// Calls flyTo() imperatively whenever the target destination changes.
// The center prop on <Map> only sets the initial position; this handles updates.
// ---------------------------------------------------------------------------
type MapFlyToProps = {
  schoolOrigin: { longitude: number; latitude: number } | null;
  selectedRoute: TransportRoute | null;
  getStopCoords: (stop: TransportStop) => [number, number];
};

function MapFlyTo({ schoolOrigin, selectedRoute, getStopCoords }: MapFlyToProps) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;

    if (schoolOrigin) {
      // No route selected — always show school location
      map.flyTo({ center: [schoolOrigin.longitude, schoolOrigin.latitude], zoom: 14, duration: 800 });
    } else if (selectedRoute?.stops?.[0]) {
      // Route selected — fly to its first stop
      const [lng, lat] = getStopCoords(selectedRoute.stops[0]);
      map.flyTo({ center: [lng, lat], zoom: 14, duration: 800 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoute, schoolOrigin, isLoaded]);

  // Also fly to school location when map first becomes ready (schoolOrigin may load after map)
  useEffect(() => {
    if (!map || !isLoaded || !schoolOrigin || selectedRoute) return;
    map.flyTo({ center: [schoolOrigin.longitude, schoolOrigin.latitude], zoom: 14, duration: 600 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  return null;
}

const TransportRoutesPage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<TransportRoute | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<TransportRoute | null>(null);
  const [notifDialogOpen, setNotifDialogOpen] = useState(false);
  const [roadRoute, setRoadRoute] = useState<[number, number][]>([]);
  const [isRouting, setIsRouting] = useState(false);

  const schoolId = TokenService.getSchoolId() || "";
  const { showNotification } = useNotificationStore();
  const navigate = useNavigate();

  const { data, isLoading, error } = useGetTransportRoutes(schoolId);
  const { data: schoolData } = useGetSchoolById(schoolId);
  const schoolOrigin = useMemo(() => getSchoolOrigin(schoolData?.data), [schoolData?.data]);

  const updateMutation = useUpdateTransportRoute(schoolId);

  const routes = data?.data || [];

  const handleAdd = () => {
    setEditData(null);
    setDialogOpen(true);
  };

  const handleEdit = (route: TransportRoute) => {
    setEditData(route);
    setDialogOpen(true);
  };

  const handleToggleStatus = async (route: TransportRoute) => {
    const newStatus = route.status === 'active' ? 'inactive' : 'active';
    try {
      await updateMutation.mutateAsync({
        routeId: route._id,
        data: { status: newStatus },
      });
      showNotification(`Route status updated to ${newStatus}`, 'success');
    } catch (err) {
      showNotification((err as any)?.message || 'Failed to update status', 'error');
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditData(null);
  };

  const columns: Column<TransportRoute>[] = [
    { id: 'routeName', label: 'Route Name', minWidth: 150 },
    {
      id: 'busNumber',
      label: 'Vehicle No',
      minWidth: 100,
      format: (_, row) => row.busNumber || row.vehicleNumber || row.vehicle?.plateNumber || 'N/A'
    },
    {
      id: 'stops',
      label: 'Stops',
      minWidth: 80,
      format: (value) => Array.isArray(value) ? value.length : 0
    },
    {
      id: 'driver',
      label: 'Driver',
      minWidth: 120,
      format: (_, row) => row.driver?.name || row.driverName || 'N/A'
    },
    {
      id: 'driver',
      label: 'Contact',
      minWidth: 120,
      format: (_, row) => row.driver?.phone || row.driverPhone || 'N/A'
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 80,
      align: 'center',
      format: (value: any) => <StatusChip status={(value as 'active' | 'inactive') || 'active'} />,
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 120,
      align: 'center',
      format: (_value: any, row: TransportRoute) => (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
          <Tooltip title="View on Map">
            <IconButton size="small" color="info" onClick={(e) => { e.stopPropagation(); setSelectedRoute(row); }}>
              <RouteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); handleEdit(row); }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={row.status === 'active' ? 'Deactivate' : 'Activate'}>
            <Switch
              size="small"
              checked={row.status === 'active'}
              onChange={(e) => { e.stopPropagation(); handleToggleStatus(row); }}
              disabled={updateMutation.isPending}
              color="success"
            />
          </Tooltip>
        </Box>
      ),
    },
  ];

  const getStopCoordinates = (stop: TransportStop): [number, number] => {
    if (stop.longitude !== undefined && stop.latitude !== undefined) {
      return [stop.longitude, stop.latitude];
    }
    if (stop.coordinates) return stop.coordinates;
    if (schoolOrigin) return [schoolOrigin.longitude, schoolOrigin.latitude];
    return [77.5946, 12.9716]; // Bangalore (Karnataka default)
  };

  // Initial map center — school location once loaded, Bangalore fallback otherwise
  const initialCenter = useMemo<[number, number]>(
    () => schoolOrigin ? [schoolOrigin.longitude, schoolOrigin.latitude] : [77.5946, 12.9716],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // intentionally run once — this is only for the initial Map mount
  );

  // Update road route when active route changes
  useEffect(() => {
    const stops = selectedRoute?.stops?.map(s => {
      const [lng, lat] = getStopCoordinates(s);
      return { longitude: lng, latitude: lat };
    }) || [];

    if (stops.length === 0 && !schoolOrigin) {
      setRoadRoute([]);
      return;
    }

    setIsRouting(true);
    const origin = schoolOrigin ? { longitude: schoolOrigin.longitude, latitude: schoolOrigin.latitude } : undefined;

    fetchRoadRoute(stops, origin).then(route => {
      setRoadRoute(route);
      setIsRouting(false);
    });
  }, [selectedRoute, schoolOrigin]);

  // Per-stop popup state: which stop index is open
  const [openStopPopup, setOpenStopPopup] = useState<number | null>(null);

  return (
    <Box sx={{
      p: { xs: 1.5, sm: 2 },
      minHeight: '100vh',
      bgcolor: 'background.default',
      backgroundImage: 'radial-gradient(at 0% 0%, rgba(79, 70, 229, 0.05) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(129, 38, 207, 0.05) 0px, transparent 50%)'
    }}>
      <Typography variant="h5" sx={{ mb: 1.5, fontWeight: 800, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: 'primary.main', color: 'white', display: 'flex' }}>
          <BusIcon fontSize="small" />
        </Box>
        Transport Systems
      </Typography>

      {!schoolOrigin && !isLoading && (
        <Alert
          severity="warning"
          sx={{ mb: 2, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/school-admin/school-location')}>
              Configure Now
            </Button>
          }
        >
          School location is not set. Routes will not have a standard starting point.
        </Alert>
      )}

      {/* ── Row 1: Full-width table ── */}
      <DataTable<TransportRoute>
        title="Bus Routes"
        columns={columns}
        data={routes}
        isLoading={isLoading}
        error={error ? (error as { message?: string })?.message || 'Failed to load routes' : null}
        onAddClick={handleAdd}
        addButtonLabel="Create Route"
        emptyMessage="No routes found. Click 'Create Route' to start."
        renderHeaderActions={() => (
          <Button
            variant="outlined"
            startIcon={<NotificationsIcon />}
            onClick={() => setNotifDialogOpen(true)}
            sx={{ textTransform: 'none', borderRadius: 1 }}
          >
            Send Notification
          </Button>
        )}
        getRowKey={(row) => row._id || row.routeId}
      />

      {/* ── Row 2: Map + Route Info + Notifications (below table) ── */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2, mt: 2 }}>

        {/* Map */}
        <Card sx={{
          flex: 1,
          borderRadius: 2, overflow: 'hidden',
          border: '1px solid', borderColor: 'divider',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          bgcolor: 'background.paper',
        }}>
          <CardContent sx={{ p: 0, height: '450px', position: 'relative', '&:last-child': { pb: 0 } }}>
            <Map center={initialCenter} zoom={14} className="h-full w-full">
              <MapFlyTo schoolOrigin={schoolOrigin} selectedRoute={selectedRoute} getStopCoords={getStopCoordinates} />
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

              {/* Stop markers — clickable to show student popup */}
              {selectedRoute?.stops?.map((stop: TransportStop, index: number) => {
                const [lng, lat] = getStopCoordinates(stop);
                const isOpen = openStopPopup === index;
                return (
                  <MapMarker key={index} longitude={lng} latitude={lat}>
                    <MarkerContent>
                      <Box sx={{ position: 'relative', display: 'inline-block' }}>
                        {/* Numbered pin */}
                        <Box
                          onClick={() => setOpenStopPopup(isOpen ? null : index)}
                          sx={{
                            width: 28, height: 28, borderRadius: '50%',
                            bgcolor: isOpen ? 'primary.dark' : 'primary.main',
                            border: '2px solid white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '11px', fontWeight: 700, color: 'white',
                            cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                            transition: 'transform 0.15s',
                            '&:hover': { transform: 'scale(1.15)' },
                          }}
                        >
                          {index + 1}
                        </Box>

                        {/* Student popup card */}
                        {isOpen && (
                          <Box sx={{
                            position: 'absolute',
                            bottom: 36,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            bgcolor: 'background.paper',
                            borderRadius: 2,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                            border: '1px solid',
                            borderColor: 'divider',
                            minWidth: 220,
                            maxWidth: 280,
                            zIndex: 100,
                            overflow: 'hidden',
                          }}>
                            {/* Popup header */}
                            <Box sx={{ bgcolor: 'primary.main', px: 1.5, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="caption" sx={{ color: 'white', fontWeight: 700, display: 'block' }}>
                                  {index + 1}. {stop.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '10px' }}>
                                  Pickup: {stop.pickupTime || '—'}  |  Drop: {stop.dropTime || '—'}
                                </Typography>
                              </Box>
                              <IconButton
                                size="small"
                                onClick={(e) => { e.stopPropagation(); setOpenStopPopup(null); }}
                                sx={{ color: 'white', p: 0.25 }}
                              >
                                <CloseIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Box>

                            {/* Student list */}
                            <Box sx={{ p: 1.5 }}>
                              {(stop.students?.length ?? 0) === 0 ? (
                                <Typography variant="caption" color="text.secondary">No students assigned</Typography>
                              ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                                  {stop.students!.map((s, si) => (
                                    <Box key={si} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Avatar
                                        src={s.profileImage}
                                        sx={{ width: 28, height: 28, fontSize: 11, bgcolor: 'primary.light' }}
                                      >
                                        {s.firstName?.[0]}{s.lastName?.[0]}
                                      </Avatar>
                                      <Box>
                                        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', lineHeight: 1.2 }}>
                                          {s.firstName} {s.lastName}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                                          {s.className || s.class}{s.sectionName ? ` · ${s.sectionName}` : ''}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  ))}
                                </Box>
                              )}
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </MarkerContent>
                  </MapMarker>
                );
              })}

              {roadRoute.length > 0 && (
                <MapRoute coordinates={roadRoute} color="#4F46E5" width={4} opacity={0.8} />
              )}
            </Map>

            {isRouting && (
              <Box sx={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', bgcolor: 'background.paper', px: 2, py: 0.5, borderRadius: 20, boxShadow: 2, zIndex: 10 }}>
                <Typography variant="caption">Updating path...</Typography>
              </Box>
            )}

            {!selectedRoute && (
              <Box sx={{
                position: 'absolute', inset: 0,
                bgcolor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                zIndex: 2, p: 3, textAlign: 'center'
              }}>
                <RouteIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2, opacity: 0.8 }} />
                <Typography variant="h6" color="white" gutterBottom>Route Preview</Typography>
                <Typography variant="body2" color="rgba(255,255,255,0.6)">
                  Click the route icon in the table to view live tracing and stop info.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Route info + stops with students */}
        {selectedRoute && (
          <Card sx={{
            width: { xs: '100%', lg: '380px' },
            borderRadius: 4, border: '1px solid', borderColor: 'divider',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            bgcolor: 'background.paper', overflow: 'hidden', flexShrink: 0,
          }}>
            <Box sx={{ p: 2.5, bgcolor: 'primary.main', color: 'white' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{selectedRoute.routeName}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>Route ID: {selectedRoute.routeId}</Typography>
            </Box>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                {/* Vehicle & driver */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Vehicle & Driver</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}><strong>No:</strong> {selectedRoute.busNumber || selectedRoute.vehicleNumber || 'N/A'}</Typography>
                    <Typography variant="body2"><strong>Driver:</strong> {selectedRoute.driver?.name || selectedRoute.driverName || 'N/A'}</Typography>
                  </Box>
                  <AppButton size="small" variant="outlined" onClick={() => handleEdit(selectedRoute)} startIcon={<EditIcon fontSize="small" />} sx={{ borderRadius: 2, height: 32 }}>Edit</AppButton>
                </Box>

                <Divider />

                {/* Stop sequence with students */}
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                    Stop Sequence ({selectedRoute.stops.length})
                  </Typography>
                  <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 280, overflowY: 'auto', pr: 0.5 }}>
                    {selectedRoute.stops.map((stop: TransportStop, i: number) => (
                      <Box
                        key={i}
                        onClick={() => setOpenStopPopup(openStopPopup === i ? null : i)}
                        sx={{
                          display: 'flex', alignItems: 'flex-start', gap: 1.5,
                          p: 1, borderRadius: 1.5, cursor: 'pointer',
                          bgcolor: openStopPopup === i ? 'action.selected' : 'transparent',
                          '&:hover': { bgcolor: 'action.hover' },
                          transition: 'background 0.15s',
                        }}
                      >
                        <Box sx={{
                          width: 22, height: 22, borderRadius: '50%', bgcolor: 'primary.main',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '10px', color: 'white', flexShrink: 0, mt: 0.1,
                        }}>
                          {i + 1}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>{stop.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Pickup: {stop.pickupTime || '—'}  ·  Drop: {stop.dropTime || '—'}
                          </Typography>
                          {/* Students */}
                          {(stop.students?.length ?? 0) > 0 && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.75 }}>
                              {stop.students!.map((s, si) => (
                                <Chip
                                  key={si}
                                  size="small"
                                  avatar={
                                    <Avatar src={s.profileImage} sx={{ width: 18, height: 18, fontSize: 9 }}>
                                      {s.firstName?.[0]}{s.lastName?.[0]}
                                    </Avatar>
                                  }
                                  label={`${s.firstName} ${s.lastName}`}
                                  sx={{ fontSize: '10px', height: 20, '& .MuiChip-label': { px: 0.75 } }}
                                />
                              ))}
                            </Box>
                          )}
                          {(stop.students?.length ?? 0) === 0 && (
                            <Typography variant="caption" color="text.disabled" sx={{ display: 'flex', alignItems: 'center', gap: 0.3, mt: 0.3 }}>
                              <PersonIcon sx={{ fontSize: 11 }} /> No students
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>

      <TransportRouteDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        schoolId={schoolId}
        editData={editData}
      />

      {/* Notifications Dialog */}
      <Dialog
        open={notifDialogOpen}
        onClose={() => setNotifDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <NotificationsPanel
          routes={routes}
          schoolId={schoolId}
          onClose={() => setNotifDialogOpen(false)}
        />
      </Dialog>
    </Box>
  );
};

export default TransportRoutesPage;
