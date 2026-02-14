'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import styles from './map.module.css';

const MapContainer = dynamic(() =>
    import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() =>
    import('react-leaflet').then(m => m.TileLayer), { ssr: false });

type LatLng = { lat: number; lng: number };

export default function MapPage() {
    // Center on CSUMB for now
    const defaultCenter = useMemo<LatLng>(() => ({ lat: 36.6537, lng: -121.7990 }), []);

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Map</h2>

            <div className={styles.mapWrapper}>
                <MapContainer
                    center={[defaultCenter.lat, defaultCenter.lng]}
                    zoom={12}
                    scrollWheelZoom
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution="&copy; OpenStreetMap contributors"
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                </MapContainer>
            </div>
        </div>
    );
}
