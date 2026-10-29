import { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  ImageOverlay,
  Marker,
  Popup,
  ZoomControl,
  useMap,
} from 'react-leaflet';
import { divIcon } from 'leaflet';
import { Link } from 'react-router-dom';
import { WifiOff, MapPin } from 'lucide-react';
import type { Spot } from './types';
import { money } from './api';
function Follow({ spot }: { spot?: Spot }) {
  const map = useMap();
  useEffect(() => {
    if (spot) map.flyTo([spot.latitude, spot.longitude], 15, { duration: 0.6 });
  }, [spot?.id, map]);
  return null;
}
export function ParkingMap({
  spots,
  selected,
  onSelect,
}: {
  spots: Spot[];
  selected?: string;
  onSelect: (id: string) => void;
}) {
  const [offline, setOffline] = useState(!import.meta.env.VITE_TILE_URL);
  return (
    <div className="map-wrap">
      <div className={`map-status ${offline ? 'offline' : ''}`}>
        {offline ? <WifiOff size={14} /> : <MapPin size={14} />}
        <span>{offline ? 'Local demo map · fictional area' : 'Interactive map'}</span>
      </div>
      <MapContainer
        center={[12.9346, 77.6057]}
        zoom={14}
        minZoom={12}
        maxZoom={18}
        className="parking-map"
        scrollWheelZoom={false}
        zoomControl={false}
      >
        <ZoomControl position="topright" />
        {offline ? (
          <ImageOverlay
            url="/demo/campus-map.svg"
            bounds={[
              [12.91, 77.58],
              [12.96, 77.635],
            ]}
          />
        ) : (
          <TileLayer
            url={import.meta.env.VITE_TILE_URL}
            attribution={
              import.meta.env.VITE_TILE_ATTRIBUTION ?? '&copy; OpenStreetMap contributors'
            }
            eventHandlers={{ tileerror: () => setOffline(true) }}
          />
        )}
        {spots.map((s) => (
          <Marker
            key={s.id}
            position={[s.latitude, s.longitude]}
            icon={divIcon({
              className: 'price-pin-wrap',
              html: `<span class="price-pin ${selected === s.id ? 'active' : ''}">₹${Math.round(s.hourlyPrice / 100)}</span>`,
              iconSize: [66, 34],
              iconAnchor: [33, 34],
            })}
            eventHandlers={{ click: () => onSelect(s.id) }}
          >
            <Popup>
              <strong>{s.title}</strong>
              <p>{money(s.hourlyPrice)} / hour</p>
              <Link to={`/explore/${s.id}`}>View this space →</Link>
            </Popup>
          </Marker>
        ))}
        <Follow spot={spots.find((s) => s.id === selected)} />
      </MapContainer>
      {offline && (
        <div className="map-caption">
          Offline map illustration. Parking search and bookings still work.
        </div>
      )}
      <span className="campus-label">
        DRIVESHARE UNIVERSITY
        <br />
        <small>Fictional demonstration campus</small>
      </span>
    </div>
  );
}
