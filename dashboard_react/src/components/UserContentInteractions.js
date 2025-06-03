import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Sector
} from 'recharts';
import { fetchUserContentInteraction } from '../api/requests';

// Color palette for different interaction types
const COLORS = {
  course_view: '#8884d8',      // Purple
  note_view: '#82ca9d',        // Green
  comment_view: '#ffc658',     // Yellow
  bookmark_view: '#ff8042',    // Orange
  setting_view: '#0088FE',     // Blue
  content_view: '#00C49F',     // Teal
  other: '#FFBB28'             // Light orange
};

const UserContentInteractions = ({ userId }) => {
  const [interactionData, setInteractionData] = useState({
    interaction_by_type: [],
    interaction_by_time: [],
    total_interactions: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [chartType, setChartType] = useState('bar'); // 'bar', 'pie', or 'line'

  useEffect(() => {
    // Only fetch if userId is provided
    if (!userId) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await fetchUserContentInteraction(userId);
        setInteractionData(data);
      } catch (err) {
        console.error('Error fetching content interaction data:', err);
        setError('Failed to load content interaction data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [userId]);

  // Handler for pie chart active slice
  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  // Render active shape for pie chart (advanced interactive version)
  const renderActiveShape = (props) => {
    const { 
      cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, percent, value 
    } = props;
    
    const sin = Math.sin(-midAngle * Math.PI / 180);
    const cos = Math.cos(-midAngle * Math.PI / 180);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';
  
    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="interaction-total">
          {payload.type}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`${value} views`}</text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
          {`(${(percent * 100).toFixed(2)}%)`}
        </text>
      </g>
    );
  };

  // Function to format the type label for better readability
  const formatTypeLabel = (type) => {
    // Convert snake_case to Title Case with spaces
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Generate time series data for line chart
  const generateTimeSeriesData = () => {
    if (!interactionData.interaction_by_time.length) return [];
    
    // Ensure all dates have all interaction types (with 0 if not present)
    const allTypes = new Set();
    interactionData.interaction_by_time.forEach(dayData => {
      Object.keys(dayData).forEach(key => {
        if (key !== 'date') allTypes.add(key);
      });
    });
    
    // Create normalized data
    return interactionData.interaction_by_time.map(dayData => {
      const normalizedData = { date: dayData.date };
      
      allTypes.forEach(type => {
        normalizedData[type] = dayData[type] || 0;
      });
      
      return normalizedData;
    });
  };

  // Render loading state
  if (loading) {
    return (
      <div className="card">
        <div className="card-header">Content Interaction Analysis</div>
        <div className="card-body text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading interaction data...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="card">
        <div className="card-header">Content Interaction Analysis</div>
        <div className="card-body">
          <div className="alert alert-danger">{error}</div>
        </div>
      </div>
    );
  }

  // Render no data state
  if (!interactionData.interaction_by_type.length) {
    return (
      <div className="card">
        <div className="card-header">Content Interaction Analysis</div>
        <div className="card-body">
          <div className="alert alert-info">
            No interaction data available for this user. They may not have engaged with content yet.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card user-content-interactions">
      <div className="card-header d-flex justify-content-between align-items-center">
        <span>Content Interaction Analysis</span>
        <div className="btn-group" role="group">
          <button
            type="button"
            className={`btn btn-sm ${chartType === 'bar' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setChartType('bar')}
          >
            Bar Chart
          </button>
          <button
            type="button" 
            className={`btn btn-sm ${chartType === 'pie' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setChartType('pie')}
          >
            Pie Chart
          </button>
          <button
            type="button"
            className={`btn btn-sm ${chartType === 'line' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setChartType('line')}
          >
            Time Trend
          </button>
        </div>
      </div>
      <div className="card-body">
        <div className="interaction-summary mb-3">
          <div className="row">
            <div className="col-md-6">
              <div className="statistics">
                <h4 className="total-interactions">
                  {interactionData.total_interactions} 
                  <span className="text-muted"> Total Interactions</span>
                </h4>
                <p className="text-muted">
                  This chart shows how the user interacts with different types of content on the platform.
                </p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="interaction-highlights">
                {interactionData.interaction_by_type.slice(0, 2).map((item, index) => (
                  <div key={index} className="highlight-item">
                    <span className="highlight-label">{formatTypeLabel(item.type)}:</span>
                    <span className="highlight-value">{item.count}</span>
                    <span className="highlight-percent">
                      ({((item.count / interactionData.total_interactions) * 100).toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="chart-container" style={{ height: 400 }}>
          {chartType === 'bar' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={interactionData.interaction_by_type.map(item => ({
                  ...item,
                  type: formatTypeLabel(item.type)
                }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name, props) => [`${value} interactions`, 'Count']}
                  labelFormatter={(label) => `Content Type: ${label}`}
                />
                <Legend />
                <Bar 
                  dataKey="count"
                  name="Interactions"
                  fill="#8884d8"
                >
                  {interactionData.interaction_by_type.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[entry.type] || COLORS.other} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {chartType === 'pie' && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={interactionData.interaction_by_type}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  dataKey="count"
                  onMouseEnter={onPieEnter}
                >
                  {interactionData.interaction_by_type.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[entry.type] || COLORS.other} 
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend 
                  formatter={(value, entry, index) => formatTypeLabel(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          )}

          {chartType === 'line' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={generateTimeSeriesData()}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend formatter={(value) => formatTypeLabel(value)} />
                
                {/* Create lines for each interaction type */}
                {Object.keys(COLORS).map((type, index) => {
                  // Check if we have this type in our data
                  const hasType = interactionData.interaction_by_time.some(
                    day => type in day
                  );
                  
                  if (!hasType) return null;
                  
                  return (
                    <Line 
                      key={type}
                      type="monotone"
                      dataKey={type}
                      name={formatTypeLabel(type)}
                      stroke={COLORS[type]}
                      activeDot={{ r: 8 }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-insights mt-4">
          <h5>Key Insights</h5>
          <ul className="insights-list">
            {interactionData.interaction_by_type.length > 0 && (
              <li>
                Most frequent interaction: <strong>{formatTypeLabel(interactionData.interaction_by_type[0].type)}</strong> with 
                {" "}<strong>{interactionData.interaction_by_type[0].count}</strong> interactions.
              </li>
            )}
            
            {interactionData.interaction_by_time.length > 0 && (
              <li>
                Content interaction data spans <strong>{interactionData.interaction_by_time.length}</strong> days.
              </li>
            )}
            
            {interactionData.interaction_by_type.length > 1 && (
              <li>
                The ratio between most and least used content types is 
                <strong>{" "}
                  {(interactionData.interaction_by_type[0].count / 
                   interactionData.interaction_by_type[interactionData.interaction_by_type.length-1].count).toFixed(1)}x
                </strong>.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UserContentInteractions;