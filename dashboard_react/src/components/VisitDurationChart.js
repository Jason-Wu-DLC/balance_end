// VisitDurationChart.js
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiClient from '../api/axios';

const COLORS = [
  'var(--chart-color-1)',
  'var(--chart-color-2)',
  'var(--chart-color-3)',
  'var(--chart-color-4)',
  'var(--chart-color-5)',
  'var(--primary-color)',
  'var(--secondary-color)'
];

const VisitDurationChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('analytics/visit-duration/');
        setData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching visit duration data:', err);
        setError('Failed to load visit duration data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  // Calculate total for percentages
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="card chart-card">
      <div className="card-header">
        <h5>Visit Duration Distribution</h5>
      </div>
      <div className="card-body">
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="duration_range"
              cx="50%"
              cy="50%"
              outerRadius={150}
              fill="#8884d8"
              label={({ duration_range, count }) => {
                const percent = Math.round((count / total) * 100);
                return percent > 0 ? `${duration_range} (${percent}%)` : '';
              }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name, props) => {
                const percent = Math.round((value / total) * 100);
                return [`${value} (${percent}%)`, 'Visits'];
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default VisitDurationChart;