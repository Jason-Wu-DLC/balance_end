import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 路由跳转
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
        terms: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false); // 控制密码显示

    // 处理表单数据变化
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    // 处理表单提交
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/signup/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Signup Successful! Redirecting to Dashboard...');
                navigate('/dashboard'); // 跳转到仪表盘
            } else {
                setError(data.error || 'Signup failed. Please try again.');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        }

        setLoading(false);
    };

    return (
        <div className="login-container">
            <div className="login-form">
                <div className="text-center mb-4">
                    <img src={logo} alt="Logo" className="img-fluid" style={{ maxWidth: '300px', height: 'auto' }} />
                </div>
                <h2>Sign Up</h2>
                {error && <p className="text-danger">{error}</p>}
                <form onSubmit={handleSubmit}>
                    {/* Full Name */}
                    <div className="mb-3">
                        <label htmlFor="fullname" className="form-label">Full Name</label>
                        <input
                            type="text"
                            className="form-control"
                            id="fullname"
                            name="fullname"
                            placeholder="John Kevine"
                            required
                            value={formData.fullname}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Email Address */}
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">Email Address</label>
                        <input
                            type="email"
                            className="form-control"
                            id="email"
                            name="email"
                            placeholder="example@gmail.com"
                            required
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Password */}
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">Password</label>
                        <div className="input-group">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="form-control"
                                id="password"
                                name="password"
                                placeholder="********"
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
                    </div>

                    {/* Terms and Conditions */}
                    <div className="form-check mb-3">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="terms"
                            name="terms"
                            required
                            checked={formData.terms}
                            onChange={handleChange}
                        />
                        <label className="form-check-label" htmlFor="terms">
                            By creating an account you agree to the <a href="#" className="terms-link">terms of use</a> and <a href="#" className="terms-link">privacy policy</a>.
                        </label>
                    </div>

                    {/* Submit Button */}
                    <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                {/* Already Have Account */}
                <p className="text-center mt-3">
                    Already have an account? <a href="/login" className="text-decoration-none">Log in</a>
                </p>
            </div>

            <div className="login-image">
                <img src={banner} alt="banner" style={{ width: '500px', height: 'auto' }} />
            </div>
        </div>
    );
};

export default SignupPage;
