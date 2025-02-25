import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom"; // 使用 NavLink 实现动态高亮
import axios from "axios";
import "./Sidebar.css";
import logo from '../assets/logo/logo.png';
import { FaTachometerAlt, FaChartBar, FaUsers, FaBullseye, FaSearch, FaFileAlt, FaCog } from 'react-icons/fa';

const Sidebar = () => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        // 获取用户信息
        axios.get("/api/user-info").then(response => {
            setUser(response.data);
        }).catch(error => {
            console.error("Error fetching user data:", error);
        });
    }, []);

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <img src={logo} alt="Balance Logo" className="sidebar-logo" />
            </div>
            <nav className="sidebar-nav">
                <NavLink to="/dashboard" className="nav-item" activeClassName="active">
                    <FaTachometerAlt className="nav-icon" /> Dashboard
                </NavLink>
                <NavLink to="/module-usage" className="nav-item" activeClassName="active">
                    <FaChartBar className="nav-icon" /> Module Usage
                </NavLink>
                <NavLink to="/traffic-analytics" className="nav-item" activeClassName="active">
                    <FaUsers className="nav-icon" /> Traffic Analytics
                </NavLink>
                <NavLink to="/user-progress" className="nav-item" activeClassName="active">
                    <FaBullseye className="nav-icon" /> User Progress
                </NavLink>
                <NavLink to="/wellbeing-goals" className="nav-item" activeClassName="active">
                    <FaSearch className="nav-icon" /> Wellbeing Goals
                </NavLink>
                <NavLink to="/feedback" className="nav-item" activeClassName="active">
                    <FaFileAlt className="nav-icon" /> Search & Feedback
                </NavLink>
                <NavLink to="/reports" className="nav-item" activeClassName="active">
                    <FaFileAlt className="nav-icon" /> Reports
                </NavLink>
                <NavLink to="/settings" className="nav-item" activeClassName="active">
                    <FaCog className="nav-icon" /> Settings
                </NavLink>
            </nav>
            <div className="sidebar-footer">
                <button className="support-button">Request IT Support</button>
                {user && (
                    <div className="user-info">
                        <img src={user.avatar || "/user.png"} alt="User Avatar" className="user-avatar" />
                        <div className="user-details">
                            <p className="user-name">{user.name}</p>
                            <small className="user-role">{user.role}</small>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
