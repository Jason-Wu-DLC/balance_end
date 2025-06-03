import React, { useState, useEffect } from "react";
import StatsCard from "../components/StatsCard";
import UserActivityChart from "../components/UserActivityChart";
import VisitDurationChart from "../components/VisitDurationChart";
import VisitTrendsChart from "../components/VisitTrendsChart"; 
import PopularContentChart from "../components/PopularContentChart"; 
import DashboardLayout from "../components/DashboardLayout";
import { Tabs, Tab } from 'react-bootstrap'; 

import { fetchActiveUsers, fetchTotalNotes, fetchFeedbackCount } from "../api/requests";

const DashboardPage = () => {
  const [activeUsers, setActiveUsers] = useState(0);
  const [totalNotes, setTotalNotes] = useState(0);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    setIsLoading(true);

    Promise.all([
      fetchActiveUsers(),
      fetchTotalNotes(),  
      fetchFeedbackCount()
    ])
    .then(([activeUsersCount, totalNotes, feedbackCount]) => { 
      setActiveUsers(activeUsersCount);
      setTotalNotes(totalNotes);
      setFeedbackCount(feedbackCount);
      setIsLoading(false);
    })
    .catch(error => {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load data");
      setIsLoading(false);
    });
}, []);
  
  return (
    <DashboardLayout title="Dashboard" subtitle="Overview of system performance and activity">
      <div className="dashboard-page">
        {isLoading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading dashboard data...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <>
            <div className="row stats-row">
              <div className="col-12 col-md-4 mb-3">
                <div className="stats-card">
                  <div className="stats-icon">
                    <i className="bi bi-heart-fill"></i>
                  </div>
                  <h4 className="stats-title">Total Users</h4>
                  <div className="stats-value">{activeUsers}</div>
                </div>
              </div>
              
              <div className="col-12 col-md-4 mb-3">
                <div className="stats-card">
                  <div className="stats-icon">
                    <i className="bi bi-book"></i>
                  </div>
                  <h4 className="stats-title">Total Notes</h4>
                  <div className="stats-value">{totalNotes}</div>
                </div>
              </div>
              
              <div className="col-12 col-md-4 mb-3">
                <div className="stats-card">
                  <div className="stats-icon">
                    <i className="bi bi-chat-left-text"></i>
                  </div>
                  <h4 className="stats-title">Feedback Message From WordPress admin</h4>
                  <div className="stats-value">{feedbackCount}</div>
                </div>
              </div>
            </div>
            
            {/* 使用标签页控件组织图表，减少页面拥挤感 */}
            <Tabs
              id="dashboard-tabs"
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="mb-4 dashboard-tabs"
            >
              <Tab eventKey="overview" title="Overview">
                <div className="row">
                  <div className="col-12 col-lg-6 mb-4">
                    <UserActivityChart />
                  </div>
                  <div className="col-12 col-lg-6 mb-4">
                    <VisitDurationChart />
                  </div>
                </div>
              </Tab>
              
              <Tab eventKey="visits" title="Visit Analytics">
                <div className="row">
                  <div className="col-12 mb-4">
                    <VisitTrendsChart /> {/* 新添加的访问趋势图 */}
                  </div>
                </div>
              </Tab>
              
              <Tab eventKey="content" title="Content Analytics">
                <div className="row">
                  <div className="col-12 mb-4">
                    <PopularContentChart />
                  </div>
                </div>
              </Tab>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;