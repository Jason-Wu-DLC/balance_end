// Updated DashboardLayout.js
import React, { useEffect, useState } from 'react';
import Sidebar from "./Sidebar";
import { useNavigate } from 'react-router-dom';
import { getStoredTheme, applyTheme } from '../utils/themeUtils';

const DashboardLayout = ({ children, title, subtitle }) => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    // Apply theme from localStorage
    const currentTheme = getStoredTheme();
    applyTheme(currentTheme);
    
    // Check if user is logged in, redirect to login if not
    const isAuthenticated = localStorage.getItem('authToken') !== null;
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
    
    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Listen for resize events
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [navigate]);
  
  return (
    <div className="app-container">
      <Sidebar />
      <main className={`main-content ${isMobile ? 'mobile-view' : ''}`}>
        {title && (
          <div className="page-header mb-4">
            <h1 className="page-title">{title}</h1>
            {subtitle && <p className="text-secondary">{subtitle}</p>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;