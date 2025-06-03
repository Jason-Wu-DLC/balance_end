import React, { useState, useEffect } from 'react';
import moment from 'moment';
import apiClient from '../api/axios';

// Define colors for different activity levels
const activityColors = [
  'var(--bg-header)', // No activity
  '#c6e48b', // Low activity
  '#7bc96f', // Medium activity
  '#239a3b', // High activity
  '#196127'  // Very high activity
];

const SessionActivityHeatmap = ({ userId }) => {
  const [activityData, setActivityData] = useState([]);
  const [dateRange, setDateRange] = useState([
    moment().subtract(30, 'days'), 
    moment()
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Define the hours of the day (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  useEffect(() => {
    // Only fetch if we have both userId and dateRange
    if (!userId || !dateRange[0] || !dateRange[1]) return;
      
    const fetchSessionActivity = async () => {
      try {
        setLoading(true);
        
        const startDate = dateRange[0].format('YYYY-MM-DD');
        const endDate = dateRange[1].format('YYYY-MM-DD');
        
        const response = await apiClient.get('session-activity/', {
          params: {
            user_id: userId, // Add userId to request params
            start_date: startDate,
            end_date: endDate
          }
        });
        
        setActivityData(response.data);
      } catch (err) {
        console.error('Error fetching session activity data:', err);
        setError('Failed to load session activity data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSessionActivity();
  }, [userId, dateRange]); // Add userId as dependency
  
  // Get activity level (0-4) for a specific day and hour
  const getActivityLevel = (day, hour) => {
    const dayData = activityData.find(item => item.date === day);
    if (!dayData) return 0;
    
    const hourActivity = dayData.hours.find(h => h.hour === hour);
    if (!hourActivity) return 0;
    
    // Map session count to activity level (0-4)
    const count = hourActivity.session_count;
    if (count === 0) return 0;
    if (count <= 3) return 1;
    if (count <= 7) return 2;
    if (count <= 12) return 3;
    return 4;
  };
  
  // Get all days between the date range
  const getDays = () => {
    if (!dateRange[0] || !dateRange[1]) return [];
    
    const days = [];
    let current = moment(dateRange[0]);
    const end = moment(dateRange[1]);
    
    while (current <= end) {
      days.push(current.format('YYYY-MM-DD'));
      current = current.clone().add(1, 'day');
    }
    
    return days;
  };
  
  return (
    <div className="card session-activity-card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <span>Session Activity Heatmap</span>
        <div className="date-picker">
          <input 
            type="date" 
            className="form-control date-picker-input" 
            value={dateRange[0].format('YYYY-MM-DD')}
            onChange={(e) => setDateRange([moment(e.target.value), dateRange[1]])}
          />
          <span className="mx-2">to</span>
          <input 
            type="date" 
            className="form-control date-picker-input"
            value={dateRange[1].format('YYYY-MM-DD')}
            onChange={(e) => setDateRange([dateRange[0], moment(e.target.value)])}
          />
        </div>
      </div>
      <div className="card-body">
        {!userId ? (
          <div className="alert alert-info">Please select a user to view session activity</div>
        ) : loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="mt-2">Loading activity data...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : activityData.length === 0 ? (
          <div className="alert alert-info">No session activity found for this user in the selected date range</div>
        ) : (
          <div className="heatmap-container">
            <div className="heatmap-labels">
              <div className="hour-label-placeholder"></div>
              {hours.map(hour => (
                <div key={`hour-${hour}`} className="hour-label">
                  {hour}:00
                </div>
              ))}
            </div>
            
            <div className="heatmap-grid">
              {getDays().map(day => (
                <div key={day} className="heatmap-row">
                  <div className="day-label">{moment(day).format('MM-DD')}</div>
                  {hours.map(hour => (
                    <div 
                      key={`${day}-${hour}`} 
                      className="heatmap-cell"
                      style={{ 
                        backgroundColor: activityColors[getActivityLevel(day, hour)] 
                      }}
                      title={`${moment(day).format('YYYY-MM-DD')} ${hour}:00 - ${hour+1}:00`}
                    />
                  ))}
                </div>
              ))}
            </div>
            
            <div className="heatmap-legend mt-4">
              <span className="text-primary">Activity Level: </span>
              <div className="legend-items">
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: activityColors[0] }}></div>
                  <span>None</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: activityColors[1] }}></div>
                  <span>Low</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: activityColors[2] }}></div>
                  <span>Medium</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: activityColors[3] }}></div>
                  <span>High</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: activityColors[4] }}></div>
                  <span>Very High</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionActivityHeatmap;