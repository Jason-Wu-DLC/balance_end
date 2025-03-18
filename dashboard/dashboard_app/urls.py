from django.urls import path, include
from django.views.generic import TemplateView 
from django.contrib.auth import views as auth_views
from dashboard_app import views


urlpatterns = [
    # API 路由
    path('api/', include('dashboard_app.api_urls')), 

    # 账户和登录路由（如果需要后端登录功能）
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

]
