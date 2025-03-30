import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
        verificationCode: '',
        terms: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [verificationSent, setVerificationSent] = useState(false);
    const [verificationLoading, setVerificationLoading] = useState(false);

    // 处理表单数据变化
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    // 发送验证码
    const sendVerificationCode = async () => {
        if (!formData.email) {
            setError('请输入有效的邮箱地址');
            return;
        }
        
        setVerificationLoading(true);
        try {
            const response = await axios.post('/api/send-verification-code/', {
                email: formData.email
            });
            
            if (response.data.success) {
                setVerificationSent(true);
                setError('');
            }
        } catch (err) {
            setError(err.response?.data?.error || '发送验证码失败，请稍后重试');
        } finally {
            setVerificationLoading(false);
        }
    };

    // 处理表单提交
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('/api/signup/', {
                fullname: formData.fullname,
                email: formData.email,
                password: formData.password,
                verification_code: formData.verificationCode
            });

            if (response.data.message === 'Signup successful, email sent!') {
                alert('注册成功! 已发送确认邮件到您的邮箱，请查收');
                navigate('/dashboard'); // 跳转到仪表盘
            }
        } catch (err) {
            setError(err.response?.data?.error || '注册失败，请检查表单信息');
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
                <h2>注册新账号</h2>
                {error && <div className="alert alert-danger">{error}</div>}
                <form onSubmit={handleSubmit}>
                    {/* 姓名 */}
                    <div className="mb-3">
                        <label htmlFor="fullname" className="form-label">姓名</label>
                        <input
                            type="text"
                            className="form-control"
                            id="fullname"
                            name="fullname"
                            placeholder="请输入您的姓名"
                            required
                            value={formData.fullname}
                            onChange={handleChange}
                        />
                    </div>

                    {/* 邮箱地址 */}
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">邮箱地址</label>
                        <div className="input-group">
                            <input
                                type="email"
                                className="form-control"
                                id="email"
                                name="email"
                                placeholder="example@gmail.com"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                disabled={verificationSent}
                            />
                            <button
                                type="button"
                                className="btn btn-outline-primary"
                                onClick={sendVerificationCode}
                                disabled={verificationLoading || verificationSent}
                            >
                                {verificationLoading ? '发送中...' : verificationSent ? '已发送' : '获取验证码'}
                            </button>
                        </div>
                    </div>

                    {/* 验证码 */}
                    <div className="mb-3">
                        <label htmlFor="verificationCode" className="form-label">验证码</label>
                        <input
                            type="text"
                            className="form-control"
                            id="verificationCode"
                            name="verificationCode"
                            placeholder="请输入邮箱收到的验证码"
                            required
                            value={formData.verificationCode}
                            onChange={handleChange}
                        />
                    </div>

                    {/* 密码 */}
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">密码</label>
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

                    {/* 服务条款 */}
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
                            我已阅读并同意 <a href="#" className="terms-link">服务条款</a> 和 <a href="#" className="terms-link">隐私政策</a>
                        </label>
                    </div>

                    {/* 提交按钮 */}
                    <button type="submit" className="btn btn-primary w-100" disabled={loading || !verificationSent}>
                        {loading ? '注册中...' : '创建账号'}
                    </button>
                </form>

                {/* 已有账号 */}
                <p className="text-center mt-3">
                    已有账号? <a href="/login" className="text-decoration-none">登录</a>
                </p>
            </div>

            <div className="login-image">
                <img src={banner} alt="banner" style={{ width: '500px', height: 'auto' }} />
            </div>
        </div>
    );
};

export default SignupPage;