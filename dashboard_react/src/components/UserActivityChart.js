import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import moment from "moment";
import apiClient from '../api/axios';

const DEFAULT_START_DATE = moment("2023-01-01");
const DEFAULT_END_DATE = moment();

const UserActivityChart = () => {
    const [chartData, setChartData] = useState([]);
    const [interval, setInterval] = useState("day");
    const [dateRange, setDateRange] = useState([DEFAULT_START_DATE, DEFAULT_END_DATE]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        fetchData();
    }, [interval, dateRange]);
    
    const fetchData = async () => {
        if (!dateRange[0] || !dateRange[1]) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const startDate = dateRange[0].format("YYYY-MM-DD");
            const endDate = dateRange[1].format("YYYY-MM-DD");
            
            const response = await apiClient.get('user-activity-trends/', {
                params: {
                    interval,
                    start_date: startDate,
                    end_date: endDate
                }
            });
            
            // 确保数据是数组
            const data = Array.isArray(response.data) ? response.data : [];
            
            // 数据清理和验证
            const processedData = data.map(item => ({
                date: item.date || '',
                newUsers: item.newUsers || 0,
                activeUsers: item.activeUsers || 0
            }));
            
            setChartData(processedData);
        } catch (err) {
            console.error("Failed to fetch user activity data:", err);
            
            // 详细的错误处理
            const errorMessage = err.response?.data?.error || 
                                 err.message || 
                                 "Unknown error occurred";
            
            setError(`Data loading failed: ${errorMessage}`);
            setChartData([]);
        } finally {
            setLoading(false);
        }
    };
    const getXAxisInterval = () => {
        const totalPoints = chartData.length;
        if (totalPoints < 10) return 0;        // 少于10个点，全显示
        if (totalPoints < 30) return 1;        // 每隔一个显示
        if (totalPoints < 60) return 3;        // 每隔三个显示
        if (totalPoints < 120) return 5;
        return Math.floor(totalPoints / 10);   // 最多10个 label
    };
    // Handle interval change
    const handleIntervalChange = (e) => {
        setInterval(e.target.value);
    };
    
    // Handle date range change
    const handleDateRangeChange = (e, index) => {
        const newDate = moment(e.target.value);
        if (newDate.isValid()) {
            // Ensure dates are within reasonable range
            const datesCopy = [...dateRange];
            
            if (index === 0) {
                // Start date
                const start = moment.max(newDate, moment("2020-01-01")); // Not earlier than 2020
                datesCopy[0] = start;
            } else {
                // End date
                const end = moment.min(newDate, moment()); // Not later than today
                datesCopy[1] = end;
            }
            
            setDateRange(datesCopy);
        }
    };
    
    // Format X-axis date display
    const formatXAxisDate = (date) => {
        if (!date) return "";
        
        const formatDate = moment(date);
        if (!formatDate.isValid()) return date;
        
        if (interval === 'day') {
            return formatDate.format('MM-DD');
        } else if (interval === 'week') {
            return formatDate.format('MM-DD');
        } else if (interval === 'month') {
            return formatDate.format('YYYY-MM');
        } else { // year
            return formatDate.format('YYYY');
        }
    };
    
    // Custom tooltip display
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const formatDate = moment(label);
            let dateLabel = label;
            
            if (formatDate.isValid()) {
                if (interval === 'day') {
                    dateLabel = formatDate.format('MMMM D, YYYY');
                } else if (interval === 'week') {
                    dateLabel = `${formatDate.format('MMMM D, YYYY')} (Week ${formatDate.format('w')})`;
                } else if (interval === 'month') {
                    dateLabel = formatDate.format('MMMM YYYY');
                } else { // year
                    dateLabel = formatDate.format('YYYY');
                }
            }
            
            return (
                <div className="dashboard-custom-tooltip">
                    <p className="label">{`Date: ${dateLabel}`}</p>
                    {payload.map((entry, index) => (
                        <p key={`item-${index}`} className="desc" style={{ color: entry.color }}>
                            {`${entry.name}: ${entry.value}`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };
    
    // Render the chart or an empty state
    const renderChart = () => {
        if (chartData.length === 0) {
            return (
                <div className="empty-chart">
                    <div className="empty-message">
                        {error ? "No data available due to error" : "No data available for selected criteria"}
                    </div>
                </div>
            );
        }
        
        return (
            <ResponsiveContainer width="100%" height={400}>
                <LineChart
                    data={chartData}
                    margin={{
                        top: 50,
                        right: 30,
                        left: 20,
                        bottom: 80
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                    dataKey="date" 
                    tickFormatter={formatXAxisDate}
                    angle={-45} 
                    textAnchor="end"
                    height={80} 
                    interval="getXAxisInterval()" 
                    />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    
                    <Line
                        type="monotone"
                        dataKey="newUsers"
                        name="New Users"
                        stroke="var(--chart-color-1)"
                        fill="var(--chart-color-1)"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                    />
                    
                    <Line
                        type="monotone"
                        dataKey="activeUsers"
                        name="Active Users"
                        stroke="var(--chart-color-2)"
                        fill="var(--chart-color-2)"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        );
    };
    
    // Adjust the retry mechanism
    const handleRetry = () => {
        fetchData(); // Retry fetching data
    };
    
    return (
        <div className="card chart-card">
            <div className="card-header">User Activity Trends</div>
            <div className="card-body">
                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Loading data...</p>
                    </div>
                ) : (
                    <>
                        {error && (
                            <div className="alert alert-danger mb-4">
                                <h5 className="alert-heading">Data Loading Error</h5>
                                <p>{error}</p>
                                <div className="mt-2">
                                    <button className="btn btn-sm btn-outline-danger" onClick={handleRetry}>
                                        Retry
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        <div className="chart-controls">
                            <div className="control-group">
                                <span className="control-label">Time Interval:</span>
                                <select
                                    className="form-select"
                                    value={interval}
                                    onChange={handleIntervalChange}
                                    style={{ width: 120 }}
                                >
                                    <option value="day">Daily</option>
                                    <option value="week">Weekly</option>
                                    <option value="month">Monthly</option>
                                    <option value="year">Yearly</option>
                                </select>
                            </div>
                            
                            <div className="control-group">
                                <span className="control-label">Date Range:</span>
                                <div className="date-picker d-flex align-items-center">
                                    <input
                                        type="date"
                                        className="form-control date-picker-input"
                                        value={dateRange[0].format("YYYY-MM-DD")}
                                        onChange={(e) => handleDateRangeChange(e, 0)}
                                    />
                                    <span className="mx-2">to</span>
                                    <input
                                        type="date"
                                        className="form-control date-picker-input"
                                        value={dateRange[1].format("YYYY-MM-DD")}
                                        onChange={(e) => handleDateRangeChange(e, 1)}
                                        max={moment().format("YYYY-MM-DD")}
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <hr className="divider my-3" />
                        
                        <div className="chart-container">
                            {renderChart()}
                        </div>
                        
                        <div className="chart-info text-center text-muted mt-3">
                            <p>
                                Viewing {interval === 'day' ? 'daily' : 
                                        interval === 'week' ? 'weekly' : 
                                        interval === 'month' ? 'monthly' : 'yearly'} data from 
                                {dateRange[0]?.format(' MMMM D, YYYY')} to
                                {dateRange[1]?.format(' MMMM D, YYYY')}
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default UserActivityChart;