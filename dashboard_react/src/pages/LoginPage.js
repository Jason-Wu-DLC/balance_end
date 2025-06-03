import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import apiClient from '../api/axios'; // Use modified apiClient instead of axios directly
import './LoginPage.css';
import logo from '../assets/logo/logo.png';
import banner from '../assets/logo/banner.jpg';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation(); // Get current location to check URL parameters
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        remember: false
    });
    const [errors, setErrors] = useState({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [csrfError, setCsrfError] = useState(false); // Add CSRF error state

    // Check for CSRF errors and fetch CSRF token on component load
    useEffect(() => {
        // Check URL or localStorage for CSRF error flag
        const params = new URLSearchParams(location.search);
        const hasCSRFError = params.get('error') === 'csrf' || localStorage.getItem('csrfError') === 'true';
        
        if (hasCSRFError) {
            setCsrfError(true);
            localStorage.removeItem('csrfError'); // Clear error flag
        }
        
        // Fetch CSRF token to ensure cookie is set
        const fetchCSRFToken = async () => {
            try {
                await apiClient.get('/csrf-token/');
            } catch (err) {
                console.error('Error fetching CSRF token:', err);
            }
        };
        
        fetchCSRFToken();
    }, [location]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
        
        // Clear specific field error when user types
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: ''
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        // Validate email
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        
        // Validate password
        if (!formData.password) {
            newErrors.password = 'Password is required';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Form validation
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);
        setError('');
        setCsrfError(false); // Reset CSRF error state

        try {
            // First ensure we have a CSRF cookie
            await apiClient.get('/csrf-token/');
            
            // Use apiClient for login request which will automatically add CSRF header
            const response = await apiClient.post('/login/',{
                username: formData.email,
                password: formData.password
            });

            if (response.data.message === 'Login successful') {
                // Save auth token or session data to localStorage
                if (response.data.token) {
                    localStorage.setItem('authToken', response.data.token);
                }
                
                // If remember me is checked, store the email
                if (formData.remember) {
                    localStorage.setItem('rememberedEmail', formData.email);
                } else {
                    localStorage.removeItem('rememberedEmail');
                }
                
                // Save user info if provided
                if (response.data.user) {
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                }
                
                // Redirect to dashboard
                navigate('/dashboard');
            }
        } catch (err) {
            // Check specifically for CSRF error
            if (err.response && 
                err.response.data && 
                (err.response.data.detail?.includes('CSRF') || 
                err.response.data.error?.includes('CSRF'))) {
                
                setCsrfError(true); // Set CSRF error state
            } else {
                // Enhanced error handling
                if (err.response) {
                    if (err.response.status === 404) {
                        setError('User not found. Please check your email.');
                    } else if (err.response.status === 400) {
                        setError('Invalid email or password.');
                    } else if (err.response.status === 401) {
                        setError('Email or password is incorrect.');
                    } else if (err.response.status === 403) {
                        // Format the error for better readability
                        if (err.response.data?.detail) {
                            setError(`Access denied: ${err.response.data.detail}`);
                        } else {
                            setError(`Account locked: Please try again later.`);
                        }
                    } else {
                        setError(err.response.data?.error || 'Login failed. Please try again.');
                    }
                } else if (err.request) {
                    setError('No response from server. Please check your connection.');
                } else {
                    setError('Login request failed. Please try again.');
                }
            }
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };
    
    // Load remembered email on component mount
    useEffect(() => {
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberedEmail) {
            setFormData(prev => ({
                ...prev,
                email: rememberedEmail,
                remember: true
            }));
        }
        
        // Check if already logged in
        const token = localStorage.getItem('authToken');
        if (token) {
            navigate('/dashboard');
        }
    }, [navigate]);

    return (
        <div className="login-container">
            {/* Left side form */}
            <div className="login-form">
                <div className="text-center mb-4">
                    <img src={logo} alt="Logo" className="img-fluid" style={{ maxWidth: "300px", height: "auto" }} />
                </div>
                <h2>Login</h2>
                
                {/* CSRF Error Banner */}
                {csrfError && (
                    <div className="alert alert-warning">
                        <h5>Session Error</h5>
                        <p>Your login session may have expired. Please try:</p>
                        <ol>
                            <li>Clearing your browser cookies for this site</li>
                            <li>Refreshing the page</li>
                            <li>Logging in again</li>
                        </ol>
                        <button 
                            className="btn btn-outline-primary"
                            onClick={() => window.location.reload()}
                        >
                            Refresh Page
                        </button>
                    </div>
                )}
                
                {/* Regular error display */}
                {error && !csrfError && <div className="alert alert-danger">{error}</div>}

                {/* Email and password login form */}
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                            placeholder="example@gmail.com"
                            required
                            value={formData.email}
                            onChange={handleChange}
                        />
                        {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                    </div>
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">Password</label>
                        <div className="input-group">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                id="password"
                                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                                required
                                value={formData.password}
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
                        {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <input
                                type="checkbox"
                                id="remember"
                                name="remember"
                                className="form-check-input"
                                checked={formData.remember}
                                onChange={handleChange}
                            />
                            <label htmlFor="remember" className="form-check-label ms-2">Remember me</label>
                        </div>
                        <Link to="/password-reset" className="btn btn-link">Forgot password?</Link>
                    </div>
                    <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <p className="text-center mt-3">
                    Don't have an account? <Link to="/signup" className="text-decoration-none">Register new account</Link>
                </p>
            </div>

            {/* Right side image */}
            <div className="login-image">
                <img src={banner} alt="banner" style={{ width: "500px", height: "auto" }} />
            </div>
        </div>
    );
};

export default LoginPage;