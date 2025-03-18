import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Select } from "antd";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];
const { Option } = Select;

const ModuleCompletionChart = ({ data }) => {
    // 默认显示所有模块
    const [selectedModule, setSelectedModule] = useState("all");

    // 筛选数据
    const filteredData = selectedModule === "all" ? data : data.filter(item => item.module === selectedModule);

    return (
        <div className="chart">
            <h3>Module Completion Progress</h3>
            
            {/* 模块筛选器 */}
            <Select defaultValue="all" style={{ width: 180, marginBottom: "10px" }} onChange={value => setSelectedModule(value)}>
                <Option value="all">All Modules</Option>
                {data.map((item, index) => (
                    <Option key={index} value={item.module}>{item.module}</Option>
                ))}
            </Select>

            {/* 交互式饼图 */}
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie data={filteredData} dataKey="value" nameKey="module" cx="50%" cy="50%" outerRadius={100} label>
                        {filteredData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ModuleCompletionChart;
