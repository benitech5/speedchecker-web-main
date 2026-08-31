import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { hasPosition, MAP_CENTER, MAP_DEFAULT_ZOOM, GHANA_BOUNDS } from '../utils/liveVehicle.js';
import { alertTypeLabel, formatAlertTime } from '../utils/alerts.js';

const baseIconOptions = {
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
};

const defaultIcon = L.icon(baseIconOptions);

const alertIcon = L.divIcon({
  className: 'vehicle-alert-marker',
  html: '<span class="vehicle-alert-dot" aria-hidden="true"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -12],
});

const startIcon = L.divIcon({
  className: 'route-endpoint-marker',
  html: '<span class="route-endpoint start">S</span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -12],
});

const endIcon = L.divIcon({
  className: 'route-endpoint-marker',
  html: '<span class="route-endpoint end">E</span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -12],
});

const tripAlertIcon = L.divIcon({
  className: 'trip-alert-marker',
  html: '<span class="trip-alert-dot" aria-hidden="true"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -10],
});

const GEOFENCE_STYLE = {
  allowed: { color: '#188a55', fillColor: '#188a55', fillOpacity: 0.12 },
  restricted: { color: '#cf1238', fillColor: '#cf1238', fillOpacity: 0.12 },
};

function FitRouteBounds({ positions, fitKey }) {
  const map = useMap();
  const fittedKeyRef = useRef(null);

  useEffect(() => {
    if (!positions?.length) return;
    if (fittedKeyRef.current === fitKey) return;
    const bounds = L.latLngBounds(positions);
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16 });
    fittedKeyRef.current = fitKey;
  }, [map, positions, fitKey]);

  return null;
}

export default function FleetMap({
  vehicles = [],
  geofences = [],
  routePoints = [],
  routeAlerts = [],
  showStartEnd = false,
  startTime = null,
  endTime = null,
  fitKey = null,
  height = '480px',
  showGeofences = true,
  center = MAP_CENTER,
  zoom = MAP_DEFAULT_ZOOM,
  className = '',
}) {
  const mappable = vehicles.filter(hasPosition);
  const routeLatLngs = routePoints.length >= 2 ? routePoints : [];
  const alertMarkers = routeAlerts.filter(
    (a) => a.latitude != null && a.longitude != null,
  );

  return (
    <div className={`fleet-map-wrap ${className}`.trim()} style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        minZoom={6}
        maxBounds={GHANA_BOUNDS}
        maxBoundsViscosity={0.85}
        className="fleet-map"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · Ghana / Ashanti'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {routeLatLngs.length >= 2 && (
          <>
            <Polyline
              positions={routeLatLngs}
              pathOptions={{ color: '#2563eb', weight: 4, opacity: 0.85 }}
            />
            <FitRouteBounds positions={routeLatLngs} fitKey={fitKey || 'route'} />
          </>
        )}

        {showStartEnd && routeLatLngs.length >= 1 && (
          <Marker position={routeLatLngs[0]} icon={startIcon}>
            <Popup>
              <strong>Start</strong>
              {startTime && (
                <>
                  <br />
                  {formatAlertTime(startTime)}
                </>
              )}
            </Popup>
          </Marker>
        )}

        {showStartEnd && routeLatLngs.length >= 2 && (
          <Marker position={routeLatLngs[routeLatLngs.length - 1]} icon={endIcon}>
            <Popup>
              <strong>End</strong>
              {endTime && (
                <>
                  <br />
                  {formatAlertTime(endTime)}
                </>
              )}
            </Popup>
          </Marker>
        )}

        {alertMarkers.map((a) => (
          <Marker
            key={a.id}
            position={[a.latitude, a.longitude]}
            icon={tripAlertIcon}
          >
            <Popup>
              <strong>{alertTypeLabel(a.type)}</strong>
              <br />
              {String(a.severity || '').toUpperCase()}
              <br />
              {a.message}
              <br />
              {formatAlertTime(a.createdAt)}
            </Popup>
          </Marker>
        ))}

        {showGeofences && geofences.map((g) => (
          <Circle
            key={g.id}
            center={[g.centerLat, g.centerLng]}
            radius={g.radiusM}
            pathOptions={GEOFENCE_STYLE[g.type] || GEOFENCE_STYLE.allowed}
          >
            <Popup>
              <strong>{g.name}</strong>
              <br />
              Type: {g.type}
              <br />
              Radius: {g.radiusM} m
            </Popup>
          </Circle>
        ))}

        {mappable.map((v) => {
          const hasAlert = (v.openAlertCount ?? 0) > 0;
          const latest = v.latestAlert;
          return (
            <Marker
              key={v.vehicleId}
              position={[v.latitude, v.longitude]}
              icon={hasAlert ? alertIcon : defaultIcon}
            >
              <Popup>
                <strong>{v.plateNumber}</strong>
                <br />
                {v.label}
                <br />
                Status: {v.status}
                <br />
                Speed: {Math.round(v.speedKmh ?? 0)} km/h
                {hasAlert && latest && (
                  <>
                    <br />
                    <span className="map-alert-line">
                      Alert: {alertTypeLabel(latest.type)} ({latest.severity})
                    </span>
                  </>
                )}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
