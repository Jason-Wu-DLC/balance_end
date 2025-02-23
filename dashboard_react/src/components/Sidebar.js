import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Sidebar.css";
import logo from '../assets/logo/logo.png';

const Sidebar = () => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        // 发送请求获取用户信息
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
                <a href="#" className="nav-item active">Dashboard</a>
                <a href="#" className="nav-item">Module Usage</a>
                <a href="#" className="nav-item">Traffic Analytics</a>
                <a href="#" className="nav-item">User Progress</a>
                <a href="#" className="nav-item">Wellbeing Goals</a>
                <a href="#" className="nav-item">Search & Feedback</a>
                <a href="#" className="nav-item">Reports</a>
                <a href="#" className="nav-item">Settings</a>
            </nav>
            <div className="sidebar-footer">
                <button className="support-button">Request IT Support</button>
                {user && (
                    <div className="user-info">
                        <img src={user.avatar || "/user.png"} alt="User Avatar" className="user-avatar" />
                        <p>{user.name}</p>
                        <small>{user.role}</small>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
