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


    path('logout/', views.api_logout, name='api_logout'),
    path('check-auth/', views.check_auth, name='check_auth'),
    
    # 验证码 API
    path('send-verification-code/', views.send_verification_code, name='send_verification_code'),
    
    # 密码重置 API
    path('password-reset/send-code/', views.send_verification_code, name='password_reset_send_code'),
    path('password-reset/verify-code/', views.verify_reset_code, name='password_reset_verify_code'),
    path('password-reset/reset/', views.reset_password, name='password_reset_do_reset'),
    
    # 仪表盘 API
    path('dashboard/', views.api_dashboard, name='api_dashboard'),
    path('test-email/', views.api_test_email, name='api_test_email'),
    
]
