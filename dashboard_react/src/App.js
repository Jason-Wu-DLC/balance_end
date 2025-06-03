import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import IndexPage from './pages/IndexPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import PasswordResetPage from './pages/PasswordResetPage';
import DashboardPage from './pages/DashboardPage';
import { AuthProvider } from './context/AuthContext';
import UsercommentPage from './pages/UsercommentPage';
import UserProgressPage from './pages/UserProgressPage';
import CourseProgressPage from './pages/CourseProgressPage';
import SettingsPage from './pages/SettingsPage';
//import './styles/main.scss';

// Protected Route component implementation
const ProtectedRoute = ({ children }) => {
  // Check if user is authenticated
  const isAuthenticated = localStorage.getItem('authToken') !== null;
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the children
  return children;
};

const App = () => {
  return (
    <AuthProvider>
    <Router>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/password-reset" element={<PasswordResetPage />} />
        <Route path="/logout" element={<IndexPage />} />
        
        {/* Protected routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/user-comment" 
        element={
          <ProtectedRoute>
            <UsercommentPage />
          </ProtectedRoute>
        }
        />
        <Route 
        path="/user-progress" 
        element={
        <ProtectedRoute>
          <UserProgressPage />
        </ProtectedRoute>
      }
      />
      <Route 
      path="/course-progress" 
      element={
      <ProtectedRoute>
      <CourseProgressPage />
      </ProtectedRoute>}  
      />
      <Route 
      path="/settings" 
      element={
      <ProtectedRoute>
        <SettingsPage />
        </ProtectedRoute>} 
        />
      </Routes>
    </Router>
    </AuthProvider>
  );
};

export default App;