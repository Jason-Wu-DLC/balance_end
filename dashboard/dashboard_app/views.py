from django.db import connections
from django.core.mail import send_mail
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password

import logging

from .models import WPUser, WPUserMeta, WPComments

logger = logging.getLogger('django')

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
    用户注册接口，注册成功后发送欢迎邮件。
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

    # ✅ 创建用户
    user = User.objects.create_user(username=email, email=email, password=password)
    user.first_name = fullname
    user.save()

    # ✅ 指定认证后端（防止 Django 多重认证问题）
    backend = get_backends()[0]  # 选择第一个认证后端
    user.backend = backend.__module__ + "." + backend.__class__.__name__
    login(request, user, backend=user.backend)

    # ✅ **发送欢迎邮件**
    try:
        send_mail(
            'Welcome to BALANCE Dashboard!',
            f'Hi {fullname},\n\nThank you for signing up for BALANCE Dashboard!\n\nBest Regards,\nBALANCE Team',
            's4565901-balance-end@uqcloud.net',  # 发送者邮箱
            [email],  # 接收者邮箱
            fail_silently=False,
        )
        logger.info(f"Welcome email sent to {email}")
    except Exception as e:
        logger.error(f"Error sending welcome email: {e}")

    return Response({'message': 'Signup successful, email sent!', 'redirect_url': '/dashboard/'}, status=status.HTTP_201_CREATED)

@api_view(['GET'])
def get_user_info(request):
    """
    获取当前登录用户的信息。
    """
    user = request.user
    return JsonResponse({
        "name": user.first_name or user.username,
        "email": user.email,
        "role": "Admin" if user.is_superuser else "Researcher",
    })


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


# 🎯 **获取活跃用户数**
@api_view(['GET'])
def get_active_users(request):
    """
    统计登录次数 >= 2 的活跃用户数
    使用 Django ORM 直接查询 `wp_usermeta`
    """
    active_users = WPUserMeta.objects.using("wordpress").filter(meta_key='login_count', meta_value__gte=1).values("user_id").distinct().count()
    
    return JsonResponse({"active_users": active_users})


# 🎯 **计算平均使用时间**
@api_view(['GET'])
def get_average_usage_time(request):
    """
    计算用户平均在线时长
    """
    avg_time = WPUserMeta.objects.using("wordpress").filter(meta_key='usage_time').extra(
        select={'converted_value': 'CAST(meta_value AS UNSIGNED)'}
    ).aggregate(avg_time=models.Avg('converted_value'))['avg_time'] or 0

    return JsonResponse({"average_usage_time": round(float(avg_time), 2)})


# 🎯 **统计反馈消息数量**
@api_view(['GET'])
def get_feedback_count(request):
    """
    统计所有用户的反馈消息数量（基于 `wp_comments` 表）
    """
    feedback_count = WPComments.objects.using("wordpress").count()
    print(f"DEBUG: 查询到的评论数量为: {feedback_count}")  # 添加这行
    logger.info(f"反馈消息数量: {feedback_count}")  # 使用日志记录

    return JsonResponse({"feedback_count": feedback_count})

# 🎯 **测试邮件 API**
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