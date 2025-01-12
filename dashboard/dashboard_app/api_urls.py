from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.api_login, name='api_login'),
    path('signup/', views.api_signup, name='api_signup'),
    path('dashboard/', views.api_dashboard, name='api_dashboard'),
    path('test-email/', views.api_test_email, name='api_test_email'),
]
