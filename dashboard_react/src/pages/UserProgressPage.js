import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import ModuleCompletionStatus from '../components/ModuleCompletionStatus';
import SessionActivityHeatmap from '../components/SessionActivityHeatmap';
import UserFavorites from '../components/UserFavorites';
import UserPostAnalysis from '../components/UserPostAnalysis';
import UserContentInteractions from '../components/UserContentInteractions';
import { fetchWordPressUsers } from '../api/requests';

const UserProgressPage = () => {
  const [userId, setUserId] = useState(null);
  const [userOptions, setUserOptions] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Fetch WordPress user list
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const data = await fetchWordPressUsers();
        
        if (data && Array.isArray(data.users)) {
          setUserOptions(data.users);
        } else {
          console.error('Unexpected API response format:', data);
          setUserOptions([]);
        }
      } catch (err) {
        console.error('Failed to load user list:', err);
        setUserOptions([]);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content progress-page">
        <div className="page-header">
          <h2 className="page-title">User Progress Analysis</h2>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/dashboard">Dashboard</a></li>
              <li className="breadcrumb-item active" aria-current="page">User Progress</li>
            </ol>
          </nav>
        </div>

        <div className="user-selector mb-3">
          {loadingUsers ? (
            <div className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label selector-label">Select WordPress User</label>
              <select
                className="form-select"
                onChange={(e) => setUserId(e.target.value)}
                value={userId || ''}
              >
                <option value="">Select a user</option>
                {userOptions.map(user => (
                  <option key={user.id} value={user.id}>
                    (ID: {user.id})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 传递 userId 到子组件 */}
        {userId && (
          <div className="progress-content">
            <ModuleCompletionStatus userId={userId} />
            <hr className="divider" />
            <UserContentInteractions userId={userId} />
            <hr className="divider" />
            <SessionActivityHeatmap userId={userId} />
            <hr className="divider" />
            <UserFavorites userId={userId} />
            <hr className="divider" />
            <UserPostAnalysis userId={userId} />
          </div>
        )}
      </main>
    </div>
  );
};

export default UserProgressPage;