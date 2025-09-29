import React, { useState } from 'react';
import { MainLayout } from './MainLayout';
import { getSectionById, getSectionStations } from '../config/railwaySections';

interface StationSelectProps {
    onStationsSelected: (stations: { from: string; to: string }) => void;
    userSection: string;
}

export const StationSelect: React.FC<StationSelectProps> = ({ onStationsSelected, userSection }) => {
    const [station1, setStation1] = useState('');
    const [station2, setStation2] = useState('');

    const sectionData = getSectionById(userSection);
    const availableStations = getSectionStations(userSection);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (station1 && station2) {
            onStationsSelected({ from: station1, to: station2 });
        }
    };

    return (
        <MainLayout>
            <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                <div className="card col-md-6 shadow-lg border-0">
                    <div className="card-header bg-primary text-white py-3">
                        <h4 className="card-title mb-0">Select Track Section</h4>
                    </div>
                    <div className="card-body p-4">
                        <div className="alert alert-info mb-4">
                            <i className="bi bi-info-circle-fill me-2"></i>
                            Welcome, Station Master. Please specify your section by selecting the start and end stations.
                            <br/>
                            <small className="text-muted">Current Section: <strong>{sectionData?.displayName || userSection.replace('-', ' ').toUpperCase()}</strong></small>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label htmlFor="station1" className="form-label fw-bold">
                                    <i className="bi bi-geo-alt-fill me-2"></i>
                                    Start Station
                                </label>
                                <select className="form-control form-control-lg" 
                                        id="station1" 
                                        value={station1} 
                                        onChange={(e) => setStation1(e.target.value)} 
                                        required>
                                    <option value="">Select Start Station</option>
                                    {availableStations.map(station => (
                                        <option key={station} value={station}>{station}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="station2" className="form-label fw-bold">
                                    <i className="bi bi-geo-alt-fill me-2"></i>
                                    End Station
                                </label>
                                <select className="form-control form-control-lg" 
                                        id="station2" 
                                        value={station2} 
                                        onChange={(e) => setStation2(e.target.value)} 
                                        required>
                                    <option value="">Select End Station</option>
                                    {availableStations.map(station => (
                                        <option key={station} value={station}>{station}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="d-grid">
                                <button type="submit" className="btn btn-primary btn-lg">
                                    <i className="bi bi-map-fill me-2"></i>
                                    Display Track Section
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};