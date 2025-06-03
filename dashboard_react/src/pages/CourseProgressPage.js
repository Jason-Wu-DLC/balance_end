import React, { useState, useEffect } from 'react';
import { Tabs } from 'antd';
import Sidebar from '../components/Sidebar';
import CourseProgressOverview from '../components/CourseProgressOverview';
import CourceSourceChart from '../components/CourceSourceChart';
import CourseList from '../components/CourseList';
import { fetchCourseProgressAnalysis } from '../api/requests';

const { TabPane } = Tabs;

const CourseProgressPage = () => {
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchCourseProgressAnalysis();
        setProgressData(data);
      } catch (err) {
        console.error('Error fetching course progress:', err);
        setError('Failed to load course progress data');
      } finally {
        setLoading(false);
      }
    };
    fetchProgressData();
  }, []);

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content progress-page">
        <div className="page-header">
          <h2 className="page-title">Course Progress Analysis</h2>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/dashboard">Dashboard</a></li>
              <li className="breadcrumb-item active" aria-current="page">Course Progress</li>
            </ol>
          </nav>
        </div>

        {error && (
          <div className="alert alert-danger mb-3">
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading course data...</p>
          </div>
        ) : progressData ? (
          <>
            <Tabs defaultActiveKey="overview" type="card" className="mb-4">
              <TabPane tab="✅ Overview" key="overview">
                <CourseProgressOverview summaryData={progressData.summary} />
              </TabPane>
              <TabPane tab="📊 Course Flow" key="flow">
                <CourceSourceChart  flowData={progressData.flow} />
              </TabPane>
              <TabPane tab="📋 Course List" key="list">
                <CourseList coursesData={progressData.courses} loading={loading} />
              </TabPane>
            </Tabs>
          </>
        ) : (
          <div className="alert alert-info">
            <h5>No Data Available</h5>
            <p>No course data is currently available for analysis.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default CourseProgressPage;
