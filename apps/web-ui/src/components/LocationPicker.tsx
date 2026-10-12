import { useState, useEffect, useMemo } from 'react';
import {
    Box,
    TextField,
    Paper,
    Typography,
} from '@mui/material';
import { School as SchoolIcon } from '@mui/icons-material';
import { Map, MapMarker, MapControls, MarkerContent, MapSearch, useMap } from '@/components/ui/map';
import type MapLibreGL from 'maplibre-gl';

interface LocationPickerProps {
    latitude?: number;
    longitude?: number;
    radiusMeters?: number;
    onLocationChange: (lat: number, lng: number, radius: number) => void;
}

// ---------------------------------------------------------------------------
// RadiusCircleLayer — draws a GeoJSON filled + outlined circle on the map.
// Must be a child of <Map> so useMap() resolves correctly.
// ---------------------------------------------------------------------------

function createCircleGeoJSON(lng: number, lat: number, radiusMeters: number): GeoJSON.Feature<GeoJSON.Polygon> {
    const points = 64;
    const degPerMeterLat = 1 / 111320;
    const degPerMeterLng = 1 / (111320 * Math.cos((lat * Math.PI) / 180));
    const coords: [number, number][] = Array.from({ length: points + 1 }, (_, i) => {
        const angle = (i / points) * 2 * Math.PI;
        return [
            lng + radiusMeters * degPerMeterLng * Math.cos(angle),
            lat + radiusMeters * degPerMeterLat * Math.sin(angle),
        ];
    });
    return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] }, properties: {} };
}

function RadiusCircleLayer({ longitude, latitude, radiusMeters }: {
    longitude: number;
    latitude: number;
    radiusMeters: number;
}) {
    const { map, isLoaded } = useMap();
    const SOURCE = 'school-radius-source';
    const FILL_LAYER = 'school-radius-fill';
    const LINE_LAYER = 'school-radius-line';

    useEffect(() => {
        if (!map || !isLoaded) return;
        const geojson = createCircleGeoJSON(longitude, latitude, radiusMeters);
        try {
            if (map.getSource(SOURCE)) {
                (map.getSource(SOURCE) as MapLibreGL.GeoJSONSource).setData(geojson);
            } else {
                map.addSource(SOURCE, { type: 'geojson', data: geojson });
                map.addLayer({ id: FILL_LAYER, type: 'fill', source: SOURCE, paint: { 'fill-color': '#1976d2', 'fill-opacity': 0.15 } });
                map.addLayer({ id: LINE_LAYER, type: 'line', source: SOURCE, paint: { 'line-color': '#1976d2', 'line-width': 2, 'line-opacity': 0.9 } });
            }
        } catch (e) { console.warn('RadiusCircleLayer error:', e); }

        return () => {
            try {
                if (map.getLayer(LINE_LAYER)) map.removeLayer(LINE_LAYER);
                if (map.getLayer(FILL_LAYER)) map.removeLayer(FILL_LAYER);
                if (map.getSource(SOURCE)) map.removeSource(SOURCE);
            } catch { /* already removed */ }
        };
    }, [map, isLoaded, longitude, latitude, radiusMeters]);

    return null;
}

// ---------------------------------------------------------------------------
// Main LocationPicker component
// ---------------------------------------------------------------------------

const LocationPicker = ({
    latitude,
    longitude,
    radiusMeters = 100,
    onLocationChange,
}: LocationPickerProps) => {
    const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
        latitude && longitude ? { lat: latitude, lng: longitude } : null
    );
    const [radius, setRadius] = useState(radiusMeters);
    // Default map center — resolved from geolocation on mount
    const [geoCenter, setGeoCenter] = useState<[number, number]>([77.5946, 12.9716]); // Bangalore fallback

    // On mount, get browser location as the default viewport (only if no school position saved)
    useEffect(() => {
        if (position) return;
        if (!('geolocation' in navigator)) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => setGeoCenter([pos.coords.longitude, pos.coords.latitude]),
            () => { /* silently fall back to Bangalore */ }
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const mapCenter = useMemo<[number, number]>(
        () => position ? [position.lng, position.lat] : geoCenter,
        [position, geoCenter]
    );
    const mapZoom = position ? 16 : 13;

    // Notify parent whenever position or radius changes
    useEffect(() => {
        if (position) onLocationChange(position.lat, position.lng, radius);
    }, [position, radius, onLocationChange]);

    const handleMapClick = (e: { lngLat: { lng: number; lat: number } }) => {
        setPosition({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    };

    return (
        <Box>
            {/* Map — search is embedded inside */}
            <Paper sx={{ overflow: 'hidden', borderRadius: 2, mb: 2 }}>
                <Box sx={{ height: 460, width: '100%' }}>
                    <Map
                        center={mapCenter}
                        zoom={mapZoom}
                        className="h-full w-full"
                        onClick={handleMapClick}
                    >
                        {/* Karnataka-restricted search inside the map */}
                        <MapSearch
                            position="top-left"
                            placeholder="Search school location in Karnataka..."
                            viewbox="74.0,11.5,78.5,18.5"
                            countrycodes="in"
                            onResultSelect={(res) => setPosition({ lat: res.latitude, lng: res.longitude })}
                        />

                        <MapControls showZoom showLocate showFullscreen />

                        {position && (
                            <>
                                <RadiusCircleLayer
                                    longitude={position.lng}
                                    latitude={position.lat}
                                    radiusMeters={radius}
                                />
                                <MapMarker
                                    longitude={position.lng}
                                    latitude={position.lat}
                                    draggable
                                    onDragEnd={(lngLat) => setPosition({ lat: lngLat.lat, lng: lngLat.lng })}
                                >
                                    <MarkerContent>
                                        <div style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: '50%',
                                            background: '#1e1b4b',
                                            border: '2.5px solid white',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'grab',
                                        }}>
                                            <SchoolIcon sx={{ fontSize: 18, color: 'white' }} />
                                        </div>
                                    </MarkerContent>
                                </MapMarker>
                            </>
                        )}

                        {!position && (
                            <MapMarker longitude={mapCenter[0]} latitude={mapCenter[1]}>
                                <MarkerContent>
                                    <Box sx={{
                                        bgcolor: 'background.paper',
                                        px: 1.5, py: 0.5, borderRadius: 2,
                                        boxShadow: 2, fontSize: 12,
                                        whiteSpace: 'nowrap', color: 'text.secondary',
                                        pointerEvents: 'none',
                                    }}>
                                        Click the map to set school location
                                    </Box>
                                </MarkerContent>
                            </MapMarker>
                        )}
                    </Map>
                </Box>
            </Paper>

            {/* Selected coordinates info */}
            {position && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, px: 0.5 }}>
                    Coordinates: {position.lat.toFixed(6)}, {position.lng.toFixed(6)} (drag pin to adjust)
                </Typography>
            )}

            {/* Coordinates & Radius Inputs */}
            <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 2, flex: 1, minWidth: 300, flexWrap: 'wrap' }}>
                        <TextField
                            label="Latitude"
                            type="number"
                            size="small"
                            value={position?.lat ?? ''}
                            onChange={(e) => {
                                const lat = parseFloat(e.target.value);
                                if (!isNaN(lat)) setPosition({ lat, lng: position?.lng ?? 0 });
                            }}
                            sx={{ flex: 1, minWidth: 120 }}
                        />
                        <TextField
                            label="Longitude"
                            type="number"
                            size="small"
                            value={position?.lng ?? ''}
                            onChange={(e) => {
                                const lng = parseFloat(e.target.value);
                                if (!isNaN(lng)) setPosition({ lat: position?.lat ?? 0, lng });
                            }}
                            sx={{ flex: 1, minWidth: 120 }}
                        />
                    </Box>
                    <TextField
                        type="number"
                        label="Allowed Radius (meters)"
                        value={radius}
                        onChange={(e) => setRadius(Math.max(10, parseInt(e.target.value) || 100))}
                        size="small"
                        sx={{ width: 180 }}
                        inputProps={{ min: 10, max: 5000 }}
                    />
                </Box>
            </Paper>
        </Box>
    );
};

export default LocationPicker;
