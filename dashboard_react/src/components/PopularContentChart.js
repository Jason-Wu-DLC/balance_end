import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import apiClient from '../api/axios';

const PopularContentChart = () => {
  const [contentData, setContentData] = useState([]);
  const [viewMode, setViewMode] = useState('chart'); // 'chart' or 'table'
  const [metric, setMetric] = useState('views'); // 'views' or 'timeSpent'
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const getFontSize = () => {
    if (contentData.length <= 20) return 14;
    if (contentData.length <= 50) return 12;
    return 10;
  };
  
  const COLORS = [
    '#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c',
    '#d0ed57', '#ffc658', '#ff8042', '#0088FE', '#00C49F'
  ];

  useEffect(() => {
    fetchPopularContent();
  }, [metric, limit]);

  const fetchPopularContent = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/analytics/popular-content', {
        params: { 
          metric: metric,
          limit: limit
        }
      });
      
      setContentData(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch popular content:', err);
      setError('Failed to load popular content data');
    } finally {
      setLoading(false);
    }
  };

  // 格式化时间（秒）为可读格式
  const formatTime = (seconds) => {
    if (!seconds) return '0s';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m `;
    if (remainingSeconds > 0 || result === '') result += `${remainingSeconds}s`;
    
    return result.trim();
  };

  // 截断长文本
  const truncateText = (text, maxLength = 30) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3 className="chart-title">Popular Content</h3>
        <div className="chart-controls">
          <div className="btn-group view-mode">
            <button 
              className={`btn ${viewMode === 'chart' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setViewMode('chart')}
            >
              Chart View
            </button>
            <button 
              className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setViewMode('table')}
            >
              Table View
            </button>
          </div>
          
          <div className="btn-group metric-selector">
            <button 
              className={`btn ${metric === 'views' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setMetric('views')}
            >
              Page Views
            </button>
            <button 
              className={`btn ${metric === 'timeSpent' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setMetric('timeSpent')}
            >
              Time Spent
            </button>
          </div>
          
          <select 
            className="form-select limit-selector"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            <option value={5}>Top 5</option>
            <option value={10}>Top 10</option>
            <option value={20}>Top 20</option>
            <option value={50}>Top 50</option>
          </select>
        </div>
      </div>
      
      <div className="chart-body">
        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : viewMode === 'chart' ? (
          <ResponsiveContainer width="100%" height={Math.max(400, contentData.length * 30)}>
            <BarChart
              data={contentData}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 300, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
              type="category"
              dataKey="pageName"
              width={280}
              tick={{ fontSize: getFontSize(), textAnchor: 'end' }}
              interval={0}
              />
              <Tooltip 
                formatter={(value) => {
                  return metric === 'timeSpent' 
                    ? [formatTime(value), 'Time Spent'] 
                    : [value, 'Views'];
                }}
                labelFormatter={(value) => value} // Show full page name in tooltip
              />
              <Legend />
              <Bar 
                dataKey="value" 
                name={metric === 'views' ? 'Page Views' : 'Time Spent'} 
                fill="#8884d8"
              >
                {contentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover table-striped">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Page</th>
                  <th>{metric === 'views' ? 'Views' : 'Time Spent'}</th>
                </tr>
              </thead>
              <tbody>
                {contentData.map((item, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td title={item.pageName}>{item.pageName}</td>
                    <td>{metric === 'views' ? item.value : formatTime(item.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PopularContentChart;