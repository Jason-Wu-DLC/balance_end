import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './SignupPage.css';
import logo from '../assets/logo/logo.png';
import banner from '../assets/logo/banner.jpg';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const SignupPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullname: '',
        email: '',
        password: '',
        securityQuestion1: '',
        securityAnswer1: '',
        securityQuestion2: '',
        securityAnswer2: '',
        terms: false,
    });
    
    // Security questions options
    const securityQuestions = [
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
    
    const [errors, setErrors] = useState({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    // Handle form data changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        
        setFormData({
            ...formData,
            [name]: newValue,
        });
        
        // Clear specific field error when user types
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: ''
            });
        }
        
        // Check password strength
        if (name === 'password') {
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
            setErrors({ ...errors, email: 'Email is required' });
            return false;
        }
        
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setErrors({ ...errors, email: 'Please enter a valid email address' });
            return false;
        }
        
        return true;
    };

    // Common error handler
    const handleApiError = (err, defaultMessage) => {
        if (err.response) {
            if (err.response.status === 400 && err.response.data?.error?.includes('exists')) {
                setError('This email is already registered.');
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

    // Form validation
    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.fullname.trim()) {
            newErrors.fullname = 'Name is required';
        }
        
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters long';
        } else if (passwordStrength < 3) {
            newErrors.password = 'Password is too weak';
        }
        
        // Validate security questions
        if (!formData.securityQuestion1) {
            newErrors.securityQuestion1 = 'Please select a security question';
        }
        
        if (!formData.securityAnswer1) {
            newErrors.securityAnswer1 = 'Security answer is required';
        }
        
        if (!formData.securityQuestion2) {
            newErrors.securityQuestion2 = 'Please select a security question';
        }
        
        if (!formData.securityAnswer2) {
            newErrors.securityAnswer2 = 'Security answer is required';
        }
        
        if (formData.securityQuestion1 === formData.securityQuestion2) {
            newErrors.securityQuestion2 = 'Please select a different question';
        }
        
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);
        setError('');
    
        try {
            const response = await axios.post('/api/signup/',{
                fullname: formData.fullname,
                email: formData.email,
                password: formData.password,
                security_question1: formData.securityQuestion1,
                security_answer1: formData.securityAnswer1,
                security_question2: formData.securityQuestion2,
                security_answer2: formData.securityAnswer2
            });
    
            if (response.data.message) {
                alert('Registration successful! You can now log in to your account.');
                navigate('/dashboard');
            }
        } catch (err) {
            handleApiError(err, 'Registration failed. Please check your information and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-form">
                <div className="text-center mb-4">
                    <img src={logo} alt="Logo" className="img-fluid" style={{ maxWidth: '300px', height: 'auto' }} />
                </div>
                <h2>Create New Account</h2>
                {error && <div className="alert alert-danger">{error}</div>}
                <form onSubmit={handleSubmit}>
                    {/* Full name */}
                    <div className="mb-3">
                        <label htmlFor="fullname" className="form-label">Full Name</label>
                        <input
                            type="text"
                            className={`form-control ${errors.fullname ? 'is-invalid' : ''}`}
                            id="fullname"
                            name="fullname"
                            placeholder="Enter your full name"
                            required
                            value={formData.fullname}
                            onChange={handleChange}
                        />
                        {errors.fullname && <div className="invalid-feedback">{errors.fullname}</div>}
                    </div>

                    {/* Email address */}
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">Email Address</label>
                        <input
                            type="email"
                            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                            id="email"
                            name="email"
                            placeholder="example@gmail.com"
                            required
                            value={formData.email}
                            onChange={handleChange}
                        />
                        {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                    </div>

                    {/* Password */}
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">Password</label>
                        <div className="input-group">
                            <input
                                type={showPassword ? "text" : "password"}
                                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                                id="password"
                                name="password"
                                placeholder="Create a secure password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                            />
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                            </button>
                        </div>
                        {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                        
                        {/* Password strength indicator */}
                        {formData.password && (
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
                                {passwordStrength < 3 && (
                                    <div className="small text-muted mt-1">
                                        Include uppercase letters, numbers, and special characters to improve security
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Security Question 1 */}
                    <div className="mb-3">
                        <label htmlFor="securityQuestion1" className="form-label">Security Question 1</label>
                        <select
                            className={`form-control ${errors.securityQuestion1 ? 'is-invalid' : ''}`}
                            id="securityQuestion1"
                            name="securityQuestion1"
                            value={formData.securityQuestion1}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select a security question</option>
                            {securityQuestions.map((question, index) => (
                                <option key={`q1-${index}`} value={question}>{question}</option>
                            ))}
                        </select>
                        {errors.securityQuestion1 && <div className="invalid-feedback">{errors.securityQuestion1}</div>}
                    </div>
                    
                    {/* Security Answer 1 */}
                    <div className="mb-3">
                        <label htmlFor="securityAnswer1" className="form-label">Answer to Security Question 1</label>
                        <input
                            type="text"
                            className={`form-control ${errors.securityAnswer1 ? 'is-invalid' : ''}`}
                            id="securityAnswer1"
                            name="securityAnswer1"
                            placeholder="Enter your answer"
                            required
                            value={formData.securityAnswer1}
                            onChange={handleChange}
                        />
                        {errors.securityAnswer1 && <div className="invalid-feedback">{errors.securityAnswer1}</div>}
                    </div>
                    
                    {/* Security Question 2 */}
                    <div className="mb-3">
                        <label htmlFor="securityQuestion2" className="form-label">Security Question 2</label>
                        <select
                            className={`form-control ${errors.securityQuestion2 ? 'is-invalid' : ''}`}
                            id="securityQuestion2"
                            name="securityQuestion2"
                            value={formData.securityQuestion2}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select a security question</option>
                            {securityQuestions.map((question, index) => (
                                <option key={`q2-${index}`} value={question}>{question}</option>
                            ))}
                        </select>
                        {errors.securityQuestion2 && <div className="invalid-feedback">{errors.securityQuestion2}</div>}
                    </div>
                    
                    {/* Security Answer 2 */}
                    <div className="mb-3">
                        <label htmlFor="securityAnswer2" className="form-label">Answer to Security Question 2</label>
                        <input
                            type="text"
                            className={`form-control ${errors.securityAnswer2 ? 'is-invalid' : ''}`}
                            id="securityAnswer2"
                            name="securityAnswer2"
                            placeholder="Enter your answer"
                            required
                            value={formData.securityAnswer2}
                            onChange={handleChange}
                        />
                        {errors.securityAnswer2 && <div className="invalid-feedback">{errors.securityAnswer2}</div>}
                    </div>


                    {/* Submit button */}
                    <button 
                        type="submit" 
                        className="btn btn-primary w-100" 
                        disabled={loading}
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                {/* Already have account */}
                <p className="text-center mt-3">
                    Already have an account? <Link to="/login" className="text-decoration-none">Log in</Link>
                </p>
            </div>

            <div className="login-image">
                <img src={banner} alt="banner" style={{ width: '500px', height: 'auto' }} />
            </div>
        </div>
    );
};

export default SignupPage;