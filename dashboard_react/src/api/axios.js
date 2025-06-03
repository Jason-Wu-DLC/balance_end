// 更新 axios.js 文件
import axios from "axios";
import API_BASE_URL from "./config";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // 确保发送 cookies
});

// 添加请求拦截器来设置 CSRF token
apiClient.interceptors.request.use(
  function(config) {
    if (config.method !== 'get') {
      // 从 cookie 中提取 CSRF token
      const csrfToken = document.cookie
        .split(';')
        .map(cookie => cookie.trim())
        .find(cookie => cookie.startsWith('csrftoken='));
        
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken.split('=')[1];
      }
    }
    return config;
  },
  function(error) {
    return Promise.reject(error);
  }
);

export default apiClient;