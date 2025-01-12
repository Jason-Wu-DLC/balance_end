from django.urls import path, include
from django.views.generic import TemplateView  # 用于直接返回 React 的 HTML 文件
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    # API 路由
    path('api/', include('dashboard_app.api_urls')),  # 引用 API 路由文件

    # 账户和登录路由（如果需要后端登录功能）
    path('accounts/', include('allauth.urls')),
    path('login/', views.login_page, name='login'),
    path('signUp/', views.signup_page, name='signUp'),

    # 密码重置路由（如果需要后端管理密码功能）
    path('password_reset/', auth_views.PasswordResetView.as_view(
        template_name='dashboard_app/password_reset_form.html',
        email_template_name='dashboard_app/password_reset_email.html',
        success_url='/password_reset/done/'), name='password_reset'),
    path('password_reset/done/', auth_views.PasswordResetDoneView.as_view(
        template_name='dashboard_app/password_reset_done.html'), name='password_reset_done'),
    path('recover-password/', auth_views.PasswordResetView.as_view(
        template_name='dashboard_app/password_reset_form.html'), name='recover_password'),

    # 转发所有其他请求到 React 前端（生产模式下 React 静态文件托管）
    path('', TemplateView.as_view(template_name='index.html'), name='index'),  # 假设 React 构建后的 HTML 文件为 index.html
]
