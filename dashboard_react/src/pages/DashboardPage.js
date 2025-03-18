import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import StatsCard from "../components/StatsCard";
import UserActivityChart from "../components/UserActivityChart";
import ModuleCompletionChart from "../components/ModuleCompletionChart";
import ModuleTimeChart from "../components/ModuleTimeChart";
import { fetchActiveUsers, fetchAverageUsageTime, fetchFeedbackCount } from "../api/requests";
import "./DashboardPage.css";


const DashboardPage = () => {
    const [activeUsers, setActiveUsers] = useState(0);
    const [averageUsageTime, setAverageUsageTime] = useState(0);
    const [feedbackCount, setFeedbackCount] = useState(0);
    const [userActivityData, setUserActivityData] = useState([]);
    const [moduleProgressData, setModuleProgressData] = useState([]);
    const [moduleTimeData, setModuleTimeData] = useState([]);

   // **调用 API 获取数据**
    useEffect(() => {
    fetchActiveUsers().then(setActiveUsers);
    fetchAverageUsageTime().then(setAverageUsageTime);
    fetchFeedbackCount().then(setFeedbackCount);

    // 其他 API 端点
    fetch("/api/dashboard-data")
        .then(response => response.json())
        .then(data => {
            setUserActivityData(data.userActivity);
            setModuleProgressData(data.moduleProgress);
            setModuleTimeData(data.moduleTime);
        })
        .catch(error => console.error("Error fetching dashboard data:", error));
}, []);


    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="main-content">
            <div className="top-cards">
                    <StatsCard title="Active Users" value={activeUsers} icon="bi-heart-fill" />
                    <StatsCard title="Average Usage Time" value={`${averageUsageTime} mins`} icon="bi-clock" />
                    <StatsCard title="Feedback Messages" value={feedbackCount} icon="bi-chat-left-text" />
                </div>
                <div className="charts">
                    <UserActivityChart data={userActivityData} />
                    <ModuleCompletionChart data={moduleProgressData} />
                </div>
                <div className="charts">
                    <ModuleTimeChart data={moduleTimeData} />
                </div>
            </main>
        </div>
    );
};

export default DashboardPage;
