// CourceSourceChart.js
import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';

const CourceSourceChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState('count');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('analytics/course-sources/');
        setData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching course flow data:', err);
        setError('Failed to load course flow data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const sortedData = React.useMemo(() => {
    if (!Array.isArray(data)) return [];
    return [...data].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'source') comparison = a.source.localeCompare(b.source);
      else if (sortField === 'target') comparison = a.target.localeCompare(b.target);
      else comparison = a.count - b.count;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

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
    return <div className="alert alert-info">No course flow data available.</div>;
  }

  const totalFlows = sortedData.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="card chart-card">
      <div className="card-header">
        <h5>Course Flow Analysis</h5>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th onClick={() => handleSort('source')} className="sortable-header">
                  Source Course {renderSortIndicator('source')}
                </th>
                <th onClick={() => handleSort('target')} className="sortable-header">
                  Target Course {renderSortIndicator('target')}
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
          <p>This table shows transitions between courses. Bars indicate the relative frequency of each path.</p>
        </div>
      </div>
    </div>
  );
};

export default CourceSourceChart;
