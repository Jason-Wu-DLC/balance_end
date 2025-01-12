from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.views.generic import TemplateView
from django.http import HttpResponse
import requests

import logging
logger = logging.getLogger('django')

 """
# 开发环境下的 React 请求代理（仅用于开发调试）
def react_dev_server(request):
   
    开发模式下将请求代理到 React 的开发服务器（localhost:3000）。
    注意：生产环境中此方法应禁用。
    
    try:
        url = f"http://localhost:3000{request.path}"  # 将请求转发到 React 开发服务器
        response = requests.get(url)
        return HttpResponse(response.content, content_type=response.headers['Content-Type'])
    except requests.RequestException as e:
        logger.error(f"React dev server proxy failed: {e}")
        return HttpResponse("React dev server not running", status=502)
"""
# Login API
@api_view(['POST'])
def api_login(request):
    """
    用户登录接口。
    """
    email = request.data.get('username')
    password = request.data.get('password')
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'error': 'User does not exist'}, status=status.HTTP_404_NOT_FOUND)
    user = authenticate(request, username=user.username, password=password)
    if user:
        login(request, user)
        return Response({'message': 'Login successful', 'redirect_url': '/dashboard/'}, status=status.HTTP_200_OK)
    return Response({'error': 'Invalid email or password'}, status=status.HTTP_400_BAD_REQUEST)

# Signup API
@api_view(['POST'])
def api_signup(request):
    """
    用户注册接口。
    """
    fullname = request.data.get('fullname')
    email = request.data.get('email')
    password = request.data.get('password')
    if User.objects.filter(email=email).exists():
        return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        validate_password(password)
    except ValidationError as e:
        return Response({'error': e.messages}, status=status.HTTP_400_BAD_REQUEST)
    user = User.objects.create_user(username=email, email=email, password=password)
    user.first_name = fullname
    user.save()
    login(request, user)
    return Response({'message': 'Signup successful', 'redirect_url': '/dashboard/'}, status=status.HTTP_201_CREATED)

# Dashboard API
@api_view(['GET'])
def api_dashboard(request):
    """
    用户仪表盘接口。
    """
    if request.user.is_authenticated:
        return Response({
            'message': 'Welcome to the dashboard',
            'user': {
                'username': request.user.username,
                'email': request.user.email
            }
        })
    return Response({'error': 'User is not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)

# Test Email API
@api_view(['POST'])
def api_test_email(request):
    """
    测试邮件发送接口。
    """
    try:
        send_mail(
            'Test Email',
            'Hi there, This is a test email sent via University of Queensland EAIT mailhubs. It is test ONLY! Do not REPLY!!!',
            's4565901-balance-end@uqcloud.net',
            ['test@example.com'],
            fail_silently=False,
        )
        return Response({'message': 'Email sent successfully!'}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error sending email: {e}")
        return Response({'error': f"Error sending email: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
