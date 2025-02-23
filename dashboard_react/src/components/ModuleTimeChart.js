import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const ModuleTimeChart = ({ data }) => {
    return (
        <div className="chart">
            <h3>Average Time Spent per Module</h3>
            <BarChart width={600} height={300} data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="module" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="session" fill="#82ca9d" />
            </BarChart>
        </div>
    );
};

export default ModuleTimeChart;
