import React from 'react';
import './LoginPage.css';
import logo from '../assets/logo/logo.png';
import banner from '../assets/logo/banner.jpg';
import 'bootstrap/dist/css/bootstrap.min.css'; // 引入 Bootstrap CSS
import 'bootstrap-icons/font/bootstrap-icons.css'; // 引入 Bootstrap 图标

const LoginPage = () => {
    return (
        <div className="login-container">
            {/* 左侧表单 */}
            <div className="login-form">
                <div className="text-center mb-4">
                    <img
                        src={logo}
                        alt="Logo"
                        className="img-fluid"
                        style={{ maxWidth: "300pxlogo", height: "auto" }}
                    />
                </div>
                <h2>Log In</h2>
                {/* Google 登录 */}
                <a
                    href="/auth/google"
                    className="btn btn-outline-secondary w-100 mb-3"
                >
                    <img
                        src="https://img.icons8.com/color/24/google-logo.png"
                        alt="Google Logo"
                        className="me-2"
                    />
                    Log in with Google
                </a>

                {/* 分隔线 */}
                <div className="login-options">
                    <hr />
                    <span>Or</span>
                    <hr />
                </div>

                {/* 邮箱和密码登录表单 */}
                <form method="post" action="/login">
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">
                            Email Address
                        </label>
                        <input
                            type="email"
                            name="username"
                            id="email"
                            className="form-control"
                            placeholder="example@gmail.com"
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">
                            Password
                        </label>
                        <div className="input-group">
                            <input
                                type="password"
                                name="password"
                                id="password"
                                className="form-control"
                                required
                            />
                            <button
                                className="btn btn-outline-secondary"
                                type="button"
                            >
                                <i className="bi bi-eye"></i>
                            </button>
                        </div>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <input
                                type="checkbox"
                                id="remember"
                                className="form-check-input"
                            />
                            <label
                                htmlFor="remember"
                                className="form-check-label"
                            >
                                Remember me
                            </label>
                        </div>
                        <button
                            className="btn btn-outline-secondary"
                            data-bs-toggle="modal"
                            data-bs-target="#recoverModal"
                        >
                            Reset Password?
                        </button>
                    </div>
                    <button type="submit" className="btn btn-primary w-100">
                        Log In
                    </button>
                </form>
                <p className="text-center mt-3">
                    Don't have an account yet?{" "}
                    <a href="/signup/" className="text-decoration-none">
                        New Account
                    </a>
                </p>
            </div>

            {/* Modal */}
            <div
                className="modal fade"
                id="recoverModal"
                tabIndex="-1"
                aria-labelledby="recoverModalLabel"
                aria-hidden="true"
            >
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <img
                                src={logo}
                                alt="Logo"
                                className="img-fluid"
                                style={{ maxWidth: "300px", height: "auto" }}
                            />
                        </div>
                        <div className="modal-body">
                            <h5>Recover</h5>
                            <form
                                id="recover-form"
                                method="POST"
                                action="/password_reset"
                            >
                                <div className="mb-4">
                                    <label
                                        htmlFor="email"
                                        className="form-label"
                                    >
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        id="email"
                                        name="email"
                                        placeholder="example@gmail.com"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="btn btn-primary w-100"
                                >
                                    Reset Your Password
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* 右侧图片 */}
            <div className="login-image">
                <img
                    src={banner}
                    alt="banner"
                    style={{ width: "500px", height: "auto" }}
                />
            </div>
        </div>
    );
};

export default LoginPage;
