import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './PasswordResetPage.css'; // You can reuse LoginPage.css
import logo from '../assets/logo/logo.png';
import banner from '../assets/logo/banner.jpg';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const PasswordResetPage = () => {
    const navigate = useNavigate();
    // Step 1: Enter email
    // Step 2: Answer security questions
    // Step 3: Set new password
    const [step, setStep] = useState(1); 
    const [formData, setFormData] = useState({
        email: '',
        securityQuestion1: '',
        securityAnswer1: '',
        securityQuestion2: '',
        securityAnswer2: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [securityQuestions, setSecurityQuestions] = useState({
        question1: '',
        question2: ''
    });
    const [errors, setErrors] = useState({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        
        // Clear specific field error when user types
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: ''
            });
        }
        
        // Check password strength
        if (name === 'newPassword') {
            const strength = checkPasswordStrength(value);
            setPasswordStrength(strength);
        }
    };
    
    // Password strength checker
    const checkPasswordStrength = (password) => {
        let score = 0;
        if (!password) return score;
        
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

    // Validate email
    const validateEmail = () => {
        if (!formData.email) {
            setErrors({ email: 'Email is required' });
            return false;
        }
        
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setErrors({ email: 'Please enter a valid email address' });
            return false;
        }
        
        return true;
    };

    // Find user and get security questions
    const findUser = async (e) => {
        e.preventDefault();
        
        if (!validateEmail()) {
            return;
        }

        setLoading(true);
        setError('');
        try {
            const response = await axios.post('/api/password-reset/get-questions/', {
                email: formData.email
            });

            if (response.data.questions) {
                // Store the security questions for the user
                setSecurityQuestions({
                    question1: response.data.questions.question1,
                    question2: response.data.questions.question2
                });
                setStep(2);
            }
        } catch (err) {
            handleApiError(err, 'Could not find account with this email address.');
        } finally {
            setLoading(false);
        }
    };

    // Verify security answers
    const verifySecurityAnswers = async (e) => {
        e.preventDefault();
        
        // Validate security answers
        const newErrors = {};
        if (!formData.securityAnswer1) {
            newErrors.securityAnswer1 = 'Please provide an answer';
        }
        if (!formData.securityAnswer2) {
            newErrors.securityAnswer2 = 'Please provide an answer';
        }
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        setError('');
        try {
            const response = await axios.post('/api/password-reset/verify-answers/', {
                email: formData.email,
                security_answer1: formData.securityAnswer1,
                security_answer2: formData.securityAnswer2
            });

            if (response.data.success) {
                setStep(3);
            }
        } catch (err) {
            handleApiError(err, 'Incorrect security answers. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Reset password
    const resetPassword = async (e) => {
        e.preventDefault();
        
        // Validate passwords
        const newErrors = {};
        
        if (!formData.newPassword) {
            newErrors.newPassword = 'New password is required';
        } else if (formData.newPassword.length < 8) {
            newErrors.newPassword = 'Password must be at least 8 characters long';
        } else if (passwordStrength < 3) {
            newErrors.newPassword = 'Password is too weak.';
        }
        
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
    
        setLoading(true);
        setError('');
        try {
            const response = await axios.post('/api/password-reset/reset/', {
                email: formData.email,
                security_answer1: formData.securityAnswer1,
                security_answer2: formData.securityAnswer2,
                new_password: formData.newPassword
            });
    
            if (response.data.message || response.data.success) {
                alert('Password reset successful! Please log in with your new password.');
                navigate('/login');
            }
        } catch (err) {
            handleApiError(err, 'Password reset failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    // Common error handler
    const handleApiError = (err, defaultMessage) => {
        if (err.response) {
            if (err.response.status === 404) {
                setError('User not found. Please check your email address.');
            } else if (err.response.status === 400) {
                setError(err.response.data?.error || 'Invalid input. Please check your information.');
            } else if (err.response.status === 429) {
                setError('Too many requests. Please try again later.');
            } else {
                setError(err.response.data?.error || defaultMessage);
            }
        } else if (err.request) {
            setError('No response from server. Please check your internet connection.');
        } else {
            setError(defaultMessage);
        }
        console.error('API error:', err);
    };

    // Render different forms based on current step
    const renderForm = () => {
        switch (step) {
            case 1:
                return (
                    <form onSubmit={findUser}>
                        <div className="mb-3">
                            <label htmlFor="email" className="form-label">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                placeholder="Enter your registered email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                            />
                            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                        </div>
                        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                            {loading ? 'Finding Account...' : 'Continue'}
                        </button>
                    </form>
                );
                
            case 2:
                return (
                    <form onSubmit={verifySecurityAnswers}>
                        <div className="mb-4">
                            <p className="text-muted">Please answer the security questions you set when creating your account.</p>
                        </div>
                        
                        <div className="mb-3">
                            <label className="form-label">{securityQuestions.question1}</label>
                            <input
                                type="text"
                                name="securityAnswer1"
                                className={`form-control ${errors.securityAnswer1 ? 'is-invalid' : ''}`}
                                placeholder="Your answer"
                                required
                                value={formData.securityAnswer1}
                                onChange={handleChange}
                            />
                            {errors.securityAnswer1 && <div className="invalid-feedback">{errors.securityAnswer1}</div>}
                        </div>
                        
                        <div className="mb-4">
                            <label className="form-label">{securityQuestions.question2}</label>
                            <input
                                type="text"
                                name="securityAnswer2"
                                className={`form-control ${errors.securityAnswer2 ? 'is-invalid' : ''}`}
                                placeholder="Your answer"
                                required
                                value={formData.securityAnswer2}
                                onChange={handleChange}
                            />
                            {errors.securityAnswer2 && <div className="invalid-feedback">{errors.securityAnswer2}</div>}
                        </div>
                        
                        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify Answers'}
                        </button>
                    </form>
                );
                
            case 3:
                return (
                    <form onSubmit={resetPassword}>
                        <div className="mb-3">
                            <label htmlFor="newPassword" className="form-label">New Password</label>
                            <div className="input-group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="newPassword"
                                    id="newPassword"
                                    className={`form-control ${errors.newPassword ? 'is-invalid' : ''}`}
                                    placeholder="Enter new password"
                                    required
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                />
                                <button
                                    className="btn btn-outline-secondary"
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                                </button>
                            </div>
                            {errors.newPassword && <div className="invalid-feedback">{errors.newPassword}</div>}
                            
                            {/* Password strength indicator */}
                            {formData.newPassword && (
                                <div className="mt-2">
                                    <div className="progress">
                                        <div 
                                            className={`progress-bar ${
                                                passwordStrength < 3 ? 'bg-danger' : 
                                                passwordStrength < 4 ? 'bg-warning' : 'bg-success'
                                            }`}
                                            style={{ width: `${passwordStrength * 20}%` }}
                                        ></div>
                                    </div>
                                    <small className="text-muted">
                                        {passwordStrength < 3 ? 'Weak' : 
                                         passwordStrength < 4 ? 'Medium' : 'Strong'} password
                                    </small>
                                </div>
                            )}
                        </div>
                        <div className="mb-3">
                            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="confirmPassword"
                                id="confirmPassword"
                                className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                                placeholder="Confirm your new password"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                            {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
                        </div>
                        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                );
                
            default:
                return null;
        }
    };

    return (
        <div className="login-container">
            <div className="login-form">
                <div className="text-center mb-4">
                    <img src={logo} alt="Logo" className="img-fluid" style={{ maxWidth: "300px", height: "auto" }} />
                </div>
                <h2>Reset Password</h2>
                {error && <div className="alert alert-danger">{error}</div>}
                
                {/* Progress indicator */}
                <div className="progress mb-4">
                    <div className="progress-bar" style={{ width: `${step * 33.33}%` }}></div>
                </div>
                <div className="d-flex justify-content-between mb-4">
                    <div className={`step-indicator ${step >= 1 ? 'active' : ''}`}>Enter Email</div>
                    <div className={`step-indicator ${step >= 2 ? 'active' : ''}`}>Security Verification</div>
                    <div className={`step-indicator ${step >= 3 ? 'active' : ''}`}>New Password</div>
                </div>
                
                {renderForm()}
                
                <p className="text-center mt-3">
                    <Link to="/login" className="text-decoration-none">Back to Login</Link>
                </p>
            </div>

            <div className="login-image">
                <img src={banner} alt="banner" style={{ width: "500px", height: "auto" }} />
            </div>
        </div>
    );
};

export default PasswordResetPage;