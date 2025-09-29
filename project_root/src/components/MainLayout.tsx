import React from 'react';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <>
            <header className="header header-fixed bg-white border-bottom shadow-sm">
                <div className="header-main py-2">
                    <div className="container">
                        <div className="row align-items-center">
                            <div className="col-auto">
                                <img src="https://upload.wikimedia.org/wikipedia/en/thumb/8/83/Indian_Railways.svg/640px-Indian_Railways.svg.png" 
                                     alt="Indian Railways Logo" 
                                     style={{ height: '60px' }} 
                                     className="me-3" />
                            </div>
                            <div className="col">
                                <div className="brand">
                                    <div className="brand-title" style={{ color: '#00529F', fontSize: '24px', fontWeight: 'bold' }}>भारतीय रेल / Indian Railways</div>
                                    <div className="brand-text text-muted">Ministry of Railways, Government of India</div>
                                </div>
                            </div>
                            <div className="col-auto">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/800px-Emblem_of_India.svg.png" 
                                     alt="Government of India Emblem" 
                                     style={{ height: '60px' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="main" id="main">
                {children}
            </main>

            <footer className="footer">
                <div className="footer-main">
                    <div className="container">
                        <p className="mb-0">Designed & Developed by the Ministry of Railways, Government of India</p>
                    </div>
                </div>
            </footer>
        </>
    );
};