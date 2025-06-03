// CommentTimeHeatmap.js
import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const CommentTimeHeatmap = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [maxCount, setMaxCount] = useState(0);
  const [hoveredCell, setHoveredCell] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('analytics/comment-time-distribution/');
        setData(response.data);
        
        // Find maximum count for color scaling
        const max = Math.max(...response.data.map(item => item.count), 1);
        setMaxCount(max);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching comment time distribution:', err);
        setError('Failed to load comment time distribution data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Get color intensity based on count
  const getColor = (count) => {
    if (count === 0) return 'var(--heatmap-empty-color)';
    // Use a more attractive blue gradient
    const intensity = Math.min(count / maxCount, 1);
    // Use a color scale from light blue to dark blue
    return `rgba(0, 123, 255, ${0.2 + intensity * 0.8})`;
  };

  // Get count value for a specific day and hour
  const getCount = (day, hour) => {
    const cell = data.find(item => item.day === day && item.hour === hour);
    return cell ? cell.count : 0;
  };

  // Handle cell hover
  const handleCellHover = (day, hour, count) => {
    setHoveredCell({ day, hour, count });
  };

  const handleCellLeave = () => {
    setHoveredCell(null);
  };

  if (loading) {
    return (
      <div className="card chart-card">
        <div className="card-header">
          <h5>Comment Time Distribution</h5>
        </div>
        <div className="card-body">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading heatmap data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card chart-card">
        <div className="card-header">
          <h5>Comment Time Distribution</h5>
        </div>
        <div className="card-body">
          <div className="alert alert-danger">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card chart-card">
      <div className="card-header">
        <h5>Comment Time Distribution</h5>
      </div>
      <div className="card-body">
        {hoveredCell && (
          <div className="heatmap-tooltip">
            <strong>{DAYS[hoveredCell.day]} {hoveredCell.hour}:00</strong>
            <div>Count: {hoveredCell.count}</div>
          </div>
        )}
        
        <div className="heatmap-container">
          <div className="heatmap-wrapper">
            <div className="heatmap-corner"></div>
            <div className="heatmap-hour-labels">
              {HOURS.map(hour => (
                <div key={`hour-${hour}`} className="heatmap-hour-label">
                  {hour}
                </div>
              ))}
            </div>
            
            <div className="heatmap-grid">
              {DAYS.map((day, dayIndex) => (
                <div key={`day-${dayIndex}`} className="heatmap-row">
                  <div className="heatmap-day-label">{day}</div>
                  <div className="heatmap-cells">
                    {HOURS.map(hour => {
                      const count = getCount(dayIndex, hour);
                      return (
                        <div 
                          key={`cell-${dayIndex}-${hour}`} 
                          className={`heatmap-cell ${count > 0 ? 'has-value' : ''}`}
                          style={{ backgroundColor: getColor(count) }}
                          onMouseEnter={() => handleCellHover(dayIndex, hour, count)}
                          onMouseLeave={handleCellLeave}
                        >
                          {count > 0 && count}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="heatmap-legend">
            <span>Less</span>
            <div className="heatmap-legend-gradient"></div>
            <span>More</span>
          </div>
          
          <div className="chart-info mt-3">
            <p>This heatmap shows when users are most active in creating comments, by day of week and hour of day.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentTimeHeatmap;