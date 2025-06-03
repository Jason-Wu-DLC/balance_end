import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Row, Col, Card, Spinner } from 'react-bootstrap';
import { FaPalette, FaDesktop, FaChartBar } from 'react-icons/fa';
import apiClient from '../../api/axios';
import { applyTheme } from '../../utils/themeUtils';

const InterfacePreferences = () => {
  const [preferences, setPreferences] = useState({
    theme: 'light',
    layout: 'default',
    chart_style: 'default',
    sidebar_collapsed: false,
    notifications_enabled: true
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Fetch preferences on component mount
  useEffect(() => {
    const fetchPreferences = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/user/preferences/');
        setPreferences(response.data);
      } catch (err) {
        console.error('Error fetching preferences:', err);
        // Still use default preferences even if fetch fails
        setError('Failed to load preferences. Using defaults.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPreferences();
  }, []);
  
  // Handle preference changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPreferences(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear messages when user makes changes
    setError('');
    setSuccess('');
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Get CSRF token if it exists
      const csrftoken = document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];
      
      // Set up headers
      const headers = {};
      if (csrftoken) {
        headers['X-CSRFToken'] = csrftoken;
      }
      
      // Get authentication token
      const authToken = localStorage.getItem('authToken');
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      console.log("Sending request to update preferences:", preferences);
      console.log("With headers:", headers);
      
      // Send request to Django backend (not WordPress)
      const response = await apiClient.put('/user/preferences/', preferences, { headers });
      
      setSuccess(response.data.message || 'Preferences updated successfully!');

      applyTheme(preferences.theme);
      
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError(err.response?.data?.error || `Failed to update preferences: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Preview theme colors
  const themeColors = {
    light: { background: '#ffffff', text: '#333333', accent: '#007bff' },
    dark: { background: '#222222', text: '#f1f1f1', accent: '#0d6efd' },
    system: { background: 'linear-gradient(to right, #ffffff 50%, #222222 50%)', text: '#555555', accent: '#6c757d' }
  };
  
  return (
    <div className="settings-page">
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      <Form onSubmit={handleSubmit} className="preferences-form">
        <Row>
          <Col md={6} className="mb-4">
            <Card className="card">
              <div className="card-header d-flex align-items-center">
                <FaPalette className="me-2" /> Theme Settings
              </div>
              <div className="card-body">
                <div className="form-group mb-4">
                  <label className="form-label">Choose Theme</label>
                  <div className="settings-theme-selector mb-3">
                    {['light', 'dark', 'system'].map(theme => (
                      <div 
                        key={theme}
                        className={`settings-theme-option ${preferences.theme === theme ? 'active' : ''}`}
                        onClick={() => setPreferences(prev => ({ ...prev, theme }))}
                      >
                        <div 
                          className="settings-theme-preview" 
                          style={{ background: themeColors[theme].background }}
                        >
                          <div className="theme-text" style={{ color: themeColors[theme].text }}>Aa</div>
                          <div className="theme-accent" style={{ background: themeColors[theme].accent }}></div>
                        </div>
                        <div className="theme-name">{theme.charAt(0).toUpperCase() + theme.slice(1)}</div>
                      </div>
                    ))}
                  </div>
                  <select 
                    className="form-select d-none" // Hidden but keeps form state
                    name="theme" 
                    value={preferences.theme} 
                    onChange={handleChange}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>
              </div>
            </Card>
          </Col>
          
          <Col md={6} className="mb-4">
            <Card className="card">
              <div className="card-header d-flex align-items-center">
                <FaDesktop className="me-2" /> Layout Options
              </div>
              <div className="card-body">
                <div className="form-group mb-3">
                  <label className="form-label">Layout Density</label>
                  <select 
                    className="form-select"
                    name="layout" 
                    value={preferences.layout} 
                    onChange={handleChange}
                  >
                    <option value="default">Default</option>
                    <option value="compact">Compact</option>
                    <option value="spacious">Spacious</option>
                  </select>
                </div>
                
                <div className="form-group mb-3">
                  <div className="form-check">
                    <input 
                      className="form-check-input"
                      type="checkbox"
                      id="sidebar-collapsed"
                      name="sidebar_collapsed"
                      checked={preferences.sidebar_collapsed}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="sidebar-collapsed">
                      Collapse sidebar by default
                    </label>
                  </div>
                </div>
                
                <div className="form-group mb-3">
                  <div className="form-check">
                    <input 
                      className="form-check-input"
                      type="checkbox"
                      id="notifications-enabled"
                      name="notifications_enabled"
                      checked={preferences.notifications_enabled}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="notifications-enabled">
                      Enable in-app notifications
                    </label>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
        
        <Row>
          <Col md={12} className="mb-4">
            <Card className="card">
              <div className="card-header d-flex align-items-center">
                <FaChartBar className="me-2" /> Data Visualization Preferences
              </div>
              <div className="card-body">
                <div className="form-group mb-3">
                  <label className="form-label">Chart Style</label>
                  <select 
                    className="form-select"
                    name="chart_style" 
                    value={preferences.chart_style} 
                    onChange={handleChange}
                  >
                    <option value="default">Default</option>
                    <option value="minimal">Minimal</option>
                    <option value="colorful">Colorful</option>
                  </select>
                  <small className="form-text text-muted">
                    Choose how charts and graphs are styled throughout the dashboard.
                  </small>
                </div>
                
                <div className="settings-chart-style-preview mt-3 mb-4">
                  <div className={`settings-chart-preview ${preferences.chart_style}`}>
                    <div className="settings-chart-bar" style={{ height: '60%' }}></div>
                    <div className="settings-chart-bar" style={{ height: '80%' }}></div>
                    <div className="settings-chart-bar" style={{ height: '40%' }}></div>
                    <div className="settings-chart-bar" style={{ height: '100%' }}></div>
                    <div className="settings-chart-bar" style={{ height: '70%' }}></div>
                  </div>
                  <div className="settings-chart-preview-label">
                    Preview: {preferences.chart_style.charAt(0).toUpperCase() + preferences.chart_style.slice(1)} Style
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
        
        <button 
          type="submit" 
          className="btn btn-primary save-settings-btn"
          disabled={loading}
        >
          {loading ? (
            <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...</>
          ) : 'Save Preferences'}
        </button>
      </Form>
    </div>
  );
};

export default InterfacePreferences;