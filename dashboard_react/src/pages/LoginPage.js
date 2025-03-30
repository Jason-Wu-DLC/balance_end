import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LoginPage.css';
import logo from '../assets/logo/logo.png';
import banner from '../assets/logo/banner.jpg';
import 'bootstrap/dist/css/bootstrap.min.css'; // 引入 Bootstrap CSS
import 'bootstrap-icons/font/bootstrap-icons.css'; // 引入 Bootstrap 图标

const LoginPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        remember: false
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('/api/login/', {
                username: formData.email,
                password: formData.password
            });

            if (response.data.message === 'Login successful') {
                // 登录成功，跳转到dashboard页面
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.error || '登录失败，请检查邮箱和密码');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            {/* 左侧表单 */}
            <div className="login-form">
                <div className="text-center mb-4">
                    <img src={logo} alt="Logo" className="img-fluid" style={{ maxWidth: "300px", height: "auto" }} />
                </div>
                <h2>登录</h2>
                {error && <div className="alert alert-danger">{error}</div>}

                {/* 邮箱和密码登录表单 */}
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">邮箱地址</label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            className="form-control"
                            placeholder="example@gmail.com"
                            required
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">密码</label>
                        <div className="input-group">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                id="password"
                                className="form-control"
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
                            <label htmlFor="remember" className="form-check-label">remember me</label>
                        </div>
                        <a href="/password-reset" className="btn btn-link">forget password</a>
                    </div>
                    <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                        {loading ? '登录中...' : '登录'}
                    </button>
                </form>
                <p className="text-center mt-3">
                    还没有账号? <a href="/signup" className="text-decoration-none">register new accoount</a>
                </p>
            </div>

            {/* 右侧图片 */}
            <div className="login-image">
                <img src={banner} alt="banner" style={{ width: "500px", height: "auto" }} />
            </div>
        </div>
    );
};

export default LoginPage;
