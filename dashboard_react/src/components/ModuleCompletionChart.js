import React from "react";
import { PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#0088FE", "#FFBB28", "#FF8042"];

const ModuleCompletionChart = ({ data }) => {
    return (
        <div className="chart">
            <h3>Completion Progress of Each Module</h3>
            <PieChart width={400} height={300}>
                <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Legend />
            </PieChart>
        </div>
    );
};

export default ModuleCompletionChart;
