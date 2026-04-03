declare module 'leaflet' {
    const L: any;
    export default L;
}

declare module 'leaflet/dist/images/*.png' {
    const src: string;
    export default src;
}

declare module 'react-leaflet' {
    import * as React from 'react';

    export const MapContainer: React.ComponentType<any>;
    export const Marker: React.ComponentType<any>;
    export const Popup: React.ComponentType<any>;
    export const TileLayer: React.ComponentType<any>;
}
