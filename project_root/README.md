# SIH Railway Track Management System

## Project Overview
This project is a comprehensive Railway Track Management System designed for the Smart India Hackathon (SIH). It provides real-time train tracking, route optimization, and collision avoidance through an intelligent MILP-based optimization system.

## Problem Statement Alignment
- **Real-time Train Tracking**: Live monitoring of train positions using GPS coordinates
- **Dynamic Route Optimization**: MILP algorithm for optimal track assignments and rerouting
- **Collision Avoidance**: Proactive detection and prevention of potential conflicts
- **Mobile Interface**: Loco pilot-friendly mobile interface for on-the-go updates
- **Controller Dashboard**: Comprehensive web interface for section controllers

## Architecture

### Frontend Components
- **Controller Dashboard**: Full-featured web interface with interactive maps, KPI tracking, and route planning
- **Loco Pilot Interface**: Mobile-optimized interface with alerts, mini-map, and emergency controls
- **Original Map View**: Base railway mapping functionality

### Backend Services
- **Flask API**: Mock TMS/COA integration and simulation control
- **MILP Optimizer**: Track assignment and rerouting optimization
- **Simulator**: 24-minute simulation loop with real-time position updates
- **Utilities**: Data processing, GeoJSON parsing, and KPI calculations

### Data Layer
- **trains.json**: Mock TMS data with train schedules, priorities, and real-time status
- **GeoJSON Files**: Railway network geometry for multiple states and sections
- **Track Sections**: Defined track segments with capacity and operational status

## Key Features

### 1. Real-time Train Monitoring
- Live GPS tracking of active trains
- Status updates (on-time, delayed, rerouted)
- Speed monitoring and alerts

### 2. Intelligent Route Optimization
- MILP-based track assignment
- Dynamic rerouting based on conflicts
- Priority-based scheduling

### 3. Collision Avoidance System
- Proactive conflict detection
- Automatic rerouting recommendations
- Emergency alert system

### 4. Mobile-First Design
- Responsive loco pilot interface
- Touch-friendly controls
- Offline capability for critical functions

### 5. Comprehensive Dashboard
- Interactive railway map with real-time overlays
- KPI tracking (delays, reroutes, efficiency)
- Timeline view of train movements
- Route planning tools

## Setup Instructions

### Prerequisites
- Node.js 18+ for frontend
- Python 3.8+ for backend
- Modern web browser with WebGL support

### Installation
1. Clone the repository
2. Install Python dependencies: `pip install -r requirements.txt`
3. Install Node.js dependencies: `npm install`
4. Start backend services: `python backend/app.py`
5. Start frontend development server: `npm run dev`

### Running the Application
1. Open browser to `http://localhost:5173`
2. Use navigation buttons to switch between interfaces:
   - Original Map: Base railway visualization
   - Controller Dashboard: Full administrative interface
   - Loco Pilot: Mobile-optimized driver interface

## Technology Stack

### Frontend
- **React 19**: Modern UI framework with hooks
- **TypeScript**: Type-safe development
- **MapLibre GL JS**: High-performance mapping
- **Vite**: Fast build tool and development server

### Backend
- **Flask**: Lightweight Python web framework
- **PuLP**: Linear programming for MILP optimization
- **Pandas**: Data processing and analysis
- **NumPy**: Numerical computations

### Data
- **GeoJSON**: Standardized geographic data format
- **JSON**: Structured data storage
- **OpenStreetMap**: Base mapping tiles

## Innovation Highlights

1. **Real-time MILP Optimization**: Dynamic track assignment using linear programming
2. **Mobile-First Approach**: Dedicated loco pilot interface optimized for mobile devices
3. **Proactive Collision Avoidance**: Predictive algorithms for conflict prevention
4. **Scalable Architecture**: Modular design supporting multiple railway sections
5. **Interactive Visualization**: Real-time map updates with custom railway overlays

## Demo Scenarios

### Scenario 1: Normal Operations
- 5 trains operating on scheduled routes
- Real-time position tracking
- On-time performance monitoring

### Scenario 2: Conflict Resolution
- Track maintenance causing bottleneck
- Automatic rerouting of affected trains
- Priority-based scheduling

### Scenario 3: Emergency Response
- Signal failure detection
- Emergency braking alerts to loco pilots
- Alternative route calculation

## Future Enhancements

1. **AI/ML Integration**: Predictive analytics for better scheduling
2. **IoT Sensor Integration**: Real-time track condition monitoring
3. **Weather Impact Analysis**: Route optimization considering weather conditions
4. **Passenger Information System**: Real-time updates to passengers
5. **Advanced Analytics**: Historical data analysis for system optimization

## Team Information
**Team Name**: [Your Team Name]
**Problem Statement**: Railway Track Management System
**Technology**: React, Python, MILP Optimization
**Target Users**: Railway Controllers, Loco Pilots, System Administrators

---
*This project demonstrates the practical application of modern web technologies and optimization algorithms to solve real-world railway management challenges.*
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
