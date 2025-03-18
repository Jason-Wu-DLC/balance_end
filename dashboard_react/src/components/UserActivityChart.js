
import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Select } from "antd";

const { Option } = Select;

const UserActivityChart = ({ data }) => {
    // 默认时间范围为 "Last 7 Days"
    const [timeRange, setTimeRange] = useState("7");

    // 过滤数据
    const filteredData = data.filter(item => item.days <= parseInt(timeRange));

    return (
        <div className="chart">
            <h3>User Activity Trends</h3>
            
            {/* 筛选时间范围 */}
            <Select defaultValue="7" style={{ width: 120, marginBottom: "10px" }} onChange={value => setTimeRange(value)}>
                <Option value="7">Last 7 Days</Option>
                <Option value="30">Last 30 Days</Option>
                <Option value="90">Last 90 Days</Option>
            </Select>

            {/* 交互式折线图 */}
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={filteredData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="active" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default UserActivityChart;
