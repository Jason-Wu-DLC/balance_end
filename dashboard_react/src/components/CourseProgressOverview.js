import React from 'react';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  BookOutlined,
  TeamOutlined,
  CalendarOutlined,
  LineChartOutlined,
} from '@ant-design/icons';

const CourseProgressOverview = ({ summaryData }) => {
  if (!summaryData) {
    return (
      <div className="card">
        <div className="card-header">Course Progress Overview</div>
        <div className="card-body">
          <div className="empty-data">No summary data available</div>
        </div>
      </div>
    );
  }

  const formatNumber = (num) => Number(num).toLocaleString();

  return (
    <div className="card">
      <div className="card-header">Course Progress Overview</div>
      <div className="card-body">
        {/* Completion Rate with Progress Bar */}
        <div className="completion-rate text-center mb-4">
          <h5>Overall Course Completion Rate</h5>
          <div className="display-6">{summaryData.overall_completion_rate.toFixed(1)}%</div>
          <div className="progress mt-2" style={{ height: '8px' }}>
            <div
              className="progress-bar"
              role="progressbar"
              style={{
                width: `${summaryData.overall_completion_rate}%`,
                backgroundImage: 'linear-gradient(to right, #108ee9, #87d068)',
              }}
              aria-valuenow={summaryData.overall_completion_rate}
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="row text-center mt-4">
          <div className="col col-4">
            <div className="stat-card">
              <TeamOutlined style={{ fontSize: 24, color: '#13c2c2' }} />
              <div>Total Enrollments</div>
              <strong>{formatNumber(summaryData.total_user_enrollments)}</strong>
            </div>
          </div>
          <div className="col col-4">
            <div className="stat-card">
              <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
              <div>Completed</div>
              <strong>{formatNumber(summaryData.completed_enrollments)}</strong>
            </div>
          </div>
          <div className="col col-4 mt-3">
            <div className="stat-card">
              <ClockCircleOutlined style={{ fontSize: 24, color: '#faad14' }} />
              <div>In Progress</div>
              <strong>{formatNumber(summaryData.in_progress_enrollments)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseProgressOverview;
