import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

import ReactWordcloud from "react-wordcloud";
import moment from "moment";
import apiClient from "../api/axios";

// Define color schemes
const COLORS = [
  "#FF6B6B", // red
  "#4ECDC4", // turquoise
  "#45B7D1", // blue
  "#9370DB", // purple
  "#FFD166", // yellow
  "#06D6A0", // green
  "#FF9F1C", // orange
  "#E76F51", // coral
  "#3D5A80", // navy
  "#F4A261", // peach
  "#2A9D8F", // teal
  "#A8DADC", // light blue
  "#8D99AE", // gray-blue
];

const UserPostAnalysis = ({ userId }) => {
  const [postData, setPostData] = useState({
    activity: [],
    modules: [],
    wordCloud: [],
  });
  const [dateRange, setDateRange] = useState([
    moment().subtract(30, "days"),
    moment(),
  ]);
  const [interval, setInterval] = useState("day");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Word cloud options
  const wordcloudOptions = {
    colors: COLORS,
    enableTooltip: true,
    deterministic: false,
    fontFamily: "Arial",
    fontSizes: [16, 60],
    fontStyle: "normal",
    fontWeight: "normal",
    padding: 1,
    rotations: 3,
    rotationAngles: [0, 90],
    scale: "linear",
    spiral: "archimedean",
    transitionDuration: 1000,
  };

  useEffect(() => {
    // Only fetch if we have userId and valid dateRange
    if (!userId || !dateRange[0] || !dateRange[1]) return;

    const fetchPostAnalysis = async () => {
      try {
        setLoading(true);

        const startDate = dateRange[0].format("YYYY-MM-DD");
        const endDate = dateRange[1].format("YYYY-MM-DD");

        const response = await apiClient.get("user-posts-analysis/", {
          params: {
            user_id: userId, // Add userId to request
            interval,
            start_date: startDate,
            end_date: endDate,
          },
        });

        setPostData(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching post analysis data:", err);
        setError("Failed to load post analysis data");
      } finally {
        setLoading(false);
      }
    };

    fetchPostAnalysis();
  }, [userId, dateRange, interval]); // Add userId as dependency

  // Format date for display
  const formatDate = (date) => {
    if (!date) return "";
    try {
      if (typeof date === "string") {
        return moment(date).format("YYYY-MM-DD");
      }
      return moment(date).format("YYYY-MM-DD");
    } catch {
      return date;
    }
  };

  // Helper function to check if data array is empty
  const hasData = (dataArray) => {
    return Array.isArray(dataArray) && dataArray.length > 0;
  };

  return (
    <div className="card chart-card post-analysis-card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <span>Post Activity Analysis</span>
        <div className="chart-controls">
          <div className="control-group">
            <div className="btn-group" role="group">
              <button
                type="button"
                className={`btn ${
                  interval === "day" ? "btn-primary" : "btn-outline-primary"
                }`}
                onClick={() => setInterval("day")}
              >
                Day
              </button>
              <button
                type="button"
                className={`btn ${
                  interval === "week" ? "btn-primary" : "btn-outline-primary"
                }`}
                onClick={() => setInterval("week")}
              >
                Week
              </button>
              <button
                type="button"
                className={`btn ${
                  interval === "month" ? "btn-primary" : "btn-outline-primary"
                }`}
                onClick={() => setInterval("month")}
              >
                Month
              </button>
            </div>
          </div>
          <div className="control-group ms-2">
            <div className="date-picker d-flex">
              <input
                type="date"
                className="form-control date-picker-input"
                value={dateRange[0].format("YYYY-MM-DD")}
                onChange={(e) =>
                  setDateRange([moment(e.target.value), dateRange[1]])
                }
              />
              <span className="mx-2">to</span>
              <input
                type="date"
                className="form-control date-picker-input"
                value={dateRange[1].format("YYYY-MM-DD")}
                onChange={(e) =>
                  setDateRange([dateRange[0], moment(e.target.value)])
                }
              />
            </div>
          </div>
        </div>
      </div>
      <div className="card-body">
        {!userId ? (
          <div className="alert alert-info">
            Please select a user to view post analysis
          </div>
        ) : loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading post analysis data...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : !hasData(postData.activity) && !hasData(postData.modules) ? (
          <div className="alert alert-info">
            No post data found for this user in the selected date range
          </div>
        ) : (
          <>
            <div className="row">
              <div className="col col-24">
                <h4 className="chart-title">Post Activity Trend</h4>
                {!hasData(postData.activity) ? (
                  <div className="alert alert-info">
                    No activity data available
                  </div>
                ) : (
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={postData.activity.map((item) => ({
                          ...item,
                          date: formatDate(item.date),
                        }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="count"
                          name="Post Count"
                          stroke="var(--chart-color-1)"
                          activeDot={{ r: 8 }}
                          animationDuration={1500}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            <hr className="divider" />

            <div className="row">
              <div className="col col-md-6">
                <h4 className="chart-title">Module Distribution</h4>
                {!hasData(postData.modules) ? (
                  <div className="alert alert-info">
                    No module data available
                  </div>
                ) : (
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={postData.modules}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="module" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" name="Post Count">
                          {postData.modules.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
              <div className="col col-md-6">
                <h4 className="chart-title">Word Cloud</h4>
                {!hasData(postData.wordCloud) ? (
                  <div className="alert alert-info">No word data available</div>
                ) : (
                  <div className="wordcloud-container">
                    <ReactWordcloud
                      words={postData.wordCloud.map(([text, value]) => ({
                        text,
                        value,
                      }))}
                      options={wordcloudOptions}
                    />
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserPostAnalysis;
