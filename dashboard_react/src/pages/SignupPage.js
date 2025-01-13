import React, { useState } from 'react';
import './SignupPage.css';
import logo from '../assets/logo/logo.png';
import banner from '../assets/logo/banner.jpg';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const SignupPage = () => {
    const [formData, setFormData] = useState({
        fullname: '',
        email: '',
        invite_code: '',
        password: '',
        terms: false,
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form data submitted:', formData);
        fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        })
            .then((response) => response.json())
            .then((data) => console.log('Response:', data))
            .catch((error) => console.error('Error:', error));
    };

    return (
        <div className="login-container">
            <div className="login-form">
                <div className="text-center mb-4">
                    <img src={logo} alt="Logo" className="img-fluid" style={{ maxWidth: '300px', height: 'auto' }} />
                </div>
                <h2>Sign Up</h2>
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

                    {/* Invite Code */}
                    <div className="mb-3">
                        <label htmlFor="invite_code" className="form-label">Invite Code</label>
                        <input
                            type="text"
                            className="form-control"
                            id="invite_code"
                            name="invite_code"
                            placeholder="johnkevine4362"
                            value={formData.invite_code}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Password */}
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">Password</label>
                        <div className="input-group">
                            <input
                                type="password"
                                className="form-control"
                                id="password"
                                name="password"
                                placeholder="********"
                                required
                                value={formData.password}
                                onChange={handleChange}
                            />
                            <span className="input-group-text">
                                <i className="bi bi-eye-slash"></i>
                            </span>
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
                    <button type="submit" className="btn btn-primary w-100">Create account</button>
                </form>
            </div>
            <div className="login-image">
                <img src={banner} alt="banner" style={{ width: '500px', height: 'auto' }} />
            </div>
        </div>
    );
};

export default SignupPage;
