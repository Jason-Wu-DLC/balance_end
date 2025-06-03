import React, { useState, useEffect } from 'react'; 
import { fetchModuleCompletionStatus } from '../api/requests';

const ModuleCompletionStatus = ({ userId }) => {
  const [moduleData, setModuleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const fetchModuleStatus = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("Fetching module status for user:", userId);
        const data = await fetchModuleCompletionStatus(userId);
        console.log("Module status response:", data);
        
        const processedData = data.map(module => {
          let status = module.status || 'not_started';
          let statusLabel = '';
          let percent = 0;
          
          // Determine status label and percent based on status
          if (status === 'in_progress') {
            statusLabel = '🟡 In Progress';
            percent = 50;
          } else if (status === 'completed') {
            statusLabel = '✅ Completed';
            percent = 100;
          } else {
            statusLabel = '⚪ Not Started';
            percent = 0;
          }
          
          return {
            ...module,
            statusLabel,
            percent
          };
        });
        
        setModuleData(processedData);
      } catch (err) {
        console.error('Error fetching module status:', err);
        setError('Failed to load module completion data');
      } finally {
        setLoading(false);
      }
    };

    fetchModuleStatus();

  }, [userId]);

  return (
    <div className="card module-completion-card">
      <div className="card-header">Module Completion Status</div>
      <div className="card-body">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading module status...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : moduleData.length === 0 ? (
          <div className="alert alert-info">No module data available for this user</div>
        ) : (
          <ul className="module-status-list">
            {moduleData.map(item => (
              <li key={item.id} className="module-status-item">
                <div className="module-info">
                  <span className="module-name fw-bold">{item.name}</span>
                  <span className={`status-badge ${
                    item.status === 'completed' ? 'success' : 
                    item.status === 'in_progress' ? 'warning' : 
                    'default'
                  }`}>
                    {item.statusLabel}
                  </span>
                </div>
                <div className="progress mt-2">
                  <div 
                    className={`progress-bar ${
                      item.status === 'completed' ? 'bg-success' : 
                      item.status === 'in_progress' ? 'bg-warning' : 
                      ''
                    }`} 
                    role="progressbar" 
                    style={{ width: `${item.percent}%` }}
                    aria-valuenow={item.percent}
                    aria-valuemin="0" 
                    aria-valuemax="100"
                  ></div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ModuleCompletionStatus;