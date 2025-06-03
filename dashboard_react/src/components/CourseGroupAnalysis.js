import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CourseGroupAnalysis = ({ groupsData, loading }) => {
  const [viewMode, setViewMode] = useState('chart');
  
  if (!groupsData || groupsData.length === 0) {
    return (
      <div className="card course-group-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <span>Course Group Analysis</span>
          <select 
            className="form-select" 
            defaultValue="chart" 
            onChange={(e) => setViewMode(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="chart">Chart View</option>
            <option value="table">Table View</option>
          </select>
        </div>
        <div className="card-body">
          <div className="empty-data">No course group data available</div>
        </div>
      </div>
    );
  }
  
  // Prepare data for the bar chart
  const chartData = groupsData.map(group => ({
    name: group.name,
    courses: group.total_courses,
    users: group.total_users,
    completedUsers: group.completed_users
  }));
  
  return (
    <div className="card course-group-card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <span>Course Group Analysis</span>
        <select 
          className="form-select" 
          value={viewMode} 
          onChange={(e) => setViewMode(e.target.value)}
          style={{ width: 'auto' }}
        >
          <option value="chart">Chart View</option>
          <option value="table">Table View</option>
        </select>
      </div>
      <div className="card-body">
        {viewMode === 'chart' ? (
          <div className="chart-container" style={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                barSize={20}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="courses" name="Total Courses" fill="var(--chart-color-1)" />
                <Bar dataKey="users" name="Total Users" fill="var(--chart-color-3)" />
                <Bar dataKey="completedUsers" name="Completed Users" fill="var(--chart-color-2)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Group Name</th>
                  <th>Courses</th>
                  <th>Completion Rate</th>
                  <th>User Enrollments</th>
                </tr>
              </thead>
              <tbody>
                {!loading ? (
                  groupsData.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td>{item.total_courses}</td>
                      <td>
                        <div className="progress">
                          <div 
                            className={`progress-bar ${item.completion_rate >= 75 ? 'bg-success' : ''}`}
                            style={{ width: `${Math.round(item.completion_rate)}%` }}
                          />
                        </div>
                        <span className="ms-2">{Math.round(item.completion_rate)}%</span>
                      </td>
                      <td>
                        <span className="badge bg-success me-2">{item.completed_users} Completed</span>
                        <span className="badge bg-secondary">{item.total_users - item.completed_users} Other</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center">
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseGroupAnalysis;