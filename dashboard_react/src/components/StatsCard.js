import React from "react";

const StatsCard = ({ title, value, icon }) => {
  return (
    <div className="stats-card">
      <div className="stats-icon">
        <i className={icon}></i>
      </div>
      <h3 className="stats-title">{title}</h3>
      <p className="stats-value">{value}</p>
    </div>
  );
};

export default StatsCard;