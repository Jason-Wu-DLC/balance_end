from django.db import connections
from django.core.mail import send_mail
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout, get_user_model
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from django.conf import settings
from django.template.loader import render_to_string
from django.urls import reverse
from django.utils.html import strip_tags


import logging
import json

from .models import WPUser, WPUserMeta, WPComments, VerificationCode

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

# 发送验证码
@api_view(['POST'])
def send_verification_code(request):
    """
    发送验证码接口
    """
    email = request.data.get('email')
    purpose = request.data.get('purpose', 'register')  # 默认为注册目的
    
    if not email:
        return Response({'error': '请提供有效的邮箱地址'}, status=status.HTTP_400_BAD_REQUEST)
    
    # 注册时检查邮箱是否已存在
    if purpose == 'register' and User.objects.filter(email=email).exists():
        return Response({'error': '该邮箱已被注册'}, status=status.HTTP_400_BAD_REQUEST)
    
    # 重置密码时检查邮箱是否存在
    if purpose == 'reset_password' and not User.objects.filter(email=email).exists():
        return Response({'error': '该邮箱未注册'}, status=status.HTTP_400_BAD_REQUEST)
    
    # 生成验证码
    verification = VerificationCode.generate_code(email, purpose)
    
    # 发送邮件
    try:
        subject = '验证您的邮箱' if purpose == 'register' else '重置密码'
        
        # 构建邮件内容
        context = {
            'code': verification.code,
            'expire_minutes': 10,
            'app_name': 'BALANCE Dashboard',
            'support_email': settings.DEFAULT_FROM_EMAIL
        }
        
        # 使用HTML模板
        html_message = render_to_string(
            f'email/{"verification" if purpose == "register" else "reset_password"}.html', 
            context
        )
        plain_message = strip_tags(html_message)
        
        # 发送邮件
        send_mail(
            subject,
            plain_message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            html_message=html_message,
            fail_silently=False,
        )
        
        logger.info(f"验证码邮件已发送到 {email}")
        return Response({'success': True, 'message': '验证码已发送'}, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"发送验证码邮件失败: {e}")
        return Response({'error': f'发送邮件失败: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 注册 API
@api_view(['POST'])
def api_signup(request):
    """
    用户注册接口，验证邮箱验证码，注册成功后发送欢迎邮件
    """
    fullname = request.data.get('fullname')
    email = request.data.get('email')
    password = request.data.get('password')
    verification_code = request.data.get('verification_code')
    
    # 检查必要字段
    if not all([fullname, email, password, verification_code]):
        return Response({'error': '请填写所有必要字段'}, status=status.HTTP_400_BAD_REQUEST)
    
    # 检查邮箱是否已存在
    if User.objects.filter(email=email).exists():
        return Response({'error': '邮箱已存在'}, status=status.HTTP_400_BAD_REQUEST)
    
    # 验证验证码
    if not VerificationCode.verify_code(email, verification_code, 'register'):
        return Response({'error': '验证码无效或已过期'}, status=status.HTTP_400_BAD_REQUEST)
    
    # 密码强度验证
    try:
        validate_password(password)
    except ValidationError as e:
        return Response({'error': e.messages}, status=status.HTTP_400_BAD_REQUEST)
    
    # 创建用户
    try:
        user = User.objects.create_user(username=email, email=email, password=password)
        user.first_name = fullname
        user.save()
        
        # 自动登录
        login(request, user)
        
        # 发送欢迎邮件
        try:
            subject = '欢迎加入 BALANCE Dashboard!'
            
            # 构建邮件内容
            context = {
                'name': fullname,
                'app_name': 'BALANCE Dashboard',
                'login_url': request.build_absolute_uri(reverse('login'))
            }
            
            html_message = render_to_string('email/welcome.html', context)
            plain_message = strip_tags(html_message)
            
            send_mail(
                subject,
                plain_message,
                settings.DEFAULT_FROM_EMAIL,
                [email],
                html_message=html_message,
                fail_silently=False,
            )
            
            logger.info(f"欢迎邮件已发送到 {email}")
        except Exception as e:
            logger.error(f"发送欢迎邮件失败: {e}")
        
        return Response({
            'message': 'Signup successful, email sent!', 
            'redirect_url': '/dashboard/'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"创建用户失败: {e}")
        return Response({'error': f'注册失败: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 密码重置 - 验证验证码
@api_view(['POST'])
def verify_reset_code(request):
    """
    验证密码重置验证码
    """
    email = request.data.get('email')
    code = request.data.get('code')
    
    if not all([email, code]):
        return Response({'error': '请提供邮箱和验证码'}, status=status.HTTP_400_BAD_REQUEST)
    
    if VerificationCode.verify_code(email, code, 'reset_password'):
        return Response({'success': True, 'message': '验证码验证成功'}, status=status.HTTP_200_OK)
    
    return Response({'error': '验证码无效或已过期'}, status=status.HTTP_400_BAD_REQUEST)

# 密码重置 - 重置密码
@api_view(['POST'])
def reset_password(request):
    """
    重置密码接口
    """
    email = request.data.get('email')
    code = request.data.get('code')
    new_password = request.data.get('new_password')
    
    if not all([email, code, new_password]):
        return Response({'error': '请提供所有必要字段'}, status=status.HTTP_400_BAD_REQUEST)
    
    # 验证验证码
    if not VerificationCode.verify_code(email, code, 'reset_password'):
        return Response({'error': '验证码无效或已过期'}, status=status.HTTP_400_BAD_REQUEST)
    
    # 密码强度验证
    try:
        validate_password(new_password)
    except ValidationError as e:
        return Response({'error': e.messages}, status=status.HTTP_400_BAD_REQUEST)
    
    # 更新密码
    try:
        user = User.objects.get(email=email)
        user.set_password(new_password)
        user.save()
        
        # 发送密码已重置通知
        try:
            subject = '您的密码已重置'
            
            context = {
                'name': user.first_name or user.username,
                'app_name': 'BALANCE Dashboard',
                'login_url': request.build_absolute_uri(reverse('login'))
            }
            
            html_message = render_to_string('email/password_reset_complete.html', context)
            plain_message = strip_tags(html_message)
            
            send_mail(
                subject,
                plain_message,
                settings.DEFAULT_FROM_EMAIL,
                [email],
                html_message=html_message,
                fail_silently=False,
            )
            
            logger.info(f"密码重置通知已发送到 {email}")
        except Exception as e:
            logger.error(f"发送密码重置通知失败: {e}")
        
        return Response({'success': True, 'message': '密码重置成功'}, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response({'error': '用户不存在'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"重置密码失败: {e}")
        return Response({'error': f'重置密码失败: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 检查用户是否已认证（用于受保护路由）
@api_view(['GET'])
def check_auth(request):
    """
    检查用户是否已登录
    """
    return Response({'isAuthenticated': request.user.is_authenticated})

# 登出接口
@api_view(['POST'])
def api_logout(request):
    """
    用户登出接口
    """
    logout(request)
    return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)

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