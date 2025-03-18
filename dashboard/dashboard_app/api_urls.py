from django.urls import path
from . import views


urlpatterns = [
    path('login/', views.api_login, name='api_login'),
    path('signup/', views.api_signup, name='api_signup'),
    path('dashboard/', views.api_dashboard, name='api_dashboard'),
    path('test-email/', views.api_test_email, name='api_test_email'),

    # 用户 API
    path('user-info/', views.get_user_info, name='user_info'),

    # 统计数据 API
    path('active-users/', views.get_active_users, name='api_active_users'),
    path('average-usage-time/', views.get_average_usage_time, name='api_average_usage_time'),
    path('feedback-count/', views.get_feedback_count, name='api_feedback_count'),
    
]
