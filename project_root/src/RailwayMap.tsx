import { useEffect, useRef, useState } from 'react';
import maplibregl, { Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function RailwayMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const [fromDestination, setFromDestination] = useState('');
  const [toDestination, setToDestination] = useState('');

  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current as HTMLDivElement,
      center: [77.2, 28.6],
      zoom: 8,
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
          openmaptiles: {
            type: 'vector',
            tiles: ['https://tiles.stadiamaps.com/data/openmaptiles/{z}/{x}/{y}.pbf'],
            attribution: '© OpenMapTiles © OpenStreetMap contributors'
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

          // 1) Outline / halo for better contrast (drawn UNDER the rail)
          {
            id: 'railway-outline',
            type: 'line',
            source: 'openmaptiles',
            'source-layer': 'transportation',
            filter: ['==', ['get', 'class'], 'rail'],
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
              visibility: 'visible'
            },
            paint: {
              // wide translucent outline so rails pop at low zoom
              // minimum width at zoom 0 is 3, grows with zoom
              'line-width': ['interpolate', ['linear'], ['zoom'],
                0, 3,
                4, 3,
                6, 3,
                10, 4,
                14, 6,
                18, 10
              ],
              'line-color': '#ffffff',    // halo color (light)
              'line-opacity': 0.9
            },
            minzoom: 0,
            maxzoom: 24
          },

          // 2) Actual rail stroke on top of outline
          {
            id: 'railway',
            type: 'line',
            source: 'openmaptiles',
            'source-layer': 'transportation',
            filter: ['==', ['get', 'class'], 'rail'],
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
              visibility: 'visible'
            },
            paint: {
              // ensure a visible minimum width at low zooms and nicer scaling
              'line-width': ['interpolate', ['linear'], ['zoom'],
                0, 2,   // more visible at world zoom
                4, 2,
                6, 2,
                10, 2.5,
                14, 3,
                18, 6
              ],
              'line-color': '#1f3a93',
              'line-opacity': 1
            },
            minzoom: 0,
            maxzoom: 24
          },

          // 3) Your state GeoJSON overlay (guaranteed detail where provided)
          {
            id: 'state-rails-overlay-outline',
            type: 'line',
            source: 'stateRails',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-width': ['interpolate', ['linear'], ['zoom'],
                0, 3,
                4, 3,
                6, 3,
                10, 4,
                14, 6,
                18, 10
              ],
              'line-color': '#ffffff',
              'line-opacity': 0.9
            },
            minzoom: 0,
            maxzoom: 24
          },
          {
            id: 'state-rails-overlay',
            type: 'line',
            source: 'stateRails',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-width': ['interpolate', ['linear'], ['zoom'],
                0, 2,
                4, 2,
                6, 2,
                10, 2.5,
                14, 3,
                18, 6
              ],
              'line-color': '#1f3a93',
              'line-opacity': 1
            },
            minzoom: 0,
            maxzoom: 24
          },
          // Stations layer with location pin emoji
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

    // Debug: Check if stations source loads
    map.on('sourcedata', (e) => {
      if (e.sourceId === 'stations' && e.isSourceLoaded) {
        console.log('Stations data loaded:', map.getSource('stations'));
      }
    });

    // Debug: Check if stations layer is added
    map.on('styledata', () => {
      const layer = map.getLayer('stations');
      if (layer) {
        console.log('Stations layer exists:', layer);
        console.log('Layer visibility:', map.getLayoutProperty('stations', 'visibility'));
      }
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

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const fromMarkerRef = useRef<maplibregl.Marker | null>(null);
  const toMarkerRef = useRef<maplibregl.Marker | null>(null);

  async function geocodeOnce(q: string) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=in&q=${encodeURIComponent(q)}&limit=1`;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'sih-map/1.0' } });
      if (!res.ok) return null;
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return null;
      const first = data[0];
      return { lon: parseFloat(first.lon), lat: parseFloat(first.lat), display_name: first.display_name };
    } catch {
      return null;
    }
  }

  async function handleToolbarSearch() {
    if (!fromDestination.trim() || !toDestination.trim() || !mapRef.current) return;
    const [a, b] = await Promise.all([geocodeOnce(fromDestination), geocodeOnce(toDestination)]);
    const m = mapRef.current;
    fromMarkerRef.current?.remove();
    toMarkerRef.current?.remove();
    fromMarkerRef.current = null;
    toMarkerRef.current = null;

    const pts: Array<[number, number]> = [];
    if (a) {
      fromMarkerRef.current = new maplibregl.Marker({ color: '#0bda51' }).setLngLat([a.lon, a.lat]).addTo(m);
      pts.push([a.lon, a.lat]);
    }
    if (b) {
      toMarkerRef.current = new maplibregl.Marker({ color: '#ff4d4d' }).setLngLat([b.lon, b.lat]).addTo(m);
      pts.push([b.lon, b.lat]);
    }

    if (pts.length === 1) {
      m.flyTo({ center: pts[0], zoom: 12 });
    } else if (pts.length === 2) {
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend(pts[0]);
      bounds.extend(pts[1]);
      m.fitBounds(bounds, { padding: 80, duration: 800 });
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div style={{
        position: 'absolute',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        background: 'rgba(255,255,255,0.95)',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        padding: 8,
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        minWidth: 360
      }}>
        <input
          type="text"
          placeholder="From destination"
          value={fromDestination}
          onChange={e => setFromDestination(e.target.value)}
          style={{ padding: '6px 8px', border: '1px solid #ccc', borderRadius: 4, width: 180 }}
        />
        <input
          type="text"
          placeholder="To destination"
          value={toDestination}
          onChange={e => setToDestination(e.target.value)}
          style={{ padding: '6px 8px', border: '1px solid #ccc', borderRadius: 4, width: 180 }}
        />
        <button
          onClick={handleToolbarSearch}
          style={{ padding: '6px 12px', background: '#0b6bcb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        >
          Search
        </button>
      </div>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
