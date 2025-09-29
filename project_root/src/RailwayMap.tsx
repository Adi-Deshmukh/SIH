import { useEffect, useRef, useState } from 'react';
import maplibregl, { Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getSectionById } from './config/railwaySections';

interface RailwayMapProps {
  userSection?: string;
  selectedStations?: { from: string; to: string };
}

export default function RailwayMap({ userSection, selectedStations }: RailwayMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const [showStationList, setShowStationList] = useState(true);
  const [mapViewMode, setMapViewMode] = useState<'normal' | 'satellite' | 'railway'>('normal');
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [stationFilter, setStationFilter] = useState('');

  useEffect(() => {
    // Get section-specific map configuration
    const sectionConfig = userSection ? getSectionById(userSection) : null;
    const mapCenter: [number, number] = sectionConfig 
      ? [sectionConfig.center.lng, sectionConfig.center.lat] 
      : [77.2, 28.6]; // Default center for India
    const mapZoom = sectionConfig?.zoom || 8;

    const map = new maplibregl.Map({
      container: containerRef.current as HTMLDivElement,
      center: mapCenter,
      zoom: mapZoom,
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

    // Fit to section bounds if available
    if (sectionConfig) {
      const bounds = new maplibregl.LngLatBounds([
        [sectionConfig.bounds.west, sectionConfig.bounds.south],
        [sectionConfig.bounds.east, sectionConfig.bounds.north]
      ]);
      map.fitBounds(bounds, { 
        padding: 50,
        duration: 1000,
        maxZoom: sectionConfig.zoom 
      });
    }

    // Add station filtering and section highlighting after map loads
    map.on('load', () => {
      if (sectionConfig && sectionConfig.stations.length > 0) {
        // Create a filter for stations in the current section
        const stationFilter: any[] = ['in', ['get', 'name']];
        sectionConfig.stations.forEach(stationName => {
          // Extract just the station name without the code
          const cleanName = stationName.split(' (')[0];
          stationFilter.push(cleanName);
        });

        // Apply filter to station layers to only show section stations
        map.setFilter('stations', stationFilter as any);
        map.setFilter('station-labels', stationFilter as any);
        
        // Add section bounds visualization
        const boundsSource = {
          type: 'geojson' as const,
          data: {
            type: 'Feature' as const,
            properties: {},
            geometry: {
              type: 'Polygon' as const,
              coordinates: [[
                [sectionConfig.bounds.west, sectionConfig.bounds.north],
                [sectionConfig.bounds.east, sectionConfig.bounds.north],
                [sectionConfig.bounds.east, sectionConfig.bounds.south],
                [sectionConfig.bounds.west, sectionConfig.bounds.south],
                [sectionConfig.bounds.west, sectionConfig.bounds.north]
              ]]
            }
          }
        };

        map.addSource('section-bounds', boundsSource);
        map.addLayer({
          id: 'section-bounds-fill',
          type: 'fill',
          source: 'section-bounds',
          paint: {
            'fill-color': '#00529F',
            'fill-opacity': 0.1
          }
        }, 'stations');

        map.addLayer({
          id: 'section-bounds-outline',
          type: 'line',
          source: 'section-bounds',
          paint: {
            'line-color': '#00529F',
            'line-width': 3,
            'line-dasharray': [5, 5],
            'line-opacity': 0.8
          }
        }, 'stations');
        
        console.log(`Applied filter for ${sectionConfig.name}: ${sectionConfig.stations.length} stations`);
      }
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [userSection]); // Re-initialize when section changes

  // Station interaction functions
  const handleStationClick = (stationName: string) => {
    setSelectedStation(stationName);
    if (mapRef.current) {
      // Highlight the selected station
      console.log(`Selected station: ${stationName}`);
      
      // If we have route info, show if this station is part of the route
      if (selectedStations) {
        const isRouteStation = stationName === selectedStations.from || stationName === selectedStations.to;
        if (isRouteStation) {
          console.log(`Station ${stationName} is part of the selected route`);
        }
      }
    }
  };

  const handleZoomToSection = () => {
    if (mapRef.current && userSection) {
      const sectionConfig = getSectionById(userSection);
      if (sectionConfig) {
        const bounds = new maplibregl.LngLatBounds([
          [sectionConfig.bounds.west, sectionConfig.bounds.south],
          [sectionConfig.bounds.east, sectionConfig.bounds.north]
        ]);
        mapRef.current.fitBounds(bounds, { 
          padding: 50,
          duration: 1000,
          maxZoom: sectionConfig.zoom 
        });
      }
    }
  };

  const changeMapStyle = (mode: 'normal' | 'satellite' | 'railway') => {
    setMapViewMode(mode);
    if (mapRef.current) {
      // Update map style based on mode
      let rasterOpacity = 0.95;
      let railwayOpacity = 1;
      
      switch (mode) {
        case 'satellite':
          rasterOpacity = 0.3; // Show more satellite imagery
          break;
        case 'railway':
          rasterOpacity = 0.5; // Emphasize railway lines
          railwayOpacity = 1;
          break;
        default:
          rasterOpacity = 0.95;
      }
      
      mapRef.current.setPaintProperty('basemap', 'raster-opacity', rasterOpacity);
      mapRef.current.setPaintProperty('railway', 'line-opacity', railwayOpacity);
    }
  };

  const sectionInfo = userSection ? getSectionById(userSection) : null;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Section Information Overlay */}
      {sectionInfo && (
        <div style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 10,
          background: 'rgba(0, 82, 159, 0.95)',
          color: 'white',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          padding: 12,
          minWidth: 200,
          fontSize: '14px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
            {sectionInfo.displayName}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>
            {sectionInfo.description}
          </div>
          <div style={{ fontSize: '12px', marginTop: 4 }}>
            Stations: {sectionInfo.stations.length}
          </div>
          {selectedStations && (
            <div style={{ fontSize: '11px', marginTop: 6, padding: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 4 }}>
              Route: {selectedStations.from} → {selectedStations.to}
            </div>
          )}
        </div>
      )}

      {/* Map Control Toolbar */}
      <div style={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 10,
        background: 'rgba(255,255,255,0.95)',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minWidth: 200
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#333', marginBottom: 4 }}>
          Map Controls
        </div>
        
        {/* View Mode Buttons */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => changeMapStyle('normal')}
            className={`btn ${mapViewMode === 'normal' ? 'btn-primary' : 'btn-outline-primary'} btn-sm`}
            style={{ fontSize: '11px' }}
          >
            Normal
          </button>
          <button
            onClick={() => changeMapStyle('satellite')}
            className={`btn ${mapViewMode === 'satellite' ? 'btn-primary' : 'btn-outline-primary'} btn-sm`}
            style={{ fontSize: '11px' }}
          >
            Satellite
          </button>
          <button
            onClick={() => changeMapStyle('railway')}
            className={`btn ${mapViewMode === 'railway' ? 'btn-primary' : 'btn-outline-primary'} btn-sm`}
            style={{ fontSize: '11px' }}
          >
            Railway
          </button>
        </div>

        {/* Action Buttons */}
        <button
          onClick={handleZoomToSection}
          className="btn btn-success btn-sm"
          style={{ fontSize: '12px' }}
        >
          <i className="bi bi-geo-alt-fill me-1"></i>
          Zoom to Section
        </button>

        <button
          onClick={() => setShowStationList(!showStationList)}
          className="btn btn-info btn-sm"
          style={{ fontSize: '12px' }}
        >
          <i className={`bi ${showStationList ? 'bi-eye-slash' : 'bi-eye'} me-1`}></i>
          {showStationList ? 'Hide' : 'Show'} Stations
        </button>
      </div>
      <div ref={containerRef} style={{ width: '100%', height: showStationList ? '70%' : '100%' }} />
      
      {/* Station List Panel */}
      {showStationList && sectionInfo && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '30%',
          background: 'white',
          borderTop: '2px solid #00529F',
          overflowY: 'auto',
          zIndex: 5
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #e0e0e0',
            background: '#f8f9fa',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h5 style={{ margin: 0, color: '#00529F' }}>
                <i className="bi bi-train-front-fill me-2"></i>
                {sectionInfo.name}
              </h5>
              <small style={{ color: '#666' }}>
                {sectionInfo.stations.length} Total • {sectionInfo.majorStations.length} Major • {sectionInfo.stations.length - sectionInfo.majorStations.length} Regular
              </small>
            </div>
            <button
              onClick={() => setShowStationList(false)}
              className="btn btn-sm btn-outline-secondary"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          
          <div style={{ padding: '16px' }}>
            {/* Station Search */}
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Search stations..."
                value={stationFilter}
                onChange={(e) => setStationFilter(e.target.value)}
                className="form-control"
                style={{ 
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '8px 12px'
                }}
              />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '12px'
            }}>
              {sectionInfo.stations
                .filter(station => 
                  stationFilter === '' || 
                  station.toLowerCase().includes(stationFilter.toLowerCase())
                )
                .map((station, index) => (
                <div
                  key={station}
                  onClick={() => handleStationClick(station)}
                  style={{
                    padding: '12px',
                    border: selectedStation === station ? '2px solid #00529F' : '1px solid #e0e0e0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: selectedStation === station ? '#e8f4fd' : 'white',
                    boxShadow: selectedStation === station ? '0 2px 8px rgba(0,82,159,0.2)' : '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedStation !== station) {
                      e.currentTarget.style.background = '#f8f9fa';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedStation !== station) {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{
                        fontWeight: 'bold',
                        color: '#00529F',
                        fontSize: '14px'
                      }}>
                        {station}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#666',
                        marginTop: '2px'
                      }}>
                        Station #{index + 1} • {sectionInfo.majorStations.includes(station) ? 'Major Station' : 'Regular Station'}
                      </div>
                    </div>
                    <div style={{
                      background: sectionInfo.majorStations.includes(station) ? '#28a745' : '#6c757d',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}>
                      {sectionInfo.majorStations.includes(station) ? 'MAJOR' : 'STD'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Route Information */}
            {selectedStations && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#e8f4fd',
                border: '1px solid #00529F',
                borderRadius: '8px'
              }}>
                <h6 style={{ margin: '0 0 8px 0', color: '#00529F' }}>
                  <i className="bi bi-arrow-left-right me-2"></i>
                  Selected Route
                </h6>
                <div style={{ fontSize: '14px', color: '#333' }}>
                  <strong>From:</strong> {selectedStations.from} <br />
                  <strong>To:</strong> {selectedStations.to}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
