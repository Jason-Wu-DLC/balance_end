// SettingsPage.js 修改

import React, { useState, useEffect } from 'react';
import Sidebar from "../components/Sidebar";
import UserProfileSettings from "../components/settings/UserProfileSettings";
import InterfacePreferences from "../components/settings/InterfacePreferences";
import SystemSettings from "../components/settings/SystemSettings";
import apiClient from '../api/axios';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch current user's information when component mounts
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/user-info/');
        setCurrentUser(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch user info:', err);
        setError('Failed to load user information');
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  // Determine if the user is an admin
  const isAdmin = currentUser && (currentUser.role === 'Admin' || currentUser.is_superuser);

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content settings-page">
        <div className="container-fluid">
          <div className="row mb-4">
            <div className="col">
              <h1 className="page-title">Settings</h1>
              <p className="text-muted">Configure your account and dashboard preferences</p>
              {error && <div className="alert alert-danger">{error}</div>}
            </div>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading settings...</p>
            </div>
          ) : (
            <div className="card">
              <div className="card-body">
                <div className="settings-tabs">
                  <a 
                    href="#profile" 
                    className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab('profile');
                    }}
                  >
                    User Profile
                  </a>
                  <a 
                    href="#interface" 
                    className={`nav-link ${activeTab === 'interface' ? 'active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab('interface');
                    }}
                  >
                    Interface Preferences
                  </a>
                  {isAdmin && (
                    <a 
                      href="#system" 
                      className={`nav-link ${activeTab === 'system' ? 'active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTab('system');
                      }}
                    >
                      System Settings
                    </a>
                  )}
                </div>

                <div className="tab-content mt-4">
                  {activeTab === 'profile' && (
                    <div id="profile" className="tab-pane active">
                      <UserProfileSettings />
                    </div>
                  )}
                  {activeTab === 'interface' && (
                    <div id="interface" className="tab-pane active">
                      <InterfacePreferences />
                    </div>
                  )}
                  {isAdmin && activeTab === 'system' && (
                    <div id="system" className="tab-pane active">
                      <SystemSettings />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;