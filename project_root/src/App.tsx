import { useState } from 'react'
import { Login } from './components/Login'
import { StationSelect } from './components/StationSelect'
import { MainLayout } from './components/MainLayout'
import ControllerDashboard from '../frontend/controller_dashboard/ControllerDashboard'
import LocoPilotInterface from '../frontend/loco_pilot/LocoPilotInterface'
import RailwayMap from './RailwayMap'

type AppState = 'login' | 'station-select' | 'dashboard';
type ViewType = 'map' | 'controller' | 'loco';

interface SelectedStations {
  from: string;
  to: string;
}

function App() {
  const [appState, setAppState] = useState<AppState>('login');
  const [userSection, setUserSection] = useState<string>('');
  const [selectedStations, setSelectedStations] = useState<SelectedStations | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('map');

  const handleLoginSuccess = (section: string) => {
    setUserSection(section);
    setAppState('station-select');
  };

  const handleStationsSelected = (stations: SelectedStations) => {
    setSelectedStations(stations);
    setAppState('dashboard');
  };

  const handleLogout = () => {
    setAppState('login');
    setUserSection('');
    setSelectedStations(null);
    setCurrentView('map');
  };

  // Render login page
  if (appState === 'login') {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Render station selection page
  if (appState === 'station-select') {
    return (
      <StationSelect 
        onStationsSelected={handleStationsSelected}
        userSection={userSection}
      />
    );
  }

  // Render main dashboard
  const renderCurrentView = () => {
    switch (currentView) {
      case 'controller':
        return <ControllerDashboard />;
      case 'loco':
        return <LocoPilotInterface />;
      default:
        return (
          <RailwayMap 
            userSection={userSection} 
            selectedStations={selectedStations} 
          />
        );
    }
  };

  return (
    <MainLayout>
      <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
        {/* Top Navigation Bar */}
        <div style={{ 
          position: 'absolute', 
          top: '10px', 
          left: '10px', 
          zIndex: 1000,
          display: 'flex',
          gap: '10px',
          background: 'rgba(255,255,255,0.95)',
          padding: '10px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          {/* Section Info */}
          <div style={{
            padding: '8px 12px',
            background: '#e8f4fd',
            border: '1px solid #00529F',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#00529F'
          }}>
            {userSection.replace('-', ' ').toUpperCase()}
            <br />
            <small style={{ fontWeight: 'normal' }}>
              {selectedStations ? `${selectedStations.from} → ${selectedStations.to}` : 'No route selected'}
            </small>
          </div>

          {/* View Buttons */}
          <button 
            onClick={() => setCurrentView('map')}
            className={`btn ${currentView === 'map' ? 'btn-primary' : 'btn-outline-primary'} btn-sm`}
          >
            Railway Map
          </button>
          <button 
            onClick={() => setCurrentView('controller')}
            className={`btn ${currentView === 'controller' ? 'btn-primary' : 'btn-outline-primary'} btn-sm`}
          >
            Controller Dashboard
          </button>
          <button 
            onClick={() => setCurrentView('loco')}
            className={`btn ${currentView === 'loco' ? 'btn-primary' : 'btn-outline-primary'} btn-sm`}
          >
            Loco Pilot
          </button>

          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="btn btn-outline-danger btn-sm"
          >
            <i className="bi bi-box-arrow-right"></i> Logout
          </button>
        </div>
        
        {renderCurrentView()}
      </div>
    </MainLayout>
  );
}

export default App
