// CommentSourceChart.js - Table-based implementation
import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';

const CommentSourceChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState('count');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('analytics/comment-sources/');
        setData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching comment source data:', err);
        setError('Failed to load comment source data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Sort data based on current sort field and direction
  const sortedData = React.useMemo(() => {
    if (!Array.isArray(data)) return [];
    
    return [...data].sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'source') {
        comparison = a.source.localeCompare(b.source);
      } else if (sortField === 'target') {
        comparison = a.target.localeCompare(b.target);
      } else {
        // Default to count
        comparison = a.count - b.count;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortField, sortDirection]);

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Render sort indicator
  const renderSortIndicator = (field) => {
    if (sortField !== field) return null;
    return <span className={`ms-1 ${sortDirection === 'asc' ? 'bi bi-caret-up-fill' : 'bi bi-caret-down-fill'}`}></span>;
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="alert alert-info">
        No comment source data available. This may be due to limited user activity.
      </div>
    );
  }

  // Calculate total flows for percentage
  const totalFlows = sortedData.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="card chart-card">
      <div className="card-header">
        <h5>Comment Source Analysis</h5>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th onClick={() => handleSort('source')} className="sortable-header">
                  Source Page {renderSortIndicator('source')}
                </th>
                <th onClick={() => handleSort('target')} className="sortable-header">
                  Target Page {renderSortIndicator('target')}
                </th>
                <th onClick={() => handleSort('count')} className="sortable-header">
                  Flow Count {renderSortIndicator('count')}
                </th>
                <th>Percentage</th>
                <th>Flow Visualization</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item, index) => {
                const percentage = Math.round((item.count / totalFlows) * 100);
                return (
                  <tr key={index}>
                    <td>{item.source}</td>
                    <td>{item.target}</td>
                    <td>{item.count}</td>
                    <td>{percentage}%</td>
                    <td>
                      <div className="progress">
                        <div 
                          className="progress-bar" 
                          role="progressbar" 
                          style={{ width: `${percentage}%` }}
                          aria-valuenow={percentage} 
                          aria-valuemin="0" 
                          aria-valuemax="100"
                        ></div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="chart-info mt-3">
          <p>This table shows which pages lead users to comment pages. Longer bars indicate more common paths.</p>
        </div>
      </div>
    </div>
  );
};

export default CommentSourceChart;