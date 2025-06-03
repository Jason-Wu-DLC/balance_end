import apiClient from "./axios";

export const loginUser = async (email, password) => {
    try {
        const response = await apiClient.post("login/", {
            username: email,
            password: password
        });
        
        // Store authentication token
        if (response.data && response.data.token) {
            localStorage.setItem('authToken', response.data.token);
            
            // Add authorization header for future requests
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        }
        
        // Store user data
        if (response.data && response.data.user) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        
        return response.data;
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
};

export const registerUser = async (userData) => {
    try {
        const response = await apiClient.post("signup/", userData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getSecurityQuestions = async (email) => {
    try {
        const response = await apiClient.post("password-reset/get-questions/", {
            email: email
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const verifySecurityAnswers = async (email, answer1, answer2) => {
    try {
        const response = await apiClient.post("password-reset/verify-answers/", {
            email: email,
            security_answer1: answer1,
            security_answer2: answer2
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const resetPassword = async (email, securityData, newPassword) => {
    try {
        const response = await apiClient.post("password-reset/reset/", {
            email: email,
            ...securityData,
            new_password: newPassword
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

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

export const fetchTotalNotes = async () => {
    try {
        const response = await apiClient.get("total-notes/");
        return response.data.TotalNotesStats; 
    } catch (error) {
        console.error("Error fetching", error);
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
        const token = localStorage.getItem('authToken/');
        let headers = {};
        
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        
        const response = await apiClient.get("user-info/", { headers });
        return response.data;
    } catch (error) {
        console.error("Error fetching user info:", error);
        return null;
    }
};

export const fetchUserActivityTrends = async (interval = 'day', startDate = null, endDate = null) => {
    try {
      const params = new URLSearchParams();
      params.append('interval', interval);
      
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      const response = await apiClient.get(`user-activity-trends/?${params.toString()}`);
      
      // 确保返回的是数组
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('获取用户活动趋势错误:', error);
      return [];
    }
  };

// 检查用户认证状态
export const checkAuthStatus = async () => {
    try {
        const response = await apiClient.get("check-auth/");
        return response.data;
    } catch (error) {
        console.error("Error checking authentication status:", error);
        return { isAuthenticated: false };
    }
};

// 用户登出
export const logoutUser = async () => {
    try {
        const response = await apiClient.post("logout/");
        // 清除本地存储的令牌
        localStorage.removeItem('authToken');
        return response.data;
    } catch (error) {
        console.error("Error during logout:", error);
        // 即使 API 调用失败，也清除本地令牌
        localStorage.removeItem('authToken');
        throw error;
    }
};



export const fetchNotesTextAnalysis = async () => {
    try {
        const response = await apiClient.get("notes/text-analysis/");
        return response.data;
    } catch (error) {
        console.error("Error fetching notes text analysis:", error);
        throw error;
    }
};

// 获取模块和笔记类型关系数据
export const fetchModelNoteRelationship = async () => {
    try {
        const response = await apiClient.get("notes/model-note-relationship/");
        return response.data;
    } catch (error) {
        console.error("Error fetching module-note relationship:", error);
        throw error;
    }
};

// 获取笔记上传趋势数据
export const fetchNoteUploadTrends = async (interval = 'day', startDate = null, endDate = null) => {
    try {
        // 构建查询参数
        const params = new URLSearchParams();
        if (interval) params.append('interval', interval);
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        
        const response = await apiClient.get(`notes/upload-trends/?${params.toString()}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching note upload trends:", error);
        throw error;
    }
};

// 获取模块笔记内容
export const fetchModuleNotesContent = async (module = '') => {
    try {
        const params = module ? `?module=${encodeURIComponent(module)}` : '';
        const response = await apiClient.get(`notes/module-notes-content/${params}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching module notes content:", error);
        throw error;
    }
};

export const fetchNotesStatistics = async () => {
    try {
      const response = await apiClient.get("notes/statistics/");
      return response.data;
    } catch (error) {
      console.error("Error fetching notes statistics:", error);
      return {
        total_notes: 0,
        module_count: 0,
        active_users: 0,
        avg_notes_per_user: 0
      };
    }
  };

// Fetch module completion status for a specific user
export const fetchModuleCompletionStatus = async (userId) => {
    try {
      const response = await apiClient.get('module-completion-status/', {
        params: { user_id: userId }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching module completion status:", error);
      throw error;
    }
  };
  
  // Fetch session activity for a specific user
export const fetchSessionActivity = async (userId, startDate, endDate) => {
    try {
      const response = await apiClient.get('session-activity/', {
        params: { 
          user_id: userId,
          start_date: startDate, 
          end_date: endDate 
        }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching session activity:", error);
      throw error;
    }
  };
  
  // Fetch user favorites for a specific user
export const fetchUserFavorites = async (userId) => {
    try {
      const response = await apiClient.get('user-favorites/', {
        params: { user_id: userId }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching user favorites:", error);
      throw error;
    }
  };
  
  // Fetch user posts analysis for a specific user
export const fetchUserPostsAnalysis = async (userId, interval, startDate, endDate) => {
    try {
      const response = await apiClient.get('user-posts-analysis/', {
        params: { 
          user_id: userId,
          interval, 
          start_date: startDate, 
          end_date: endDate 
        }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching user posts analysis:", error);
      throw error;
    }
  };

export const fetchWordPressUsers = async (page = 1, pageSize = 100) => {
    try {
      const response = await apiClient.get('wordpress-users/', {
        params: { page, page_size: pageSize }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching WordPress users:", error);
      return { users: [], total: 0 };
    }
  };

  export const fetchCourseProgressAnalysis = async () => {
    try {
      const response = await apiClient.get('course-progress-analysis/');
      return response.data;
    } catch (error) {
      console.error("Error fetching course progress analysis:", error);
      throw error;
    }
  };

// 用户配置文件设置API
export const getUserProfile = async () => {
  try {
    const response = await apiClient.get('user/profile/');
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};


export const changePassword = async (passwordData) => {
  try {
    const response = await apiClient.put('user/change-password/', passwordData);
    return response.data;
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};

export const getSecurityQuestionsSettings = async () => {
  try {
    const response = await apiClient.get('user/security-questions/');
    return response.data;
  } catch (error) {
    console.error('Error fetching security questions:', error);
    throw error;
  }
};

export const updateSecurityQuestions = async (questionsData) => {
  try {
    const response = await apiClient.put('user/security-questions/', questionsData);
    return response.data;
  } catch (error) {
    console.error('Error updating security questions:', error);
    throw error;
  }
};

// 界面偏好设置API
export const getUserPreferences = async () => {
  try {
    const response = await apiClient.get('user/preferences/');
    return response.data;
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    throw error;
  }
};

export const updateUserPreferences = async (preferencesData) => {
  try {
    const response = await apiClient.put('user/preferences/', preferencesData);
    return response.data;
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw error;
  }
};

// 系统设置API（仅管理员）
export const getUsersList = async (page = 1, pageSize = 10, search = '') => {
  try {
    const response = await apiClient.get('admin/users/', {
      params: { page, page_size: pageSize, search }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching users list:', error);
    throw error;
  }
};

export const getUserDetails = async (userId) => {
  try {
    const response = await apiClient.get(`admin/users/${userId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

export const updateUserDetails = async (userId, userData) => {
  try {
    const response = await apiClient.put(`admin/users/${userId}/`, userData);
    return response.data;
  } catch (error) {
    console.error('Error updating user details:', error);
    throw error;
  }
};

export const createUser = async (userData) => {
  try {
    const response = await apiClient.post('admin/users/create/', userData);
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const getSystemInfo = async () => {
  try {
    const response = await apiClient.get('admin/system/info/');
    return response.data;
  } catch (error) {
    console.error('Error fetching system info:', error);
    throw error;
  }
};

export const getSystemLogs = async (type = 'all', limit = 100, offset = 0) => {
  try {
    const response = await apiClient.get('admin/system/logs/', {
      params: { type, limit, offset }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching system logs:', error);
    throw error;
  }
};



export const fetchVisitDurationDistribution = async () => {
  try {
    const response = await apiClient.get('analytics/visit-duration/');
    return response.data;
  } catch (error) {
    console.error('Error fetching visit duration distribution:', error);
    throw error;
  }
};

// User Comment Page APIs
export const fetchCommentSourceAnalysis = async () => {
  try {
    const response = await apiClient.get('analytics/comment-sources/');
    return response.data;
  } catch (error) {
    console.error('Error fetching comment source analysis:', error);
    throw error;
  }
};

export const fetchCommentTimeDistribution = async () => {
  try {
    const response = await apiClient.get('analytics/comment-time-distribution/');
    return response.data;
  } catch (error) {
    console.error('Error fetching comment time distribution:', error);
    throw error;
  }
};

// User Engagement Page APIs
export const fetchVisitDepthAnalysis = async () => {
  try {
    const response = await apiClient.get('analytics/visit-depth/');
    return response.data;
  } catch (error) {
    console.error('Error fetching visit depth analysis:', error);
    throw error;
  }
};

export const fetchUserNavigationPaths = async (limit = 10) => {
  try {
    const response = await apiClient.get(`analytics/navigation-paths/?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user navigation paths:', error);
    throw error;
  }
};

// Course Progress Page APIs
export const fetchCourseCompletionFrequency = async () => {
  try {
    const response = await apiClient.get('analytics/course-completion-frequency/');
    return response.data;
  } catch (error) {
    console.error('Error fetching course completion vs frequency data:', error);
    throw error;
  }
};

export const fetchLearningTimeDistribution = async () => {
  try {
    const response = await apiClient.get('analytics/learning-time-distribution/');
    return response.data;
  } catch (error) {
    console.error('Error fetching learning time distribution:', error);
    throw error;
  }
};
// User Comment Page APIs
export const fetchCourseSourceAnalysis = async () => {
  try {
    const response = await apiClient.get('analytics/course-sources/');
    return response.data;
  } catch (error) {
    console.error('Error fetching course source analysis:', error);
    throw error;
  }
};
// Consolidated analytics data for dashboard
export const fetchAnalyticsSummary = async () => {
  try {
    // For demonstration purposes - in a real implementation, 
    // you might want to create a dedicated endpoint for this
    const [visitDurations] = await Promise.all([
      fetchVisitDurationDistribution()
    ]);
    
    return {
      visitDurations
    };
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    throw error;
  }
};

export const fetchVisitTrends = async (interval = 'day', startDate = null, endDate = null) => {
  try {
    // 构建查询参数
    const params = new URLSearchParams();
    params.append('interval', interval);
    
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await apiClient.get(`analytics/visit-trends/?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('trend:', error);
    throw error;
  }
};

// 获取热门内容数据
export const fetchPopularContent = async (metric = 'views', limit = 10) => {
  try {
    const response = await apiClient.get('analytics/popular-content/', {
      params: { 
        metric: metric,
        limit: limit
      }
    });
    return response.data;
  } catch (error) {
    console.error('polularcontent:', error);
    throw error;
  }
};


export const fetchUserContentInteraction = async (userId) => {
  try {
    const response = await apiClient.get('user-content-interaction/', {
      params: { user_id: userId }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching user content interaction data:", error);
    // Return a default structure to prevent UI errors
    return {
      interaction_by_type: [],
      interaction_by_time: [],
      total_interactions: 0,
      error: error.response?.data?.error || 'Failed to load interaction data'
    };
  }
};

// Add these functions to your existing requests.js file

// Get all support requests (or user's own requests for non-admins)
export const fetchSupportRequests = async (page = 1, pageSize = 10, status = null, search = '') => {
  try {
    let url = 'support-requests/';
    const params = new URLSearchParams();
    
    params.append('page', page);
    params.append('page_size', pageSize);
    
    if (status) {
      params.append('status', status);
    }
    
    if (search) {
      params.append('search', search);
    }
    
    const response = await apiClient.get(`${url}?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching support requests:', error);
    throw error;
  }
};

// Get a specific support request with responses
export const fetchSupportRequestDetail = async (ticketId) => {
  try {
    const response = await apiClient.get(`support-requests/${ticketId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching support request details:', error);
    throw error;
  }
};

// Create a new support request
export const createSupportRequest = async (requestData) => {
  try {
    const response = await apiClient.post('support-requests/', requestData);
    return response.data;
  } catch (error) {
    console.error('Error creating support request:', error);
    throw error;
  }
};

// Update a support request (admin only)
export const updateSupportRequest = async (ticketId, updateData) => {
  try {
    const response = await apiClient.put(`support-requests/${ticketId}/`, updateData);
    return response.data;
  } catch (error) {
    console.error('Error updating support request:', error);
    throw error;
  }
};

// Delete a support request (admin only)
export const deleteSupportRequest = async (ticketId) => {
  try {
    const response = await apiClient.delete(`support-requests/${ticketId}/`);
    return response.data;
  } catch (error) {
    console.error('Error deleting support request:', error);
    throw error;
  }
};

// Add a response to a support request
export const addSupportResponse = async (ticketId, message) => {
  try {
    const response = await apiClient.post(`support-requests/${ticketId}/respond/`, { message });
    return response.data;
  } catch (error) {
    console.error('Error adding support response:', error);
    throw error;
  }
};