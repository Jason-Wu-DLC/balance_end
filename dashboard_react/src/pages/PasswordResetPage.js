import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PasswordResetPage.css'; // 可复用 LoginPage 的样式
import logo from '../assets/logo/logo.png';
import banner from '../assets/logo/banner.jpg';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const PasswordResetPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: 输入邮箱, 2: 验证码验证, 3: 设置新密码
    const [formData, setFormData] = useState({
        email: '',
        verificationCode: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // 发送重置验证码
    const sendResetCode = async (e) => {
        e.preventDefault();
        if (!formData.email) {
            setError('请输入有效的邮箱地址');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post('/api/password-reset/send-code/', {
                email: formData.email
            });

            if (response.data.success) {
                setStep(2);
                setError('');
            }
        } catch (err) {
            setError(err.response?.data?.error || '发送验证码失败，请检查邮箱地址');
        } finally {
            setLoading(false);
        }
    };

    // 验证验证码
    const verifyCode = async (e) => {
        e.preventDefault();
        if (!formData.verificationCode) {
            setError('请输入验证码');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post('/api/password-reset/verify-code/', {
                email: formData.email,
                code: formData.verificationCode
            });

            if (response.data.success) {
                setStep(3);
                setError('');
            }
        } catch (err) {
            setError(err.response?.data?.error || '验证码无效或已过期');
        } finally {
            setLoading(false);
        }
    };

    // 重置密码
    const resetPassword = async (e) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            setError('两次输入的密码不一致');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post('/api/password-reset/reset/', {
                email: formData.email,
                code: formData.verificationCode,
                new_password: formData.newPassword
            });

            if (response.data.success) {
                alert('密码重置成功！请使用新密码登录');
                navigate('/login');
            }
        } catch (err) {
            setError(err.response?.data?.error || '密码重置失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    // 根据当前步骤渲染不同表单
    const renderForm = () => {
        switch (step) {
            case 1:
                return (
                    <form onSubmit={sendResetCode}>
                        <div className="mb-3">
                            <label htmlFor="email" className="form-label">邮箱地址</label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                className="form-control"
                                placeholder="请输入注册时使用的邮箱"
                                required
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                            {loading ? '发送中...' : '发送验证码'}
                        </button>
                    </form>
                );
                
            case 2:
                return (
                    <form onSubmit={verifyCode}>
                        <div className="mb-3">
                            <label htmlFor="verificationCode" className="form-label">验证码</label>
                            <input
                                type="text"
                                name="verificationCode"
                                id="verificationCode"
                                className="form-control"
                                placeholder="请输入邮箱收到的验证码"
                                required
                                value={formData.verificationCode}
                                onChange={handleChange}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                            {loading ? '验证中...' : '验证'}
                        </button>
                    </form>
                );
                
            case 3:
                return (
                    <form onSubmit={resetPassword}>
                        <div className="mb-3">
                            <label htmlFor="newPassword" className="form-label">新密码</label>
                            <div className="input-group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="newPassword"
                                    id="newPassword"
                                    className="form-control"
                                    placeholder="请输入新密码"
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
                        </div>
                        <div className="mb-3">
                            <label htmlFor="confirmPassword" className="form-label">确认密码</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="confirmPassword"
                                id="confirmPassword"
                                className="form-control"
                                placeholder="请再次输入新密码"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                            {loading ? '重置中...' : '重置密码'}
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
                <h2>密码重置</h2>
                {error && <div className="alert alert-danger">{error}</div>}
                
                {renderForm()}
                
                <p className="text-center mt-3">
                    <a href="/login" className="text-decoration-none">返回登录</a>
                </p>
            </div>

            <div className="login-image">
                <img src={banner} alt="banner" style={{ width: "500px", height: "auto" }} />
            </div>
        </div>
    );
};

export default PasswordResetPage;