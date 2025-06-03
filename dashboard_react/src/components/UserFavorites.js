import React, { useState, useEffect } from 'react';
import { StarFilled } from '@ant-design/icons';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import apiClient from '../api/axios';

// Colors for pie chart (using CSS variables when possible)
const COLORS = [
  '#FF6B6B', // red
  '#4ECDC4', // turquoise
  '#45B7D1', // blue
  '#9370DB', // purple
  '#FFD166', // yellow
  '#06D6A0', // green
  '#FF9F1C', // orange
  '#E76F51', // coral
  '#3D5A80', // navy
  '#F4A261', // peach
  '#2A9D8F', // teal
  '#A8DADC', // light blue
  '#8D99AE'  // gray-blue
];

const UserFavorites = ({ userId }) => {
  const [favoriteData, setFavoriteData] = useState({
    favorites: [],
    stats: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only fetch if userId is provided
    if (!userId) return;
    
    const fetchFavorites = async () => {
      try {
        setLoading(true);
        
        // Add userId as query parameter
        const response = await apiClient.get('user-favorites/', {
          params: { user_id: userId }
        });
        
        setFavoriteData(response.data);
      } catch (err) {
        console.error('Error fetching favorites data:', err);
        setError('Failed to load favorites data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFavorites();
  }, [userId]); // Add userId as dependency
  const filteredStats = favoriteData.stats.filter(item =>
    ['Physical Health', 'Mental and Personal Wellbeing', 'Social and Work'].includes(item.module)
  );
  return (
    <div className="card favorites-card">
      <div className="card-header">Content Favorites</div>
      <div className="card-body">
        {!userId ? (
          <div className="alert alert-info">Please select a user to view favorites</div>
        ) : loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading favorites data...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : favoriteData.favorites.length === 0 ? (
          <div className="alert alert-info">No favorites found for this user</div>
        ) : (
          <>
            <div className="favorites-container">
              <div className="favorites-list">
                <h4 className="section-title">Favorite Content</h4>
                <ul className="list-unstyled">
                  {favoriteData.favorites.map(item => (
                    <li key={item.id} className="list-item mb-2">
                      <div className="favorite-item">
                        <div className="favorite-info">
                          <StarFilled className="star-icon" />
                          <span>{item.title}</span>
                        </div>
                        <span className={`badge ${
                          item.type === 'course' ? 'bg-primary' : 
                          item.type === 'resource' ? 'bg-success' : 'bg-info'
                        }`}>
                          {item.type}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="favorites-chart">
                <h4 className="section-title">Module Distribution</h4>
                {favoriteData.stats.length === 0 ? (
                  <div className="alert alert-info">No module data available</div>
                ) : (
                  <div className="chart-container" style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={filteredStats}
                          dataKey="count"
                          nameKey="module"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="var(--chart-color-1)"
                          label={({module, count, percent}) => 
                            `${module}: ${count} (${(percent * 100).toFixed(0)}%)`
                          }
                          labelLine={true}
                        >
                          {favoriteData.stats.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[index % COLORS.length]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
            
            {favoriteData.stats.length > 0 && (
              <div className="favorites-summary">
                <div className="row">
                  {favoriteData.stats.map(item => (
                    <div key={item.module} className="col col-md-4 mb-3">
                      <div className="card summary-card">
                        <div className="card-body text-center">
                          <strong>{item.module}</strong>
                          <div className="summary-count">{item.count} favorites</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserFavorites;