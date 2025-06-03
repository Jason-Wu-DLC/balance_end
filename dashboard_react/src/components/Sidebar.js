// Update Sidebar.js
import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import logo from '../assets/logo/logo.png';
import { 
  FaTachometerAlt, 
  FaChartBar, 
  FaUsers, 
  FaBullseye, 
  FaSearch, 
  FaFileAlt, 
  FaCog, 
  FaSignOutAlt, 
  FaGraduationCap, 
  FaHeadset,
  FaBars,
  FaTimes 
} from 'react-icons/fa';
import { logoutUser } from "../api/requests";
import SupportRequestModal from "./SupportRequestModal";

const Sidebar = () => {
    const [user, setUser] = useState(null);
    const [showSupportModal, setShowSupportModal] = useState(false);
    const [sidebarExpanded, setSidebarExpanded] = useState(false); // Track sidebar state
    const navigate = useNavigate();
    
    useEffect(() => {
        // Get user info
        axios.get("api/user-info/").then(response => {
            setUser(response.data);
        }).catch(error => {
            console.error("Error fetching user data:", error);
        });

        // Check screen size on mount and close sidebar on small screens by default
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setSidebarExpanded(false);
            } else {
                setSidebarExpanded(true);
            }
        };

        // Set initial state
        handleResize();

        // Add resize listener
        window.addEventListener('resize', handleResize);
        
        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);
    
    // Handle logout
    const handleLogout = async () => {
        try {
            await logoutUser();
            // Clear any user data in local storage if needed
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            // Redirect to login page
            window.location.href = '/login/';
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    // Open support modal
    const openSupportModal = () => {
        setShowSupportModal(true);
        // Close sidebar on mobile after action
        if (window.innerWidth < 768) {
            setSidebarExpanded(false);
        }
    };

    // Close support modal
    const closeSupportModal = () => {
        setShowSupportModal(false);
    };

    // Handle successful support request submission
    const handleSupportSuccess = (result) => {
        // Display a success message
        alert("Your support request has been submitted successfully. We'll respond as soon as possible.");
    };

    // Toggle sidebar
    const toggleSidebar = () => {
        setSidebarExpanded(!sidebarExpanded);
    };

    // Close sidebar when clicking a nav link on mobile
    const handleNavClick = () => {
        if (window.innerWidth < 768) {
            setSidebarExpanded(false);
        }
    };
    
    return (
        <>
            {/* Mobile Toggle Button */}
            <button 
                className="sidebar-toggle" 
                onClick={toggleSidebar} 
                aria-label="Toggle Sidebar"
            >
                {sidebarExpanded ? <FaTimes /> : <FaBars />}
            </button>

            {/* Overlay for mobile when sidebar is open */}
            {sidebarExpanded && window.innerWidth < 768 && (
                <div 
                    className="sidebar-overlay" 
                    onClick={() => setSidebarExpanded(false)}
                ></div>
            )}

            <aside className={`sidebar ${sidebarExpanded ? 'expanded' : 'collapsed'}`}>
                <div className="sidebar-header">
                    <img src={logo} alt="Balance Logo" className="sidebar-logo" />
                </div>
                <nav className="sidebar-nav">
                    <NavLink to="/dashboard" className={({isActive}) => isActive ? "nav-item active" : "nav-item"} onClick={handleNavClick}>
                        <FaTachometerAlt className="nav-icon" /> <span className="nav-text">Dashboard</span>
                    </NavLink>
                    <NavLink to="/user-comment" className={({isActive}) => isActive ? "nav-item active" : "nav-item"} onClick={handleNavClick}>
                        <FaChartBar className="nav-icon" /> <span className="nav-text">User Comment</span>
                    </NavLink>
                    <NavLink to="/user-progress" className={({isActive}) => isActive ? "nav-item active" : "nav-item"} onClick={handleNavClick}>
                        <FaUsers className="nav-icon" /> <span className="nav-text">User Engagement</span>
                    </NavLink>
                    <NavLink to="/course-progress" className={({isActive}) => isActive ? "nav-item active" : "nav-item"} onClick={handleNavClick}>
                        <FaGraduationCap className="nav-icon" /> <span className="nav-text">Course Progress</span>
                    </NavLink>
                    <NavLink to="/settings" className={({isActive}) => isActive ? "nav-item active" : "nav-item"} onClick={handleNavClick}>
                        <FaCog className="nav-icon" /> <span className="nav-text">Settings</span>
                    </NavLink>
                </nav>
                <div className="sidebar-footer">
                    <button className="btn btn-primary mb-3 w-100" onClick={openSupportModal}>
                        <FaHeadset className="me-2" /> <span className="btn-text">Request IT Support</span>
                    </button>
                    {user && (
                        <div className="user-info mb-3">
                            <div className="user-details">
                                <p className="user-name">{user.name}</p>
                                <small className="user-role">{user.role}</small>
                            </div>
                        </div>
                    )}
                    <button onClick={handleLogout} className="btn btn-outline-danger w-100">
                        <FaSignOutAlt className="me-2" /> <span className="btn-text">Logout</span>
                    </button>
                </div>
            </aside>
            
            {/* Support Request Modal */}
            <SupportRequestModal 
                show={showSupportModal} 
                onClose={closeSupportModal} 
                onSuccess={handleSupportSuccess}
            />
        </>
    );
};

export default Sidebar;