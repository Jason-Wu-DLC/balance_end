import React, { useState, useEffect } from 'react';
import { FaUser, FaLock, FaShieldAlt } from 'react-icons/fa';
import apiClient from '../../api/axios';

const UserProfileSettings = () => {
  // Personal Info State
  const [personalInfo, setPersonalInfo] = useState({
    first_name: '',
    last_name: '',
    email: ''
  });
  
  // Password State
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  // Security Questions State
  const [securityQuestions, setSecurityQuestions] = useState([]);
  const [newSecurityQuestions, setNewSecurityQuestions] = useState([
    { question_number: 1, question_text: '', answer: '' },
    { question_number: 2, question_text: '', answer: '' }
  ]);
  
  // Available security questions
  const availableQuestions = [
    "What was your childhood nickname?",
    "In what city were you born?",
    "What is the name of your first pet?",
    "What is your mother's maiden name?",
    "What high school did you attend?",
    "What was the make of your first car?",
    "What was your favorite food as a child?",
    "Where did you meet your spouse/significant other?",
    "What is your favorite movie?",
    "What is your favorite color?"
  ];
  
  // UI States
  const [loading, setLoading] = useState({
    profile: false,
    password: false,
    questions: false
  });
  const [error, setError] = useState({
    profile: '',
    password: '',
    questions: ''
  });
  const [success, setSuccess] = useState({
    profile: '',
    password: '',
    questions: ''
  });
  
  // Fetch user profile on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(prev => ({ ...prev, profile: true }));
      try {
        const response = await apiClient.get('user/profile/');
        setPersonalInfo({
          first_name: response.data.first_name || '',
          last_name: response.data.last_name || '',
          email: response.data.email || ''
        });
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError(prev => ({ 
          ...prev, 
          profile: 'Failed to load user profile. Please try again.' 
        }));
      } finally {
        setLoading(prev => ({ ...prev, profile: false }));
      }
    };
    
    const fetchSecurityQuestions = async () => {
      setLoading(prev => ({ ...prev, questions: true }));
      try {
        const response = await apiClient.get('user/security-questions/');
        setSecurityQuestions(response.data);
        if (response.data.length === 2) {
          setNewSecurityQuestions([
            { 
              question_number: 1, 
              question_text: response.data[0].question_text, 
              answer: '' 
            },
            { 
              question_number: 2, 
              question_text: response.data[1].question_text, 
              answer: '' 
            }
          ]);
        }
      } catch (err) {
        console.error('Error fetching security questions:', err);
        // Don't show error for no security questions, as they might not be set yet
        if (err.response?.status !== 404) {
          setError(prev => ({ 
            ...prev, 
            questions: 'Failed to load security questions.' 
          }));
        }
      } finally {
        setLoading(prev => ({ ...prev, questions: false }));
      }
    };
    
    fetchUserProfile();
    fetchSecurityQuestions();
  }, []);
  
  // Handle personal info changes
  const handlePersonalInfoChange = (e) => {
    const { name, value } = e.target;
    setPersonalInfo(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user types
    setError(prev => ({ ...prev, profile: '' }));
    setSuccess(prev => ({ ...prev, profile: '' }));
  };
  
  // Handle personal info submit
  const handlePersonalInfoSubmit = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, profile: true }));
    setError(prev => ({ ...prev, profile: '' }));
    setSuccess(prev => ({ ...prev, profile: '' }));
    
    try {
      const response = await apiClient.put('user/profile/', personalInfo);
      setSuccess(prev => ({ 
        ...prev, 
        profile: response.data.message || 'Profile updated successfully!' 
      }));
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(prev => ({ 
        ...prev, 
        profile: err.response?.data?.error || 'Failed to update profile. Please try again.' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  };
  
  // Handle password changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user types
    setError(prev => ({ ...prev, password: '' }));
    setSuccess(prev => ({ ...prev, password: '' }));
  };
  
  // Check password strength
  const checkPasswordStrength = (password) => {
    let score = 0;
    if (!password) return 0;
    
    // Length check
    if (password.length >= 8) score++;
    
    // Contains lowercase
    if (/[a-z]/.test(password)) score++;
    
    // Contains uppercase
    if (/[A-Z]/.test(password)) score++;
    
    // Contains numbers
    if (/[0-9]/.test(password)) score++;
    
    // Contains special characters
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    
    return score;
  };
  
  // Handle password submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, password: true }));
    setError(prev => ({ ...prev, password: '' }));
    setSuccess(prev => ({ ...prev, password: '' }));
    
    // Validate password
    if (passwordData.new_password !== passwordData.confirm_password) {
      setError(prev => ({ ...prev, password: 'New passwords do not match' }));
      setLoading(prev => ({ ...prev, password: false }));
      return;
    }
    
    const strength = checkPasswordStrength(passwordData.new_password);
    if (strength < 3) {
      setError(prev => ({ 
        ...prev, 
        password: 'Password is too weak. Include uppercase letters, numbers, and special characters.' 
      }));
      setLoading(prev => ({ ...prev, password: false }));
      return;
    }
    
    try {
      const response = await apiClient.put('user/change-password/', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      
      setSuccess(prev => ({ 
        ...prev, 
        password: response.data.message || 'Password changed successfully!' 
      }));
      
      // Clear form
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (err) {
      console.error('Error changing password:', err);
      setError(prev => ({ 
        ...prev, 
        password: err.response?.data?.error || 'Failed to change password. Please try again.' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, password: false }));
    }
  };
  
  // Handle security question changes
  const handleSecurityQuestionChange = (index, field, value) => {
    const updatedQuestions = [...newSecurityQuestions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value
    };
    setNewSecurityQuestions(updatedQuestions);
    
    // Clear errors when user types
    setError(prev => ({ ...prev, questions: '' }));
    setSuccess(prev => ({ ...prev, questions: '' }));
  };
  
  // Handle security questions submit
  const handleSecurityQuestionsSubmit = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, questions: true }));
    setError(prev => ({ ...prev, questions: '' }));
    setSuccess(prev => ({ ...prev, questions: '' }));
    
    // Validation
    if (newSecurityQuestions[0].question_text === newSecurityQuestions[1].question_text) {
      setError(prev => ({ ...prev, questions: 'Please choose different security questions' }));
      setLoading(prev => ({ ...prev, questions: false }));
      return;
    }
    
    if (!newSecurityQuestions[0].answer || !newSecurityQuestions[1].answer) {
      setError(prev => ({ ...prev, questions: 'Please provide answers for both security questions' }));
      setLoading(prev => ({ ...prev, questions: false }));
      return;
    }
    
    try {
      const response = await apiClient.put('user/security-questions/', {
        questions: newSecurityQuestions
      });
      
      setSuccess(prev => ({ 
        ...prev, 
        questions: response.data.message || 'Security questions updated successfully!' 
      }));
      
      // Clear answers for security
      setNewSecurityQuestions(prev => prev.map(q => ({ ...q, answer: '' })));
    } catch (err) {
      console.error('Error updating security questions:', err);
      setError(prev => ({ 
        ...prev, 
        questions: err.response?.data?.error || 'Failed to update security questions. Please try again.' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, questions: false }));
    }
  };
  
  return (
    <div className="settings-page settings-user-profile">
      <div className="row">
        <div className="col col-lg-6 mb-4">
          <div className="card">
            <div className="card-header d-flex align-items-center">
              <FaUser className="me-2" /> Personal Information
            </div>
            <div className="card-body">
              {error.profile && <div className="alert alert-danger">{error.profile}</div>}
              {success.profile && <div className="alert alert-success">{success.profile}</div>}
              
              <form onSubmit={handlePersonalInfoSubmit}>
                <div className="form-group mb-3">
                  <label className="form-label">First Name</label>
                  <input
                    className="form-control"
                    type="text"
                    name="first_name"
                    value={personalInfo.first_name}
                    onChange={handlePersonalInfoChange}
                    placeholder="Enter your first name"
                  />
                </div>
                
                <div className="form-group mb-3">
                  <label className="form-label">Last Name</label>
                  <input
                    className="form-control"
                    type="text"
                    name="last_name"
                    value={personalInfo.last_name}
                    onChange={handlePersonalInfoChange}
                    placeholder="Enter your last name"
                  />
                </div>
                
                <div className="form-group mb-3">
                  <label className="form-label">Email Address</label>
                  <input
                    className="form-control"
                    type="email"
                    name="email"
                    value={personalInfo.email}
                    onChange={handlePersonalInfoChange}
                    placeholder="Enter your email"
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading.profile}
                >
                  {loading.profile ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span className="ms-2">Saving...</span>
                    </>
                  ) : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>
        </div>
        
        <div className="col col-lg-6 mb-4">
          <div className="card">
            <div className="card-header d-flex align-items-center">
              <FaLock className="me-2" /> Change Password
            </div>
            <div className="card-body">
              {error.password && <div className="alert alert-danger">{error.password}</div>}
              {success.password && <div className="alert alert-success">{success.password}</div>}
              
              <form onSubmit={handlePasswordSubmit}>
                <div className="form-group mb-3">
                  <label className="form-label">Current Password</label>
                  <input
                    className="form-control"
                    type="password"
                    name="current_password"
                    value={passwordData.current_password}
                    onChange={handlePasswordChange}
                    placeholder="Enter your current password"
                    required
                  />
                </div>
                
                <div className="form-group mb-3">
                  <label className="form-label">New Password</label>
                  <input
                    className="form-control"
                    type="password"
                    name="new_password"
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                    required
                  />
                  
                  {/* Password strength indicator */}
                  {passwordData.new_password && (
                    <div className="password-strength-indicator mt-2">
                      <div className="progress">
                        <div 
                          className={`progress-bar ${
                            checkPasswordStrength(passwordData.new_password) < 3 ? 'bg-danger' : 
                            checkPasswordStrength(passwordData.new_password) < 4 ? 'bg-warning' : 'bg-success'
                          }`}
                          style={{ width: `${checkPasswordStrength(passwordData.new_password) * 20}%` }}
                        ></div>
                      </div>
                      <small className="strength-text text-muted">
                        {checkPasswordStrength(passwordData.new_password) < 3 ? 'Weak' : 
                         checkPasswordStrength(passwordData.new_password) < 4 ? 'Medium' : 'Strong'} password
                      </small>
                    </div>
                  )}
                </div>
                
                <div className="form-group mb-3">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    className="form-control"
                    type="password"
                    name="confirm_password"
                    value={passwordData.confirm_password}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                    required
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading.password}
                >
                  {loading.password ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span className="ms-2">Changing...</span>
                    </>
                  ) : 'Change Password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row">
        <div className="col">
          <div className="card">
            <div className="card-header d-flex align-items-center">
              <FaShieldAlt className="me-2" /> Security Questions
            </div>
            <div className="card-body">
              {error.questions && <div className="alert alert-danger">{error.questions}</div>}
              {success.questions && <div className="alert alert-success">{success.questions}</div>}
              
              <p className="text-muted mb-3">
                Security questions help verify your identity if you need to reset your password.
              </p>
              
              <form onSubmit={handleSecurityQuestionsSubmit} className="security-questions">
                {newSecurityQuestions.map((question, index) => (
                  <div key={index} className="question-group mb-4">
                    <h5>Question {index + 1}</h5>
                    <div className="form-group mb-3">
                      <label className="form-label">Select a Security Question</label>
                      <select
                        className="form-select"
                        value={question.question_text}
                        onChange={(e) => handleSecurityQuestionChange(index, 'question_text', e.target.value)}
                        required
                      >
                        <option value="">Select a question</option>
                        {availableQuestions.map((q, i) => (
                          <option key={i} value={q}>{q}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group mb-3">
                      <label className="form-label">Your Answer</label>
                      <input
                        className="form-control"
                        type="text"
                        value={question.answer}
                        onChange={(e) => handleSecurityQuestionChange(index, 'answer', e.target.value)}
                        placeholder="Enter your answer"
                        required
                      />
                    </div>
                  </div>
                ))}
                
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading.questions}
                >
                  {loading.questions ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span className="ms-2">Saving...</span>
                    </>
                  ) : 'Save Security Questions'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileSettings;