import { useState } from 'react'
import ControllerDashboard from '../frontend/controller_dashboard/ControllerDashboard'
import LocoPilotInterface from '../frontend/loco_pilot/LocoPilotInterface'
import RailwayMap from './RailwayMap'

function App() {
  const [currentView, setCurrentView] = useState<'original' | 'controller' | 'loco'>('original')

  const renderCurrentView = () => {
    switch (currentView) {
      case 'controller':
        return <ControllerDashboard />
      case 'loco':
        return <LocoPilotInterface />
      default:
        return <RailwayMap />
    }
  }

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {/* Navigation Bar */}
      <div style={{ 
        position: 'absolute', 
        top: '10px', 
        left: '10px', 
        zIndex: 1000,
        display: 'flex',
        gap: '10px',
        background: 'rgba(255,255,255,0.9)',
        padding: '10px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <button 
          onClick={() => setCurrentView('original')}
          style={{
            padding: '8px 12px',
            border: currentView === 'original' ? '2px solid #1f3a93' : '1px solid #ccc',
            background: currentView === 'original' ? '#1f3a93' : 'white',
            color: currentView === 'original' ? 'white' : '#333',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Original Map
        </button>
        <button 
          onClick={() => setCurrentView('controller')}
          style={{
            padding: '8px 12px',
            border: currentView === 'controller' ? '2px solid #1f3a93' : '1px solid #ccc',
            background: currentView === 'controller' ? '#1f3a93' : 'white',
            color: currentView === 'controller' ? 'white' : '#333',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Controller Dashboard
        </button>
        <button 
          onClick={() => setCurrentView('loco')}
          style={{
            padding: '8px 12px',
            border: currentView === 'loco' ? '2px solid #1f3a93' : '1px solid #ccc',
            background: currentView === 'loco' ? '#1f3a93' : 'white',
            color: currentView === 'loco' ? 'white' : '#333',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Loco Pilot
        </button>
      </div>
      
      {renderCurrentView()}
    </div>
  )
}

export default App
