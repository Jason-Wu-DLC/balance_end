import React from "react";
import "./StatsCard.css";

const StatsCard = ({ title, value, icon }) => {
    return (
        <div className="card">
            <i className={`bi ${icon} stats-icon`}></i>
            <h3>{title}</h3>
            <p>{value}</p>
        </div>
    );
};

export default StatsCard;
