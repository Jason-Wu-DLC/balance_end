import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import StatsCard from "../components/StatsCard";
import UserActivityChart from "../components/UserActivityChart";
import ModuleCompletionChart from "../components/ModuleCompletionChart";
import ModuleTimeChart from "../components/ModuleTimeChart";
import axios from "axios";
import "./DashboardPage.css";


const DashboardPage = () => {
    const [userActivityData, setUserActivityData] = useState([]);
    const [moduleProgressData, setModuleProgressData] = useState([]);
    const [moduleTimeData, setModuleTimeData] = useState([]);

    useEffect(() => {
        axios.get("/api/dashboard-data").then(response => {
            setUserActivityData(response.data.userActivity);
            setModuleProgressData(response.data.moduleProgress);
            setModuleTimeData(response.data.moduleTime);
        }).catch(error => console.error("Error fetching dashboard data:", error));
    }, []);

    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="main-content">
                <div className="top-cards">
                    <StatsCard title="Active User" value="17" icon="bi-heart-fill" />
                    <StatsCard title="Average Usage Time" value="120 Minutes" icon="bi-clock" />
                    <StatsCard title="Feedback Messages" value="12+" icon="bi-chat-left-text" />
                </div>
                <div className="charts">
                    <UserActivityChart data={userActivityData} />
                    <ModuleCompletionChart data={moduleProgressData} />
                </div>
                <div className="charts">
                    <ModuleTimeChart data={moduleTimeData} />
                </div>
                <div className="charts">
                    <TopreviewChart data={moduleTimeData} />
                </div>
            </main>
        </div>
    );
};

export default DashboardPage;
