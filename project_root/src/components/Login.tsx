import React, { useState } from 'react';
import { MainLayout } from './MainLayout';
import { getSectionByCredentials, getAllSections } from '../config/railwaySections';

interface LoginProps {
    onLoginSuccess: (userSection: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Find matching credentials using centralized config
        const matchedSection = getSectionByCredentials(username, password);

        if (matchedSection) {
            onLoginSuccess(matchedSection.id);
        } else {
            setError('Invalid username or password');
        }
    };

    // Get all sections for demo credentials display
    const allSections = getAllSections();

    return (
        <MainLayout>
            <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                <div className="card col-md-5 shadow-lg border-0">
                    <div className="card-header bg-primary text-white py-3">
                        <h4 className="card-title mb-0">Section Controller Login</h4>
                    </div>
                    <div className="card-body p-4">
                        <div className="text-center mb-4">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/800px-Emblem_of_India.svg.png" 
                                 alt="Government of India Emblem" 
                                 style={{ height: '80px' }} 
                                 className="mb-3" />
                            <p className="text-muted">Please enter your credentials to access the Section Control Interface</p>
                        </div>
                        
                        {/* Demo credentials info */}
                        <div className="alert alert-info">
                            <h6>Demo Credentials:</h6>
                            <small>
                                {allSections.map(section => (
                                    <div key={section.id}>
                                        <strong>{section.name}:</strong> {section.credentials.username} / {section.credentials.password}
                                    </div>
                                ))}
                            </small>
                        </div>

                        <form onSubmit={handleLogin}>
                            <div className="mb-3">
                                <label htmlFor="username" className="form-label fw-bold">Username</label>
                                <div className="input-group">
                                    <span className="input-group-text"><i className="bi bi-person-fill"></i></span>
                                    <input type="text" 
                                           className="form-control" 
                                           id="username" 
                                           value={username} 
                                           onChange={(e) => setUsername(e.target.value)} 
                                           required 
                                           placeholder="Enter your username" />
                                </div>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="password" className="form-label fw-bold">Password</label>
                                <div className="input-group">
                                    <span className="input-group-text"><i className="bi bi-lock-fill"></i></span>
                                    <input type="password" 
                                           className="form-control" 
                                           id="password" 
                                           value={password} 
                                           onChange={(e) => setPassword(e.target.value)} 
                                           required 
                                           placeholder="Enter your password" />
                                </div>
                            </div>
                            {error && <div className="alert alert-danger">{error}</div>}
                            <button type="submit" className="btn btn-primary w-100 py-2">Login to Dashboard</button>
                        </form>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};