import { useEffect, useRef, useState } from 'react';
import maplibregl, { Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function LocoPilotInterface() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const [alerts] = useState([
    { id: 1, type: 'warning', message: 'Speed restriction ahead - 45 km/h', time: '14:25' },
    { id: 2, type: 'info', message: 'Next station: Arakkonam Jn (5.2 km)', time: '14:30' }
  ]);

  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current as HTMLDivElement,
      center: [79.0747, 12.9051], // Chennai area
      zoom: 12,
      style: {
        version: 8,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {
          basemap: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          },
          stateRails: {
            type: 'geojson',
            data: '/data/geojson/india.geojson'
          },
          stations: {
            type: 'geojson',
            data: '/data/stations/stations.geojson'
          }
        },
        layers: [
          {
            id: 'basemap',
            type: 'raster',
            source: 'basemap',
            minzoom: 0,
            paint: { 'raster-opacity': 0.95 }
          },
          {
            id: 'railway-outline',
            type: 'line',
            source: 'stateRails',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-width': ['interpolate', ['linear'], ['zoom'],
                8, 4,
                12, 6,
                16, 10
              ],
              'line-color': '#ffffff',
              'line-opacity': 0.9
            },
            minzoom: 8,
            maxzoom: 24
          },
          {
            id: 'railway',
            type: 'line',
            source: 'stateRails',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-width': ['interpolate', ['linear'], ['zoom'],
                8, 3,
                12, 4,
                16, 8
              ],
              'line-color': '#1f3a93',
              'line-opacity': 1
            },
            minzoom: 8,
            maxzoom: 24
          },
          // Stations layer with circles
          {
            id: 'stations',
            type: 'circle',
            source: 'stations',
            paint: {
              'circle-radius': ['interpolate', ['linear'], ['zoom'],
                0, 4,
                6, 6,
                10, 8,
                14, 10
              ],
              'circle-color': '#ff4444',
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 2,
              'circle-opacity': 0.8
            },
            minzoom: 0
          },
          // Station labels
          {
            id: 'station-labels',
            type: 'symbol',
            source: 'stations',
            layout: {
              'text-field': '📍',
              'text-size': ['interpolate', ['linear'], ['zoom'],
                0, 16,
                6, 18,
                10, 20,
                14, 24
              ],
              'text-anchor': 'center',
              'text-allow-overlap': true,
              'text-ignore-placement': true
            },
            paint: {
              'text-opacity': 1,
              'text-color': '#ff4444'
            },
            minzoom: 8
          }
        ]
      },
      attributionControl: { compact: true }
    });

    // Function to handle station clicks
    const handleStationClick = (e: any) => {
      const features = e.features;
      if (features && features.length > 0) {
        const station = features[0].properties;
        const coordinates = (features[0].geometry as any).coordinates.slice();
        
        // Create popup HTML
        const popupHtml = `
          <div style="padding: 10px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: #1f3a93; font-size: 16px;">${station.name}</h3>
            <p style="margin: 0; font-size: 12px; color: #666;"><strong>Code:</strong> ${station.code}</p>
            <p style="margin: 0; font-size: 12px; color: #666;"><strong>Zone:</strong> ${station.zone}</p>
            <p style="margin: 0; font-size: 12px; color: #666;"><strong>State:</strong> ${station.state}</p>
            <p style="margin: 0; font-size: 12px; color: #666;"><strong>Address:</strong> ${station.address}</p>
          </div>
        `;
        
        new maplibregl.Popup()
          .setLngLat(coordinates)
          .setHTML(popupHtml)
          .addTo(map);
      }
    };

    // Add click handlers for both station layers
    map.on('click', 'stations', handleStationClick);
    map.on('click', 'station-labels', handleStationClick);

    // Change cursor to pointer when hovering over stations
    map.on('mouseenter', 'stations', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseenter', 'station-labels', () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'stations', () => {
      map.getCanvas().style.cursor = '';
    });
    map.on('mouseleave', 'station-labels', () => {
      map.getCanvas().style.cursor = '';
    });

    // Add current train position marker
    new maplibregl.Marker({ color: '#0bda51', scale: 1.5 })
      .setLngLat([79.0747, 12.9051])
      .addTo(map);

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'danger': return '🚨';
      default: return 'ℹ️';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning': return '#ff8c00';
      case 'info': return '#0bda51';
      case 'danger': return '#ff4d4d';
      default: return '#0bda51';
    }
  };

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Mobile Header */}
      <div style={{ 
        background: '#1f3a93', 
        color: 'white', 
        padding: '8px 15px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '16px'
      }}>
        <div>
          <div style={{ fontWeight: 'bold' }}>Train 12622</div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>Chennai - Coimbatore Mail</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 'bold' }}>85 km/h</div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>Current Speed</div>
        </div>
      </div>

      {/* Alerts Panel */}
      <div style={{ 
        background: '#fff',
        borderBottom: '2px solid #e0e0e0',
        maxHeight: '120px',
        overflowY: 'auto'
      }}>
        {alerts.map(alert => (
          <div key={alert.id} style={{
            padding: '10px 15px',
            borderLeft: `4px solid ${getAlertColor(alert.type)}`,
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '18px' }}>{getAlertIcon(alert.type)}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>{alert.message}</div>
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>{alert.time}</div>
          </div>
        ))}
      </div>
      
      {/* Mini Map Container */}
      <div ref={containerRef} style={{ flex: 1, width: '100%' }} />
      
      {/* Bottom Status Panel */}
      <div style={{
        background: '#f8f9fa',
        padding: '10px 15px',
        borderTop: '2px solid #1f3a93',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '15px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f3a93' }}>5.2 km</div>
          <div style={{ fontSize: '12px', color: '#666' }}>Next Station</div>
          <div style={{ fontSize: '11px', color: '#999' }}>Arakkonam Jn</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0bda51' }}>3 min</div>
          <div style={{ fontSize: '12px', color: '#666' }}>ETA</div>
          <div style={{ fontSize: '11px', color: '#999' }}>14:33</div>
        </div>
      </div>
      
      {/* Emergency Button */}
      <div style={{ 
        position: 'fixed',
        bottom: '80px',
        right: '15px',
        zIndex: 1000
      }}>
        <button style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          border: '3px solid #fff',
          background: '#ff4d4d',
          color: 'white',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          🚨
        </button>
      </div>
    </div>
  );
}