import React, { useState, useEffect } from "react";
import {
  FileTextOutlined,
  BookOutlined,
  UserOutlined,
  ColumnHeightOutlined
} from "@ant-design/icons";
import Sidebar from "../components/Sidebar";
import CommentBoard from "../components/CommentBoard";
import CommentTimeHeatmap from "../components/CommentTimeHeatmap";
import CommentSourceChart from "../components/CommentSourceChart";
import apiClient from "../api/axios";

const UsercommentPage = () => {
  // User notes statistics (fetched from API)
  const [notesStats, setNotesStats] = useState({
    totalNotes: 0,
    moduleCount: 0,
    activeUsers: 0,
    avgNotesPerUser: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('board'); // Add active tab state

  // Load statistics
  useEffect(() => {
    const loadStatistics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get notes statistics
        const response = await apiClient.get("notes/statistics/");
        const data = response.data;
        
        // Convert API's snake_case to frontend's camelCase
        setNotesStats({
          totalNotes: data.total_notes || 0,
          moduleCount: data.module_count || 0,
          activeUsers: data.active_users || 0,
          avgNotesPerUser: data.avg_notes_per_user || 0
        });
      } catch (err) {
        console.error("Failed to load notes statistics:", err);
        setError("Failed to load statistics. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    loadStatistics();
  }, []);

  return (
    <div className="app-container">
      {/* Sidebar */}
      <Sidebar />
      
      <main className="main-content">
        {/* Custom page title */}
        <div className="page-header">
          <h2 className="page-title">User Notes Analytics</h2>
          <p className="text-secondary">Analyze and visualize user notes data</p>
        </div>
        
        {/* Breadcrumb navigation */}
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="/dashboard">Dashboard</a></li>
            <li className="breadcrumb-item active" aria-current="page">User Notes</li>
          </ol>
        </nav>
        
        {/* Statistics cards */}
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading statistics...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger mb-4">
            <h5>Error Loading Data</h5>
            <p>{error}</p>
          </div>
        ) : (
          <div className="row stats-row">
            <div className="col col-sm-6 col-md-3 mb-3">
              <div className="card stats-card">
                <div className="card-body">
                  <h5 className="stats-title">Total Notes</h5>
                  <div className="stats-value" style={{ color: '#3f8600' }}>
                    <FileTextOutlined className="stats-icon" />
                    <span>{notesStats.totalNotes}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="col col-sm-6 col-md-3 mb-3">
              <div className="card stats-card">
                <div className="card-body">
                  <h5 className="stats-title">Modules</h5>
                  <div className="stats-value" style={{ color: '#0050b3' }}>
                    <BookOutlined className="stats-icon" />
                    <span>{notesStats.moduleCount}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="col col-sm-6 col-md-3 mb-3">
              <div className="card stats-card">
                <div className="card-body">
                  <h5 className="stats-title">Active Users</h5>
                  <div className="stats-value" style={{ color: '#722ed1' }}>
                    <UserOutlined className="stats-icon" />
                    <span>{notesStats.activeUsers}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="col col-sm-6 col-md-3 mb-3">
              <div className="card stats-card">
                <div className="card-body">
                  <h5 className="stats-title">Avg Notes/User</h5>
                  <div className="stats-value" style={{ color: '#cf1322' }}>
                    <ColumnHeightOutlined className="stats-icon" />
                    <span>{notesStats.avgNotesPerUser.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <hr className="divider" />
        
        {/* Add tab navigation */}
        <div className="nav nav-tabs mb-4">
          <button 
            className={`nav-link ${activeTab === 'board' ? 'active' : ''}`}
            onClick={() => setActiveTab('board')}
          >
            Notes Analysis
          </button>
          <button 
            className={`nav-link ${activeTab === 'sources' ? 'active' : ''}`}
            onClick={() => setActiveTab('sources')}
          >
            Comment Sources
          </button>
          <button 
            className={`nav-link ${activeTab === 'time' ? 'active' : ''}`}
            onClick={() => setActiveTab('time')}
          >
            Time Distribution
          </button>
        </div>
        
        {/* Conditionally render components based on active tab */}
        <div className="comment-board-container">
          {activeTab === 'board' && <CommentBoard />}
          {activeTab === 'sources' && <CommentSourceChart/>}
          {activeTab === 'time' && <CommentTimeHeatmap/>}
        </div>
      </main>
    </div>
  );
};

export default UsercommentPage;