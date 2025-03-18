import apiClient from "./axios";

// 获取活跃用户数
export const fetchActiveUsers = async () => {
    try {
        const response = await apiClient.get("active-users/");
        return response.data.active_users;
    } catch (error) {
        console.error("Error fetching active users:", error);
        return 0;
    }
};

// 获取平均使用时间
export const fetchAverageUsageTime = async () => {
    try {
        const response = await apiClient.get("average-usage-time/");
        return response.data.average_usage_time;
    } catch (error) {
        console.error("Error fetching average usage time:", error);
        return 0;
    }
};

// 获取反馈消息数量
export const fetchFeedbackCount = async () => {
    try {
        const response = await apiClient.get("feedback-count/");
        return response.data.feedback_count;
    } catch (error) {
        console.error("Error fetching feedback count:", error);
        return 0;
    }
};

// 获取用户信息
export const fetchUserInfo = async () => {
    try {
        const response = await apiClient.get("user-info/");
        return response.data;
    } catch (error) {
        console.error("Error fetching user info:", error);
        return null;
    }
};
