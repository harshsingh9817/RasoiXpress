
"use client";

import type { FC } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

interface LocationMapProps {
  position: [number, number];
  zoom?: number;
}

const LocationMap: FC<LocationMapProps> = ({ position, zoom = 14 }) => {
  return (
    <MapContainer center={position} zoom={zoom} scrollWheelZoom={false} style={{ height: '200px', width: '100%', borderRadius: '0.5rem' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position}>
        <Popup>
          Your approximate delivery area.
        </Popup>
      </Marker>
    </MapContainer>
  );
};

export default LocationMap;
