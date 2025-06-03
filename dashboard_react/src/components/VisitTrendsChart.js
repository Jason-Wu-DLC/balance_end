import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import apiClient from '../api/axios';

const VisitTrendsChart = () => {
  const [visitData, setVisitData] = useState([]);
  const [timeInterval, setTimeInterval] = useState('day');
  const [dateRange, setDateRange] = useState([
    new Date(new Date().setDate(new Date().getDate() - 30)), // 最近30天
    new Date()
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVisitTrends();
  }, [timeInterval, dateRange]);

  const fetchVisitTrends = async () => {
    setLoading(true);
    try {
      const startDate = dateRange[0].toISOString().split('T')[0];
      const endDate = dateRange[1].toISOString().split('T')[0];
      
      const response = await apiClient.get('/analytics/visit-trends', {
        params: { 
          interval: timeInterval,
          start_date: startDate,
          end_date: endDate
        }
      });
      
      setVisitData(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch visit trends:', err);
      setError('Failed to load visit trend data');
    } finally {
      setLoading(false);
    }
  };

  // 格式化X轴日期显示
  const formatXAxis = (date) => {
    if (!date) return '';
    
    const dateObj = new Date(date);
    if (timeInterval === 'day') {
      return dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } else if (timeInterval === 'week') {
      return `W${getWeekNumber(dateObj)}`;
    } else if (timeInterval === 'month') {
      return dateObj.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    }
    return date;
  };

  // 获取周数
  const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3 className="chart-title">Visit Trends</h3>
        <div className="chart-controls">
          <div className="btn-group">
            <button 
              className={`btn ${timeInterval === 'day' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setTimeInterval('day')}
            >
              Daily
            </button>
            <button 
              className={`btn ${timeInterval === 'week' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setTimeInterval('week')}
            >
              Weekly
            </button>
            <button 
              className={`btn ${timeInterval === 'month' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setTimeInterval('month')}
            >
              Monthly
            </button>
          </div>
          
          <div className="date-range-picker">
            <input 
              type="date" 
              value={dateRange[0].toISOString().split('T')[0]} 
              onChange={(e) => setDateRange([new Date(e.target.value), dateRange[1]])}
            />
            <span>to</span>
            <input 
              type="date" 
              value={dateRange[1].toISOString().split('T')[0]} 
              onChange={(e) => setDateRange([dateRange[0], new Date(e.target.value)])}
            />
          </div>
        </div>
      </div>
      
      <div className="chart-body">
        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={visitData}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatXAxis}
                label={{ value: 'Date', position: 'insideBottomRight', offset: -10 }}
              />
              <YAxis 
                label={{ value: 'Visits', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value) => [value, 'Visits']}
                labelFormatter={(label) => `Date: ${formatXAxis(label)}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="visits" 
                stroke="#8884d8" 
                activeDot={{ r: 8 }}
                name="Total Visits"
              />
              <Line 
                type="monotone" 
                dataKey="uniqueVisitors" 
                stroke="#82ca9d" 
                name="Unique Visitors"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default VisitTrendsChart;