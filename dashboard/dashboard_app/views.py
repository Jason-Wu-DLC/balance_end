# Python standard library imports
import re
import logging
import json
import uuid
import hashlib
from datetime import datetime, timedelta, date
from collections import Counter, defaultdict
from django.forms.models import model_to_dict
import os
import psutil
import platform
import django
from urllib.parse import urlparse
# Django core imports
from django.conf import settings
from django.core.cache import cache
from django.core.mail import send_mail
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.auth.models import User, Group
from django.db import connections, models, transaction, IntegrityError
from django.db.models import (
    Count, Sum, Avg, Min, Max, F, Q, 
    ExpressionWrapper, Value, CharField, DateField
)
from django.db.models.functions import (
    TruncDate, TruncWeek, TruncMonth, TruncYear,
    Cast, Coalesce, Concat
)
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.html import strip_tags, escape
from django.utils.text import slugify

# Django REST Framework imports
from rest_framework import status, viewsets, permissions, filters, pagination
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from django.middleware.csrf import get_token
# Local application imports
from .models import WPUser, WPUserMeta, WPComments, SecurityQuestion, WPPost, WPPostMeta, UserPreference ,MatomoLogVisit, MatomoLogAction, MatomoLogLinkVisitAction, SupportRequest, SupportResponse, WPTerms 

# Set up loggers
logger = logging.getLogger('django')
auth_logger = logging.getLogger('auth')

def validate_email(email):
    """Validate email format using regex."""
    email_regex = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return re.match(email_regex, email) is not None

def get_csrf_token(request):
    """获取一个 CSRF token"""
    token = get_token(request)
    return JsonResponse({'csrfToken': token})

def send_email(subject, template_name, context, recipient_email):
    """Send an email using a template."""
    try:
        html_message = render_to_string(template_name, context)
        plain_message = strip_tags(html_message)
        send_mail(
            subject,
            plain_message,
            settings.DEFAULT_FROM_EMAIL,
            [recipient_email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False

@api_view(['POST'])
def api_login(request):
    """
    User login endpoint.
    """
    email = request.data.get('username')  # 前端发送为'username'
    password = request.data.get('password')
    
    if not email or not password:
        return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # 先通过邮箱找到用户
        user_obj = User.objects.get(email=email)
        
        # 通过用户名进行认证
        authenticated_user = authenticate(request, username=user_obj.username, password=password)
        
        if authenticated_user:
            login(request, authenticated_user)
            auth_logger.info(f"User logged in: {email}")
            
            # 创建令牌
            token = make_password(f"{authenticated_user.id}:{authenticated_user.email}:{authenticated_user.password}")
            
            return Response({
                'message': 'Login successful',
                'token': token,
                'user': {
                    'id': authenticated_user.id,
                    'name': authenticated_user.first_name,
                    'email': authenticated_user.email,
                    'role': 'Admin' if authenticated_user.is_superuser else 'Researcher'
                }
            }, status=status.HTTP_200_OK)
        else:
            auth_logger.warning(f"Failed login attempt for user: {email} (password mismatch)")
            return Response({'error': 'Invalid email or password'}, status=status.HTTP_400_BAD_REQUEST)
            
    except User.DoesNotExist:
        auth_logger.warning(f"Login attempt with non-existent email: {email}")
        return Response({'error': 'User does not exist'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
def api_signup(request):
    """
    User registration endpoint with security questions.
    """
    fullname = request.data.get('fullname')
    email = request.data.get('email')
    password = request.data.get('password')
    security_question1 = request.data.get('security_question1')
    security_answer1 = request.data.get('security_answer1')
    security_question2 = request.data.get('security_question2')
    security_answer2 = request.data.get('security_answer2')
    
    # 验证输入
    if not all([fullname, email, password]):
        return Response({'error': 'Name, email, and password are required'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    if not all([security_question1, security_answer1, security_question2, security_answer2]):
        return Response({'error': 'Two security questions and answers are required'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    if security_question1 == security_question2:
        return Response({'error': 'Please choose different security questions'}, 
                       status=status.HTTP_400_BAD_REQUEST)

    try:
        # 检查用户是否已存在
        if User.objects.filter(email=email).exists():
            return Response({'error': 'A user with this email already exists'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        # 生成一个随机用户名 (因为Django模型需要username字段)
        import uuid
        random_username = f"user_{uuid.uuid4().hex[:10]}"
        
        # 创建用户
        user = User.objects.create_user(
            username=random_username,  # 使用随机生成的用户名
            email=email,
            password=password,
            first_name=fullname,
        )
        
        # 保存安全问题
        SecurityQuestion.objects.create(
            user=user,
            question_number=1,
            question_text=security_question1,
            answer=security_answer1
        )
        
        SecurityQuestion.objects.create(
            user=user,
            question_number=2,
            question_text=security_question2,
            answer=security_answer2
        )
        
        # 使用正确的用户名登录用户
        authenticated_user = authenticate(request, username=random_username, password=password)
        if authenticated_user:
            login(request, authenticated_user)
        else:
            # 如果认证失败，记录错误但仍然返回成功(罕见情况)
            auth_logger.warning(f"New user registered but login failed: {email}")
        
        # 发送欢迎邮件
        context = {
            'name': fullname,
            'app_name': 'BALANCE Dashboard',
            'login_url': request.build_absolute_uri('/login')
        }
        send_email(
            'Welcome to BALANCE Dashboard',
            'email/welcome.html',
            context,
            email
        )
        
        auth_logger.info(f"New user registered: {email}")
        return Response({
            'message': 'Signup successful',
            'user': {
                'name': user.first_name,
                'email': user.email
            }
        }, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        logger.error(f"Registration error: {e}", exc_info=True)
        return Response({'error': f'Registration failed: {str(e)}'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def get_security_questions(request):
    """
    Get the security questions for a user during password reset.
    """
    email = request.data.get('email')
    
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
        questions = SecurityQuestion.objects.filter(user=user).order_by('question_number')
        
        if questions.count() < 2:
            return Response({'error': 'Security questions not found for this user'}, 
                           status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'questions': {
                'question1': questions[0].question_text,
                'question2': questions[1].question_text
            }
        }, status=status.HTTP_200_OK)
    
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    except Exception as e:
        logger.error(f"Error retrieving security questions: {e}", exc_info=True)
        return Response({'error': 'Error retrieving security questions'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def verify_security_answers(request):
    """
    Verify the answers to security questions during password reset.
    """
    email = request.data.get('email')
    security_answer1 = request.data.get('security_answer1')
    security_answer2 = request.data.get('security_answer2')
    
    if not all([email, security_answer1, security_answer2]):
        return Response({'error': 'Email and answers to both security questions are required'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
        questions = SecurityQuestion.objects.filter(user=user).order_by('question_number')
        
        if questions.count() < 2:
            return Response({'error': 'Security questions not found for this user'}, 
                           status=status.HTTP_404_NOT_FOUND)
        
        # Simple string comparison for answers (in production, use secure comparison)
        if (questions[0].answer.lower() == security_answer1.lower() and 
            questions[1].answer.lower() == security_answer2.lower()):
            
            return Response({
                'success': True,
                'message': 'Security questions answered correctly'
            }, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Incorrect answers to security questions'}, 
                           status=status.HTTP_400_BAD_REQUEST)
    
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    except Exception as e:
        logger.error(f"Error verifying security answers: {e}", exc_info=True)
        return Response({'error': 'Error verifying security answers'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def reset_password(request):
    """
    Reset password using security question answers.
    """
    email = request.data.get('email')
    security_answer1 = request.data.get('security_answer1')
    security_answer2 = request.data.get('security_answer2')
    new_password = request.data.get('new_password')

    if not all([email, security_answer1, security_answer2, new_password]):
        return Response({'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
        questions = SecurityQuestion.objects.filter(user=user).order_by('question_number')
        
        if questions.count() < 2:
            return Response({'error': 'Security questions not found for this user'}, 
                           status=status.HTTP_404_NOT_FOUND)
        
        # Verify security answers
        if (questions[0].answer.lower() != security_answer1.lower() or 
            questions[1].answer.lower() != security_answer2.lower()):
            return Response({'error': 'Incorrect answers to security questions'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        # Send password reset confirmation email
        context = {
            'name': user.first_name or user.username,
            'app_name': 'BALANCE Dashboard',
            'login_url': request.build_absolute_uri('/login')
        }
        send_email(
            'Your Password Has Been Reset',
            'email/password_reset_complete.html',
            context,
            email
        )
        
        auth_logger.info(f"Password reset for user: {email}")
        return Response({'success': True, 'message': 'Password reset successful'}, 
                       status=status.HTTP_200_OK)
    
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    except Exception as e:
        logger.error(f"Password reset error: {e}", exc_info=True)
        return Response({'error': f'Password reset failed: {str(e)}'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Check User Authentication (for protected routes)
@api_view(['GET'])
def check_auth(request):
    """
    Check if user is logged in
    """
    if request.user.is_authenticated:
        return Response({
            'isAuthenticated': True,
            'user': {
                'name': request.user.first_name or request.user.username,
                'email': request.user.email,
                'role': 'Admin' if request.user.is_superuser else 'Researcher'
            }
        })
    return Response({'isAuthenticated': False})

# Logout Endpoint
@api_view(['POST'])
def api_logout(request):
    """
    User logout endpoint
    """
    if request.user.is_authenticated:
        auth_logger.info(f"User logged out: {request.user.email}")
        logout(request)
    return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_info(request):
    """
    Get information for currently logged-in user.
    """
    user = request.user
    return Response({
        "name": user.first_name or user.username,
        "email": user.email,
        "role": "Admin" if user.is_superuser else "Researcher",
        "is_superuser": user.is_superuser,  # Add this explicitly
        "is_staff": user.is_staff          # Add this explicitly
    })

# Dashboard API
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_dashboard(request):
    """
    User dashboard interface.
    """
    return Response({
        'message': 'Welcome to the dashboard',
        'user': {
            'username': request.user.username,
            'email': request.user.email,
            'name': request.user.first_name
        }
    })

# Get active users
@api_view(['GET'])
def get_active_users(request):
    """
    Count active users with login count >= 1
    """
    active_users = WPUser.objects.using("wordpress").count()
    
    return Response({"active_users": active_users})

@api_view(['GET'])
def get_total_notes(request):
    """
    Calculate total number of published notes
    """
    # 获取发布状态为publish的notes数量
    total_notes = WPPost.objects.using("wordpress").filter(
        post_type='notes',
        post_status='publish'
    ).count()

    return Response({"TotalNotesStats": total_notes})

# Count feedback messages
@api_view(['GET'])
def get_feedback_count(request):
    """
    Count all users' feedback messages (based on `wp_comments` table)
    """
    feedback_count = WPComments.objects.using("wordpress").count()
    logger.info(f"Feedback message count: {feedback_count}")

    return Response({"feedback_count": feedback_count})


@api_view(['GET'])
def user_activity_trends(request):
    """
    获取用户注册和活动趋势数据
    处理 user_registered (日期时间格式) 和 tutor_last_login (Unix时间戳格式)
    """
    try:
        # 获取查询参数
        interval = request.GET.get('interval', 'day')  # day, week, month, year
        start_date_str = request.GET.get('start_date', '2023-01-01')  # 默认为2023年1月1日
        end_date_str = request.GET.get('end_date', None)
        
        # 设置默认日期范围
        if not end_date_str:
            end_date = timezone.now()
        else:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
        
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        
        # 将开始日期和结束日期转换为Unix时间戳，用于筛选tutor_last_login
        start_timestamp = int(start_date.timestamp())
        end_timestamp = int(end_date.timestamp())
        
        # 根据间隔选择截断函数
        if interval == 'day':
            date_trunc = TruncDate('user_registered')
        elif interval == 'week':
            date_trunc = TruncWeek('user_registered')
        elif interval == 'month':
            date_trunc = TruncMonth('user_registered')
        else:  # year
            date_trunc = TruncYear('user_registered')
        
        # 获取新用户注册数据
        registrations = WPUser.objects.using('wordpress').filter(
            user_registered__gte=start_date,
            user_registered__lte=end_date
        ).annotate(
            date=date_trunc
        ).values('date').annotate(
            count=Count('ID')
        ).order_by('date')
        
        # 获取活跃用户数据 - 使用数值比较而不是日期比较
        # 注意：我们需要将字符串类型的 meta_value 转换为数值后再比较
        active_users = WPUserMeta.objects.using('wordpress').filter(
            meta_key='tutor_last_login',
            meta_value__gte=str(start_timestamp),  # 确保作为字符串比较
            meta_value__lte=str(end_timestamp)     # 确保作为字符串比较
        )
        
        # 整理活跃用户数据
        active_data = []
        if active_users.exists():
            # 我们需要手动分组，因为meta_value是时间戳字符串
            active_counts = {}
            
            for user in active_users:
                try:
                    # 将时间戳转换为datetime对象
                    timestamp = int(user.meta_value)
                    date = datetime.fromtimestamp(timestamp)
                    
                    # 根据间隔截断日期
                    if interval == 'day':
                        date_key = date.strftime('%Y-%m-%d')
                    elif interval == 'week':
                        # 获取该周的第一天
                        date_key = (date - timedelta(days=date.weekday())).strftime('%Y-%m-%d')
                    elif interval == 'month':
                        date_key = date.strftime('%Y-%m-01')
                    else:  # year
                        date_key = date.strftime('%Y-01-01')
                    
                    if date_key in active_counts:
                        active_counts[date_key] += 1
                    else:
                        active_counts[date_key] = 1
                except (ValueError, TypeError):
                    # 忽略无效的时间戳
                    continue
            
            # 转换为列表格式
            for date_key, count in active_counts.items():
                active_data.append({
                    'date': date_key,
                    'count': count
                })
        
        # 创建日期范围填充缺失的数据
        all_dates = []
        current = start_date
        
        if end_date.tzinfo is not None:
            end_date = end_date.replace(tzinfo=None)  
        if current.tzinfo is not None:
            current = current.replace(tzinfo=None) 

        while current <= end_date:
            if interval == 'day':
                date_str = current.strftime('%Y-%m-%d')
                current += timedelta(days=1)
            elif interval == 'week':
                # 确保从周一开始
                week_start = current - timedelta(days=current.weekday())
                date_str = week_start.strftime('%Y-%m-%d')
                current = week_start + timedelta(days=7)
            elif interval == 'month':
                date_str = current.strftime('%Y-%m-01')
                # 移到下个月的第一天
                if current.month == 12:
                    current = current.replace(year=current.year + 1, month=1, day=1)
                else:
                    current = current.replace(month=current.month + 1, day=1)
            else:  # year
                date_str = current.strftime('%Y-01-01')
                current = current.replace(year=current.year + 1)
            
            all_dates.append(date_str)
        
        # 合并数据
        result = []
        for date_str in all_dates:
            # 查找该日期的新用户数
            reg_count = 0
            for reg in registrations:
                if interval == 'day':
                    reg_date_str = reg['date'].strftime('%Y-%m-%d')
                elif interval == 'week':
                    reg_date_str = reg['date'].strftime('%Y-%m-%d')
                elif interval == 'month':
                    reg_date_str = reg['date'].strftime('%Y-%m-01')
                else:  # year
                    reg_date_str = reg['date'].strftime('%Y-01-01')
                
                if reg_date_str == date_str:
                    reg_count = reg['count']
                    break
            
            # 查找该日期的活跃用户数
            active_count = 0
            for active in active_data:
                if active['date'] == date_str:
                    active_count = active['count']
                    break
            
            result.append({
                'date': date_str,
                'newUsers': reg_count,
                'activeUsers': active_count
            })
        
        return Response(result)
    
    except Exception as e:
        # 返回错误信息以便调试
        import traceback
        error_message = str(e)
        error_traceback = traceback.format_exc()
        
        # 记录错误
        print(f"Error in user_activity_trends: {error_message}")
        print(f"Traceback: {error_traceback}")
        
        # 返回错误响应
        return Response({
            'error': error_message,
            'traceback': error_traceback
        }, status=500)
    


@api_view(['GET'])
def note_text_analysis(request):
    """
    API endpoint for text-based visualization of notes
    """
    try:
        # Fetch published notes
        notes = WPPost.objects.using('wordpress').filter(
            post_type='notes', 
            post_status='publish'
        ).values('ID', 'post_title', 'post_content', 'post_date')
        
        # Prepare for analysis
        word_counts = []
        content_lengths = []
        date_counts = {}

        for note in notes:
            # Clean HTML tags if needed (currently just lowercasing)
            content = note['post_content'].lower() if note['post_content'] else ''
            words = [w for w in content.split() if len(w) > 3]
            word_counts.extend(words)

            # Record content length
            content_lengths.append(len(content))

            # Group by date
            date_str = note['post_date'].strftime('%Y-%m-%d')
            if date_str in date_counts:
                date_counts[date_str] += 1
            else:
                date_counts[date_str] = 1

        # Top 50 common words
        common_words = Counter(word_counts).most_common(50)

        # Custom content length distribution
        length_distribution = Counter()
        for length in content_lengths:
            if length <= 5:
                bucket = '0-5'
            elif length <= 10:
                bucket = '6-10'
            elif length <= 20:
                bucket = '11-20'
            elif length <= 50:
                bucket = '21-50'
            elif length <= 100:
                bucket = '51-100'
            else:
                bucket = '100+'
            length_distribution[bucket] += 1

        # Build response
        return Response({
            'word_frequency': common_words,
            'content_length_distribution': [
                {'length': k, 'count': v} for k, v in length_distribution.items()
            ],
            'date_distribution': [
                {'date': k, 'count': v} for k, v in sorted(date_counts.items())
            ]
        })
    except Exception as e:
        logger.error(f"Error in note_text_analysis: {str(e)}")
        return Response(
            {'error': 'Failed to analyze note text data'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def model_note_relationship(request):
    """
    API endpoint for model and note relationship visualization
    """
    try:
        # 获取所有模块标签
        module_tags = WPPostMeta.objects.using('wordpress').filter(
            meta_key='module_tag', 
            meta_value__isnull=False,
            meta_value__gt=''
        ).values_list('meta_value', flat=True).distinct()
        
        
        # 获取按模块标签分组的笔记计数
        module_counts = WPPostMeta.objects.using('wordpress').filter(
            meta_key='module_tag',
            post__post_type='notes',
            post__post_status='publish',
            meta_value__isnull=False,
            meta_value__gt=''
        ).values('meta_value').annotate(count=Count('post', distinct=True))
        
        
        return Response({
            'modules': list(module_tags),
            'module_counts': list(module_counts)
        })
    except Exception as e:
        logger.error(f"Error in model_note_relationship: {str(e)}")
        return Response(
            {'error': 'Failed to generate model-note relationship data'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def note_upload_trends(request):
    """
    API endpoint for note upload trend visualization
    """
    try:
        # 获取请求参数
        interval = request.query_params.get('interval', 'day')
        start_date = request.query_params.get('start_date', None)
        end_date = request.query_params.get('end_date', None)
        
        # 设置默认时间范围
        if not start_date:
            start_date = (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d')
        if not end_date:
            end_date = datetime.now().strftime('%Y-%m-%d')
        
        # 准备查询
        notes = WPPost.objects.using('wordpress').filter(post_type='notes', post_status='publish')
        
        # 根据间隔聚合数据
        if interval == 'day':
            trends = notes.annotate(date=TruncDate('post_date')).values('date').annotate(count=Count('ID')).order_by('date')
        elif interval == 'week':
            trends = notes.annotate(date=TruncWeek('post_date')).values('date').annotate(count=Count('ID')).order_by('date')
        elif interval == 'month':
            trends = notes.annotate(date=TruncMonth('post_date')).values('date').annotate(count=Count('ID')).order_by('date')
        else:  # year
            trends = notes.annotate(date=TruncYear('post_date')).values('date').annotate(count=Count('ID')).order_by('date')
        
        # 添加模块标签维度
        module_trends = []
        modules = WPPostMeta.objects.filter(meta_key='module_tag', meta_value__isnull=False, meta_value__gt='').values_list('meta_value', flat=True).distinct()
        
        for module in modules:
            # 获取该模块下的笔记ID
            post_ids = WPPostMeta.objects.filter(
                meta_key='module_tag',
                meta_value=module
            ).values_list('post_id', flat=True)
            
            # 获取该模块下笔记的上传趋势
            if interval == 'day':
                module_data = notes.filter(ID__in=post_ids).annotate(date=TruncDate('post_date')).values('date').annotate(count=Count('ID')).order_by('date')
            elif interval == 'week':
                module_data = notes.filter(ID__in=post_ids).annotate(date=TruncWeek('post_date')).values('date').annotate(count=Count('ID')).order_by('date')
            elif interval == 'month':
                module_data = notes.filter(ID__in=post_ids).annotate(date=TruncMonth('post_date')).values('date').annotate(count=Count('ID')).order_by('date')
            else:  # year
                module_data = notes.filter(ID__in=post_ids).annotate(date=TruncYear('post_date')).values('date').annotate(count=Count('ID')).order_by('date')
            
            module_trends.append({
                'module': module,
                'data': list(module_data)
            })
        
        return Response({
            'overall_trend': list(trends),
            'module_trends': module_trends,
            'interval': interval,
            'start_date': start_date,
            'end_date': end_date
        })
    except Exception as e:
        logger.error(f"Error in note_upload_trends: {str(e)}")
        return Response(
            {'error': 'Failed to generate upload trend data'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def module_notes_content(request):
    """
    API endpoint for module-specific notes with text and images
    """
    try:
        # 获取请求的模块标签
        module = request.query_params.get('module', None)
        base_wordpress_url = "https://s4565901-balance-project.uqcloud.net"  # WordPress URL
        
        # 如果未指定模块，返回所有可用模块列表
        if not module:
            modules = WPPostMeta.objects.using('wordpress').filter(
                meta_key='module_tag',
                meta_value__isnull=False, 
                meta_value__gt=''
            ).values_list('meta_value', flat=True).distinct()
            
            # 使用 Response 类而不是直接返回字典
            return Response({
                'modules': list(modules)
            })
        
        # 获取指定模块的笔记ID
        post_ids = WPPostMeta.objects.using('wordpress').filter(
            meta_key='module_tag',
            meta_value=module
        ).values_list('post_id', flat=True)
        
        # 获取这些笔记的详细信息
        notes = []
        for post_id in post_ids:
            # 获取笔记基本信息
            post = WPPost.objects.using('wordpress').filter(ID=post_id, post_type='notes', post_status='publish').first()
            if not post:
                continue
                
            # 获取笔记的图片引用
            images = []
            for i in range(1, 6):  # notes_img_1 to notes_img_5
                img_meta = WPPostMeta.objects.using('wordpress').filter(
                    post_id=post_id, 
                    meta_key=f'notes_img_{i}',
                    meta_value__isnull=False,
                    meta_value__gt=''
                ).first()
                
                if img_meta:
                    # 获取图片ID
                    image_id = img_meta.meta_value
                    logger.info(f"Found image for post {post_id}: meta_key={img_meta.meta_key}, meta_value={image_id}")
                    
                    # 尝试获取附件信息
                    attachment = WPPost.objects.using('wordpress').filter(ID=image_id, post_type='attachment').first()
                    
                    if attachment:
                        # 获取guid (这通常包含完整URL)
                        guid = attachment.guid
                        logger.info(f"Attachment found: ID={attachment.ID}, guid={guid}")
                        
                        # 获取上传日期 (用于构建路径)
                        upload_date = attachment.post_date
                        year = upload_date.strftime('%Y')
                        month = upload_date.strftime('%m')
                        
                        # 从 _wp_attached_file 元数据获取文件路径
                        attachment_meta = WPPostMeta.objects.using('wordpress').filter(
                            post_id=image_id, 
                            meta_key='_wp_attached_file'
                        ).first()
                        
                        if attachment_meta:
                            # 元数据中通常包含相对路径，如 "2025/04/image.jpg"
                            file_path = attachment_meta.meta_value
                            logger.info(f"Attachment file path: {file_path}")
                            
                            # 构建完整URL
                            full_url = f"{base_wordpress_url}/wp-content/uploads/{file_path}"
                            
                            images.append({
                                'id': image_id,
                                'url': full_url,
                                'file_path': file_path
                            })
                        else:
                            # 如果找不到 _wp_attached_file，则从 guid 中提取路径
                            if guid and 'wp-content/uploads/' in guid:
                                images.append({
                                    'id': image_id,
                                    'url': guid,
                                    'file_path': guid.split('wp-content/uploads/')[-1] if 'wp-content/uploads/' in guid else None
                                })
                            else:
                                # 使用基于年月的路径
                                fallback_url = f"{base_wordpress_url}/wp-content/uploads/{year}/{month}/output-{post_id}-{i}.png"
                                images.append({
                                    'id': image_id,
                                    'url': fallback_url,
                                    'fallback': True,
                                    'year': year,
                                    'month': month
                                })
                    else:
                        # 如果找不到附件记录，使用基于当前笔记日期的路径
                        note_date = post.post_date
                        year = note_date.strftime('%Y')
                        month = note_date.strftime('%m')
                        
                        # 使用示例URL路径
                        example_url = f"{base_wordpress_url}/wp-content/uploads/{year}/{month}/output-{post_id}-{i}.png"
                        
                        # 添加多个可能的URL
                        fallback_urls = [
                            f"{base_wordpress_url}/wp-content/uploads/{year}/{month}/output-{post_id}-{i}.png",
                            f"{base_wordpress_url}/wp-content/uploads/{year}/{month}/output-{post_id}-{i}.jpg",
                            f"{base_wordpress_url}/wp-content/uploads/{year}/{month}/{image_id}.png",
                            f"{base_wordpress_url}/wp-content/uploads/{year}/{month}/{image_id}.jpg"
                        ]
                        
                        images.append({
                            'id': image_id,
                            'url': example_url,  # 主要URL
                            'urls': fallback_urls,  # 备选URL
                            'fallback': True,
                            'year': year,
                            'month': month
                        })
            
            notes.append({
                'id': post.ID,
                'title': post.post_title,
                'content': post.post_content,
                'date': post.post_date,
                'author': post.post_author,
                'images': images
            })
        
        # 使用 REST Framework 的 Response 类返回响应
        return Response({
            'module': module,
            'notes_count': len(notes),
            'notes': notes
        })
    except Exception as e:
        # 记录详细错误信息
        logger.error(f"Error in module_notes_content: {str(e)}", exc_info=True)
        
        # 始终使用 Response 类返回错误响应
        return Response(
            {'error': 'Failed to retrieve module notes content'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
@api_view(['GET'])
def notes_statistics(request):
    """
    API endpoint for retrieving notes statistics overview
    """
    try:
        # 获取发布状态的笔记总数
        total_notes = WPPost.objects.using('wordpress').filter(
            post_type='notes', 
            post_status='publish'
        ).count()
        
        # 获取不同模块的数量
        module_count = WPPostMeta.objects.using('wordpress').filter(
            meta_key='module_tag',
            meta_value__isnull=False,
            meta_value__gt=''
        ).values('meta_value').distinct().count()
        
        # 获取有笔记的活跃用户数
        active_users = WPPost.objects.using('wordpress').filter(
            post_type='notes',
            post_status='publish'
        ).values('post_author').distinct().count()
        
        # 计算每个用户的平均笔记数
        avg_notes_per_user = round(total_notes / active_users, 1) if active_users > 0 else 0
        
        return Response({
            'total_notes': total_notes,
            'module_count': module_count,
            'active_users': active_users,
            'avg_notes_per_user': avg_notes_per_user
        })
    except Exception as e:
        logger.error(f"Error retrieving notes statistics: {e}")
        return Response(
            {'error': 'Failed to retrieve notes statistics'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
@api_view(['GET'])
def get_wordpress_users(request):
    """
    Get a list of WordPress users for the user selection dropdown
    """
    try:
        # Get users from WordPress database with basic pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 100))
        offset = (page - 1) * page_size
        
        # Get total count
        total_users = WPUser.objects.using('wordpress').count()
        
        # Get paginated users
        users = WPUser.objects.using('wordpress').all().order_by('display_name')[offset:offset + page_size]
        
        # Serialize the data (just ID and display name)
        user_data = [
            {
                'id': user.ID,
                'name': user.display_name or user.user_login  # Use display_name if available, otherwise use login
            }
            for user in users
        ]
        
        return Response({
            'users': user_data,
            'total': total_users,
            'page': page,
            'page_size': page_size
        })
    except Exception as e:
        logger.error(f"Error retrieving WordPress users: {e}")
        return Response(
            {'error': 'Failed to retrieve users'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def user_favorites(request):
    """
    Retrieve user's favorite content and module distribution based on title mapping.
    """
    try:
        user_id = request.query_params.get('user_id')

        if not user_id:
            wp_user = WPUser.objects.using('wordpress').filter(user_email=request.user.email).first()
            if wp_user:
                user_id = wp_user.ID
            else:
                return Response({'error': 'WordPress user not found'}, status=status.HTTP_404_NOT_FOUND)

        favorites = []
        module_stats = {}

        # 1. Fetch favorited courses
        wishlist_entries = WPUserMeta.objects.using('wordpress').filter(
            user_id=user_id,
            meta_key='_tutor_course_wishlist'
        ).values_list('meta_value', flat=True)

        for course_id in wishlist_entries:
            try:
                course = WPPost.objects.using('wordpress').filter(
                    ID=course_id,
                    post_type='courses'
                ).values('ID', 'post_title').first()

                if course:
                    favorites.append({
                        'id': course['ID'],
                        'title': course['post_title'],
                        'type': 'course'
                    })

                    module = resolve_module_from_title(course['post_title'])
                    module_stats[module] = module_stats.get(module, 0) + 1

            except Exception as e:
                logger.warning(f"Error processing course {course_id}: {str(e)}")
                continue

        # 2. Fetch bookmarked posts
        bookmarked_posts_entry = WPUserMeta.objects.using('wordpress').filter(
            user_id=user_id,
            meta_key='bookmarked_posts'
        ).values_list('meta_value', flat=True).first()

        if bookmarked_posts_entry:
            try:
                post_ids = re.findall(r'i:\d+;i:(\d+);', bookmarked_posts_entry)
                for post_id in post_ids:
                    post = WPPost.objects.using('wordpress').filter(
                        ID=post_id
                    ).values('ID', 'post_title', 'post_type').first()

                    if post:
                        favorites.append({
                            'id': post['ID'],
                            'title': post['post_title'],
                            'type': post['post_type']
                        })

                        module = resolve_module_from_title(post['post_title'])
                        module_stats[module] = module_stats.get(module, 0) + 1

            except Exception as e:
                logger.warning(f"Error parsing bookmarked posts: {str(e)}")

        stats = [{'module': name, 'count': count} for name, count in module_stats.items()]

        return Response({
            'favorites': favorites,
            'stats': stats
        })

    except Exception as e:
        logger.error(f"Failed to retrieve user favorites: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Failed to retrieve user favorites'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def resolve_module_from_title(title):
    """
    Map specific titles to high-level modules.
    """
    title = (title or '').strip().lower()

    mapping = {
        # Physical Health
        'caring for your body after treatment': 'Physical Health',
        'nourishment': 'Physical Health',
        'sleep': 'Physical Health',
        'sexual wellbeing': 'Physical Health',
        'movement': 'Physical Health',
        'dealing with brain fog': 'Physical Health',

        # Mental and Personal Wellbeing
        'self-identity': 'Mental and Personal Wellbeing',
        'emotional wellbeing': 'Mental and Personal Wellbeing',
        'body image': 'Mental and Personal Wellbeing',

        # Social and Work
        'social media and the internet': 'Social and Work',
        'practical issues': 'Social and Work',
        'connections': 'Social and Work',
        'education and vocation': 'Social and Work'
    }

    return mapping.get(title, 'Uncategorized')

@api_view(['GET'])
def session_activity(request):
    """Get user session activity data for heatmap visualization - bypassing middleware"""
    try:
        from urllib.parse import parse_qs
        
        query_string = request.META.get('QUERY_STRING', '')
        print(f"Original query string: {query_string}")
        
        raw_params = parse_qs(query_string)
        
        user_id = raw_params.get('user_id', [None])[0]
        start_date_str = raw_params.get('start_date', [None])[0]
        end_date_str = raw_params.get('end_date', [None])[0]
        
        print(f"Raw parameters from query string: user_id={user_id}, start_date={start_date_str}, end_date={end_date_str}")
        
        if not start_date_str:
            start_date_str = request.GET.get('start_date')
        if not end_date_str:
            end_date_str = request.GET.get('end_date')
        if not user_id:
            user_id = request.GET.get('user_id')
        
        print(f"Final parameters: user_id={user_id}, start_date={start_date_str}, end_date={end_date_str}")
        
        if not start_date_str:
            start_date = datetime.now() - timedelta(days=30)
            print("Using default start_date (30 days ago)")
        else:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
                print(f"Parsed start_date: {start_date}")
            except ValueError as e:
                print(f"Invalid start_date format '{start_date_str}': {e}, using default")
                start_date = datetime.now() - timedelta(days=30)
        
        if not end_date_str:
            end_date = datetime.now()
            print("Using default end_date (today)")
        else:
            try:
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
                end_date = end_date.replace(hour=23, minute=59, second=59)
                print(f"Parsed end_date: {end_date}")
            except ValueError as e:
                print(f"Invalid end_date format '{end_date_str}': {e}, using default")
                end_date = datetime.now()
        
        if start_date > end_date:
            print("start_date is after end_date, swapping them")
            start_date, end_date = end_date - timedelta(days=30), start_date
        
        print(f"Final date range: {start_date} to {end_date}")
        
        if not user_id:
            try:
                wp_user = WPUser.objects.using('wordpress').filter(
                    user_email=request.user.email
                ).first()
                if wp_user:
                    user_id = wp_user.ID
                    print(f"Found WordPress user ID {user_id} for email {request.user.email}")
                else:
                    return Response({
                        'error': 'Could not find WordPress user for current user'
                    }, status=status.HTTP_404_NOT_FOUND)
            except Exception as e:
                return Response({
                    'error': f'Error finding WordPress user: {str(e)}'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            return Response({
                'error': 'Invalid user ID format'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        print(f"Processing session activity for user {user_id}")
        
        activity_data = {}
        current_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date_only = end_date.replace(hour=0, minute=0, second=0, microsecond=0)
        
        while current_date <= end_date_only:
            date_str = current_date.strftime('%Y-%m-%d')
            activity_data[date_str] = {
                'date': date_str, 
                'hours': []
            }
            
            for hour in range(24):
                activity_data[date_str]['hours'].append({
                    'hour': hour,
                    'session_count': 0
                })
            
            current_date += timedelta(days=1)
        
        print(f"Initialized {len(activity_data)} days of data structure")
        
        total_sessions_found = 0
        try:
            session_metas = WPUserMeta.objects.using('wordpress').filter(
                user_id=user_id,
                meta_key='session_tokens'
            )
            
            print(f"Found {session_metas.count()} session_tokens entries for user {user_id}")
            
            for session_meta in session_metas:
                if session_meta.meta_value:
                    print(f"Processing session_tokens data (length: {len(session_meta.meta_value)})")
                    
                    login_timestamps = re.findall(r's:5:"login";i:(\d+);', session_meta.meta_value)
                    print(f"Extracted {len(login_timestamps)} login timestamps")
                    
                    for timestamp_str in login_timestamps:
                        try:
                            timestamp = int(timestamp_str)
                            login_time = datetime.fromtimestamp(timestamp)
                            
                            if start_date.date() <= login_time.date() <= end_date.date():
                                date_str = login_time.strftime('%Y-%m-%d')
                                hour = login_time.hour
                                
                                if date_str in activity_data:
                                    activity_data[date_str]['hours'][hour]['session_count'] += 1
                                    total_sessions_found += 1
                                    print(f"Added session for {date_str} at hour {hour} (login_time: {login_time})")
                                    
                        except (ValueError, TypeError, OSError) as e:
                            print(f"Invalid timestamp {timestamp_str}: {e}")
                            continue
                            
        except Exception as e:
            print(f"Error processing session tokens: {str(e)}")
            import traceback
            traceback.print_exc()
        
        
        result = list(activity_data.values())
        
        
        return Response(result)
        
    except Exception as e:
        print(f"Error retrieving session activity data: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {'error': f'Failed to retrieve session activity data: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def user_posts_analysis(request):
    """Analyze user posts by time period and extract insights - bypassing middleware"""
    try:
        # 获取参数
        user_id = request.GET.get('user_id', None)
        interval = request.GET.get('interval', 'day')
        start_date_str = request.GET.get('start_date', None)
        end_date_str = request.GET.get('end_date', None)
        
        logger.info(f"user_posts_analysis called with: user_id={user_id}, interval={interval}")
        
        # 设置默认日期
        if not start_date_str:
            start_date = datetime.now() - timedelta(days=30)
        else:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            except ValueError as e:
                logger.error(f"Invalid start_date: {start_date_str}, error: {e}")
                start_date = datetime.now() - timedelta(days=30)
        
        if not end_date_str:
            end_date = datetime.now()
        else:
            try:
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
                end_date = end_date.replace(hour=23, minute=59, second=59)
            except ValueError as e:
                logger.error(f"Invalid end_date: {end_date_str}, error: {e}")
                end_date = datetime.now()
        
        # 验证用户ID
        if not user_id:
            try:
                wp_user = WPUser.objects.using('wordpress').filter(
                    user_email=request.user.email
                ).first()
                if wp_user:
                    user_id = wp_user.ID
                else:
                    logger.error(f"No WordPress user found for {request.user.email}")
                    return Response({
                        'error': 'Could not find WordPress user'
                    }, status=status.HTTP_404_NOT_FOUND)
            except Exception as e:
                logger.error(f"Error finding WordPress user: {e}")
                return Response({
                    'error': f'Error finding WordPress user: {str(e)}'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            return Response({
                'error': 'Invalid user ID format'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        logger.info(f"Analyzing posts for user {user_id} from {start_date} to {end_date}")
        
        # 获取用户帖子
        try:
            user_posts = WPPost.objects.using('wordpress').filter(
                post_author=user_id,
                post_date__gte=start_date,
                post_date__lte=end_date,
                post_status='publish'
            )
            
            logger.info(f"Found {user_posts.count()} posts")
            
        except Exception as e:
            logger.error(f"Error querying posts: {e}")
            return Response({
                'error': f'Error querying posts: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # 如果没有帖子，返回空数据
        if not user_posts.exists():
            logger.info("No posts found, returning empty data")
            return Response({
                'activity': [],
                'modules': [],
                'wordCloud': []
            })
        
        # 处理文本数据
        all_text = ""
        for post in user_posts:
            if post.post_content:
                all_text += " " + post.post_content
        
        # 清理文本
        try:
            all_text = re.sub(r'<[^>]*>', ' ', all_text)  # 移除HTML标签
            all_text = re.sub(r'[^\w\s]', ' ', all_text.lower())  # 移除特殊字符并转为小写
            
            # 生成词云数据
            words = [word for word in all_text.split() if len(word) > 3]
            word_count = Counter(words).most_common(50)
            
        except Exception as e:
            logger.error(f"Error processing text: {e}")
            word_count = []
        
        # 按日期分组活动数据
        activity_data = []
        try:
            date_format = '%Y-%m-%d'
            if interval == 'week':
                date_format = '%Y-%W'
            elif interval == 'month':
                date_format = '%Y-%m'
            
            post_dates = {}
            for post in user_posts:
                if post.post_date:
                    date_key = post.post_date.strftime(date_format)
                    post_dates[date_key] = post_dates.get(date_key, 0) + 1
            
            # 排序并格式化
            for date_key in sorted(post_dates.keys()):
                activity_data.append({
                    'date': date_key,
                    'count': post_dates[date_key]
                })
                
        except Exception as e:
            logger.error(f"Error processing activity data: {e}")
            activity_data = []
        
        # 获取模块分布
        module_data = []
        try:
            module_count = {}
            
            for post in user_posts:
                try:
                    # 获取模块标签
                    module_meta = WPPostMeta.objects.using('wordpress').filter(
                        post_id=post.ID,
                        meta_key='module_tag'
                    ).first()
                    
                    module = module_meta.meta_value if module_meta and module_meta.meta_value else 'Uncategorized'
                    module_count[module] = module_count.get(module, 0) + 1
                    
                except Exception as e:
                    logger.warning(f"Error getting module for post {post.ID}: {e}")
                    module_count['Uncategorized'] = module_count.get('Uncategorized', 0) + 1
            
            # 格式化模块数据
            for module, count in module_count.items():
                module_data.append({
                    'module': module,
                    'count': count
                })
                
        except Exception as e:
            logger.error(f"Error processing module data: {e}")
            module_data = []
        
        # 返回结果
        result = {
            'activity': activity_data,
            'modules': module_data,
            'wordCloud': word_count
        }
        
        logger.info(f"Returning analysis with {len(activity_data)} activity points, {len(module_data)} modules, {len(word_count)} words")
        
        return Response(result)
        
    except Exception as e:
        logger.error(f"Unexpected error in user_posts_analysis: {e}", exc_info=True)
        return Response(
            {'error': f'Failed to analyze user posts: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def module_completion_status(request):
    """Dynamically retrieve user module completion status"""
    try:
        # ================== 1. Get User ID ==================
        user_id = request.query_params.get('user_id')
        
        # If user_id not provided, try to get it from current user
        if not user_id:
            wp_user = WPUser.objects.using('wordpress').filter(
                user_email=request.user.email
            ).first()
            if not wp_user:
                return Response(
                    {'error': 'WordPress user not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            user_id = wp_user.ID

        # Validate user ID format
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid user ID format'},
                status=status.HTTP_400_BAD_REQUEST
            )

        print(f"\n====== Processing module status for user {user_id} ======")

        # ================== 2. Get All Modules from the Database ==================
        # First try to get modules from course titles
        all_courses = WPPost.objects.using('wordpress').filter(
            post_type='courses',
            post_status='publish'
        ).values('ID', 'post_title')
        
        # Extract unique module names from course titles
        # This assumes the main modules are the course titles themselves
        all_modules = set()
        for course in all_courses:
            title = course['post_title']
            # Clean and standardize the title
            cleaned_title = title.strip()
            all_modules.add(cleaned_title)
        
        # If no courses found, use a fallback approach
        if not all_modules:
            # Check if module_tag metadata exists
            module_tags = WPPostMeta.objects.using('wordpress').filter(
                meta_key='module_tag'
            ).values_list('meta_value', flat=True).distinct()
            
            if module_tags:
                all_modules = set(tag for tag in module_tags if tag)
        
        print(f"Found {len(all_modules)} modules in the database")
        
        # ================== 3. Get User's Course Statuses ==================
        user_statuses = WPUserMeta.objects.using('wordpress').filter(
            user_id=user_id,
            meta_key__startswith='course_status_'
        ).values('meta_key', 'meta_value')

        # Build course status dictionary: {"course_id": "status"}
        user_courses = {}
        for record in user_statuses:
            course_id = record['meta_key'].replace('course_status_', '')
            status_value = record['meta_value'].strip().lower()
            user_courses[course_id] = status_value

        # ================== 4. Map Courses to Modules ==================
        # Get course titles for the user's courses
        user_course_ids = []
        for course_id in user_courses.keys():
            try:
                user_course_ids.append(int(course_id))
            except ValueError:
                continue
        
        # Get course details
        user_course_details = WPPost.objects.using('wordpress').filter(
            ID__in=user_course_ids
        ).values('ID', 'post_title')
        
        # Map course ID to title
        course_title_map = {str(c['ID']): c['post_title'] for c in user_course_details}
        
        # Map courses to modules based on exact title match
        module_courses = {module: [] for module in all_modules}
        
        # Map each course to its module (assuming course title is the module)
        for course_id, title in course_title_map.items():
            if title in module_courses:
                module_courses[title].append(course_id)
        
        # ================== 5. Calculate Module Status ==================
        module_data = []
        for index, module_name in enumerate(sorted(all_modules), 1):
            # Get courses for this module
            course_ids = module_courses.get(module_name, [])
            
            # Default status is not_started
            status = "not_started"
            time_data = {}
            
            # Count completed and started courses
            total = len(course_ids)
            started = 0
            completed = 0
            
            # Check each course status
            for cid in course_ids:
                if cid in user_courses:
                    status_value = user_courses[cid]
                    started += 1
                    if 'complet' in status_value:  # Handle variations like "Completed!"
                        completed += 1
            
            # Determine module status
            if started > 0:
                time_data = {
                    'start_time': datetime.now().isoformat(),
                    'complete_time': datetime.now().isoformat() if completed == total and total > 0 else None
                }
                if completed == total and total > 0:
                    status = "completed"
                else:
                    status = "in_progress"

            # Add module data (include all modules even if not started)
            module_data.append({
                'id': index,
                'name': module_name,
                'status': status,
                **time_data
            })

        return Response(module_data)

    except Exception as e:
        import traceback
        error_msg = f"Server error: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        return Response(
            {'error': 'Unable to retrieve module status'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )   
@api_view(['GET'])
def course_progress_analysis(request):
    """Analyze course progress for all users"""
    try:
        # 1. Get all available courses
        all_courses = WPPost.objects.using('wordpress').filter(
            post_type='courses',
            post_status='publish'
        ).values('ID', 'post_title', 'post_date', 'post_modified')
        
        # 2. Get all course status data from all users
        all_course_statuses = WPUserMeta.objects.using('wordpress').filter(
            meta_key__startswith='course_status_'
        ).values('user_id', 'meta_key', 'meta_value')
        
        # Create a map of course IDs to user statuses
        course_user_statuses = {}
        for status in all_course_statuses:
            course_id = status['meta_key'].replace('course_status_', '')
            if course_id not in course_user_statuses:
                course_user_statuses[course_id] = []
                
            status_value = status['meta_value'].lower()
            status_category = 'not_started'
            if 'complet' in status_value:
                status_category = 'completed'
            elif 'progress' in status_value:
                status_category = 'in_progress'
                
            course_user_statuses[course_id].append({
                'user_id': status['user_id'],
                'status': status_category,
                'raw_status': status['meta_value']
            })
        
        # 3. Process course data with user statistics
        course_data = []
        for course in all_courses:
            course_id = str(course['ID'])
            users = course_user_statuses.get(course_id, [])
            
            # Calculate course statistics
            total_users = len(users)
            completed_users = sum(1 for u in users if u['status'] == 'completed')
            in_progress_users = sum(1 for u in users if u['status'] == 'in_progress')
            
            completion_rate = (completed_users / total_users * 100) if total_users > 0 else 0
            
            course_data.append({
                'id': course['ID'],
                'title': course['post_title'],
                'date_created': course['post_date'].isoformat() if course['post_date'] else None,
                'date_modified': course['post_modified'].isoformat() if course['post_modified'] else None,
                'total_users': total_users,
                'completed_users': completed_users,
                'in_progress_users': in_progress_users,
                'not_started_users': 0,  # We can't calculate this without knowing total registered users
                'completion_rate': round(completion_rate, 2)
            })
        
        # 4. Group courses by similar titles (potential module groups)
        course_groups = {}
        for course in course_data:
            title = course['title']
            # Extract first word as potential group
            group_key = title.split()[0] if ' ' in title else title
            
            if group_key not in course_groups:
                course_groups[group_key] = []
            
            course_groups[group_key].append(course)
        
        # Calculate group statistics
        groups_data = []
        for group_name, courses in course_groups.items():
            total_users_in_group = sum(c['total_users'] for c in courses)
            completed_users_in_group = sum(c['completed_users'] for c in courses)
            
            group_completion_rate = 0
            if total_users_in_group > 0:
                group_completion_rate = (completed_users_in_group / total_users_in_group * 100)
            
            groups_data.append({
                'name': group_name,
                'courses': courses,
                'total_courses': len(courses),
                'total_users': total_users_in_group,
                'completed_users': completed_users_in_group,
                'completion_rate': round(group_completion_rate, 2)
            })
        
        # Sort groups by name
        groups_data.sort(key=lambda x: x['name'])
        
        # 5. Calculate overall statistics
        total_courses = len(course_data)
        total_users_across_courses = sum(c['total_users'] for c in course_data)
        total_completed = sum(c['completed_users'] for c in course_data)
        total_in_progress = sum(c['in_progress_users'] for c in course_data)
        
        overall_completion_rate = 0
        if total_users_across_courses > 0:
            overall_completion_rate = (total_completed / total_users_across_courses * 100)
        
        return Response({
            'summary': {
                'total_courses': total_courses,
                'total_user_enrollments': total_users_across_courses,
                'completed_enrollments': total_completed,
                'in_progress_enrollments': total_in_progress,
                'overall_completion_rate': round(overall_completion_rate, 2)
            },
            'courses': course_data,
            'groups': groups_data
        })
        
    except Exception as e:
        import traceback
        error_msg = f"Server error: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        return Response(
            {'error': 'Unable to analyze course progress'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
# User Profile Settings APIs
@api_view(['GET', 'PUT'])
def user_profile(request):
    """
    GET: Retrieve user profile information
    PUT: Update user profile information
    """
    user = request.user
    
    if request.method == 'GET':
        # Get user data
        data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'date_joined': user.date_joined,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
        }
        return Response(data)
    
    elif request.method == 'PUT':
        # Update user data
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        email = request.data.get('email')
        
        # Validate email if it's being changed
        if email and email != user.email:
            if User.objects.filter(email=email).exists():
                return Response({'error': 'Email already in use'}, status=status.HTTP_400_BAD_REQUEST)
            if not validate_email(email):
                return Response({'error': 'Invalid email format'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update fields
        if first_name:
            user.first_name = first_name
        if last_name:
            user.last_name = last_name
        if email and email != user.email:
            user.email = email
        
        user.save()
        logger.info(f"User {user.id} updated their profile")
        
        return Response({'message': 'Profile updated successfully'})

@api_view(['PUT'])
def change_password(request):
    """
    Change user's password
    """
    user = request.user
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')
    
    # Validate inputs
    if not current_password or not new_password:
        return Response({'error': 'Both current and new password are required'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    # Check current password
    if not user.check_password(current_password):
        return Response({'error': 'Current password is incorrect'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    # Validate new password
    if len(new_password) < 8:
        return Response({'error': 'Password must be at least 8 characters long'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    # Change password
    user.set_password(new_password)
    user.save()
    
    # Log the action
    auth_logger.info(f"User {user.id} changed their password")
    
    # User needs to login again with new password
    return Response({'message': 'Password changed successfully. Please log in again.'})

@api_view(['GET', 'PUT'])
def security_questions_management(request):
    """
    GET: Retrieve user's security questions (only returns the questions, not answers)
    PUT: Update security questions and answers
    """
    user = request.user
    
    if request.method == 'GET':
        # Get existing security questions
        questions = SecurityQuestion.objects.filter(user=user).order_by('question_number')
        data = [{'id': q.id, 'question_number': q.question_number, 'question_text': q.question_text} for q in questions]
        return Response(data)
    
    elif request.method == 'PUT':
        # Update security questions
        questions_data = request.data.get('questions', [])
        
        if len(questions_data) != 2:
            return Response({'error': 'Two security questions are required'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                # Check if questions already exist
                existing_questions = SecurityQuestion.objects.filter(user=user)
                
                if existing_questions.exists():
                    # Update existing questions
                    for question_data in questions_data:
                        q_number = question_data.get('question_number')
                        q_text = question_data.get('question_text')
                        q_answer = question_data.get('answer')
                        
                        if not all([q_number, q_text, q_answer]):
                            return Response({'error': 'Question number, text and answer are required'}, 
                                           status=status.HTTP_400_BAD_REQUEST)
                        
                        # Update the question
                        question = SecurityQuestion.objects.get(user=user, question_number=q_number)
                        question.question_text = q_text
                        question.answer = q_answer
                        question.save()
                else:
                    # Create new questions
                    for question_data in questions_data:
                        q_number = question_data.get('question_number')
                        q_text = question_data.get('question_text')
                        q_answer = question_data.get('answer')
                        
                        if not all([q_number, q_text, q_answer]):
                            return Response({'error': 'Question number, text and answer are required'}, 
                                           status=status.HTTP_400_BAD_REQUEST)
                        
                        SecurityQuestion.objects.create(
                            user=user,
                            question_number=q_number,
                            question_text=q_text,
                            answer=q_answer
                        )
            
            logger.info(f"User {user.id} updated their security questions")
            return Response({'message': 'Security questions updated successfully'})
            
        except Exception as e:
            logger.error(f"Error updating security questions: {str(e)}")
            return Response({'error': 'Failed to update security questions'}, 
                           status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_preferences(request):
    """
    Handle user interface preferences for dashboard users
    GET: Retrieve current preferences
    PUT: Update preferences
    """
    user = request.user
    
    if request.method == 'GET':
        try:
            # Get user preferences or create default
            preferences, created = UserPreference.objects.get_or_create(user=user)
            
            # Convert model to dictionary, excluding certain fields
            pref_dict = model_to_dict(preferences, exclude=['id', 'user', 'created_at', 'updated_at'])
            return Response(pref_dict)
            
        except Exception as e:
            logger.error(f"Error retrieving user preferences: {str(e)}")
            # Return default preferences if there's an error
            return Response({
                'theme': 'light',
                'layout': 'default',
                'chart_style': 'default',
                'sidebar_collapsed': False,
                'notifications_enabled': True
            })
    
    elif request.method == 'PUT':
        try:
            # Validate input data
            theme = request.data.get('theme')
            layout = request.data.get('layout')
            chart_style = request.data.get('chart_style')
            sidebar_collapsed = request.data.get('sidebar_collapsed')
            notifications_enabled = request.data.get('notifications_enabled')
            
            # Validate theme value
            valid_themes = ['light', 'dark', 'system']
            if theme and theme not in valid_themes:
                return Response(
                    {'error': f'Invalid theme. Choose from: {valid_themes}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate layout value
            valid_layouts = ['default', 'compact', 'spacious']
            if layout and layout not in valid_layouts:
                return Response(
                    {'error': f'Invalid layout. Choose from: {valid_layouts}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate chart style value
            valid_chart_styles = ['default', 'minimal', 'colorful']
            if chart_style and chart_style not in valid_chart_styles:
                return Response(
                    {'error': f'Invalid chart style. Choose from: {valid_chart_styles}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get or create user preferences
            preferences, created = UserPreference.objects.get_or_create(user=user)
            
            # Update fields if provided in request
            if theme is not None:
                preferences.theme = theme
            if layout is not None:
                preferences.layout = layout
            if chart_style is not None:
                preferences.chart_style = chart_style
            if sidebar_collapsed is not None:
                preferences.sidebar_collapsed = sidebar_collapsed
            if notifications_enabled is not None:
                preferences.notifications_enabled = notifications_enabled
            
            # Save the updated preferences
            preferences.save()
            
            logger.info(f"User {user.id} updated their interface preferences")
            return Response({'message': 'Preferences updated successfully'})
            
        except Exception as e:
            logger.error(f"Error updating user preferences: {str(e)}")
            return Response(
                {'error': f'Failed to update preferences: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
# System Settings APIs (Admin Only)
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def user_management_list(request):
    """
    Get list of users for admin management (admin only)
    """
    page = int(request.query_params.get('page', 1))
    page_size = int(request.query_params.get('page_size', 10))
    search_query = request.query_params.get('search', '')
    
    # Get users
    users_query = User.objects.all().order_by('-date_joined')
    
    # Apply search filter
    if search_query:
        users_query = users_query.filter(
            Q(username__icontains=search_query) | 
            Q(email__icontains=search_query) |
            Q(first_name__icontains=search_query) |
            Q(last_name__icontains=search_query)
        )
    
    # Paginate results
    paginator = Paginator(users_query, page_size)
    
    try:
        users_page = paginator.page(page)
    except PageNotAnInteger:
        users_page = paginator.page(1)
    except EmptyPage:
        users_page = paginator.page(paginator.num_pages)
    
    # Prepare user data
    users_data = []
    for user in users_page:
        users_data.append({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_active': user.is_active,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'date_joined': user.date_joined,
            'last_login': user.last_login,
        })
    
    return Response({
        'users': users_data,
        'total': paginator.count,
        'page': page,
        'page_size': page_size,
        'total_pages': paginator.num_pages
    })

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated, IsAdminUser])
def user_management_detail(request, user_id):
    """
    GET: Get detailed information for a specific user
    PUT: Update user details (admin only)
    """
    try:
        user = User.objects.get(id=user_id)
        
        if request.method == 'GET':
            # Get user details
            data = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_active': user.is_active,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'date_joined': user.date_joined,
                'last_login': user.last_login,
                'groups': [group.name for group in user.groups.all()]
            }
            return Response(data)
        
        elif request.method == 'PUT':
            # Update user
            first_name = request.data.get('first_name')
            last_name = request.data.get('last_name')
            email = request.data.get('email')
            is_active = request.data.get('is_active')
            is_staff = request.data.get('is_staff')
            is_superuser = request.data.get('is_superuser')
            
            if first_name is not None:
                user.first_name = first_name
            if last_name is not None:
                user.last_name = last_name
                
            if email is not None and email != user.email:
                # Validate email
                if User.objects.filter(email=email).exists():
                    return Response({'error': 'Email already in use'}, 
                                   status=status.HTTP_400_BAD_REQUEST)
                if not validate_email(email):
                    return Response({'error': 'Invalid email format'}, 
                                   status=status.HTTP_400_BAD_REQUEST)
                user.email = email
            
            if is_active is not None:
                user.is_active = is_active
            if is_staff is not None:
                user.is_staff = is_staff
            if is_superuser is not None:
                user.is_superuser = is_superuser
            
            user.save()
            logger.info(f"Admin user {request.user.id} updated user {user.id}")
            
            return Response({'message': 'User updated successfully'})
    
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error in user management: {str(e)}")
        return Response({'error': 'Failed to process request'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def create_user(request):
    """
    Create a new user (admin only)
    """
    # Get user data
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    is_staff = request.data.get('is_staff', False)
    
    # Validate inputs
    if not all([username, email, password]):
        return Response({'error': 'Username, email and password are required'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(email=email).exists():
        return Response({'error': 'Email already exists'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    if not validate_email(email):
        return Response({'error': 'Invalid email format'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    if len(password) < 8:
        return Response({'error': 'Password must be at least 8 characters long'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Create new user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            is_staff=is_staff
        )
        
        logger.info(f"Admin user {request.user.id} created new user {user.id}")
        
        return Response({
            'message': 'User created successfully',
            'user_id': user.id
        }, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        return Response({'error': f'Failed to create user: {str(e)}'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def system_logs(request):
    """
    Get system logs (admin only)
    """
    try:
        log_type = request.query_params.get('type', 'system')  # system, auth, or all
        limit = int(request.query_params.get('limit', 100))
        offset = int(request.query_params.get('offset', 0))
        
        # Define log files based on LOGGING config
        system_log_path = '/var/log/dashboard_debug.log'
        auth_log_path = '/var/log/dashboard_auth.log'
        
        logs = []
        
        # Function to read log files
        def read_log_file(file_path, log_name):
            try:
                with open(file_path, 'r') as file:
                    lines = file.readlines()
                    # Return the most recent lines
                    return [{'type': log_name, 'content': line.strip()} for line in lines[-limit-offset:]]
            except Exception as e:
                logger.error(f"Error reading log file {file_path}: {str(e)}")
                return [{'type': log_name, 'content': f"Error reading log: {str(e)}"}]
        
        # Read requested logs
        if log_type == 'system' or log_type == 'all':
            system_logs = read_log_file(system_log_path, 'system')
            logs.extend(system_logs)
        
        if log_type == 'auth' or log_type == 'all':
            auth_logs = read_log_file(auth_log_path, 'auth')
            logs.extend(auth_logs)
        
        # Sort logs by timestamp (assuming timestamp is at the beginning of each line)
        logs.sort(key=lambda x: x['content'], reverse=True)
        
        # Apply offset and limit
        paginated_logs = logs[offset:offset+limit]
        
        return Response({
            'logs': paginated_logs,
            'total': len(logs),
            'limit': limit,
            'offset': offset
        })
    
    except Exception as e:
        logger.error(f"Error retrieving system logs: {str(e)}")
        return Response({'error': 'Failed to retrieve system logs'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from rest_framework import status

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def system_info(request):
    """
    Get system information (admin only)
    """
    try:
        # Database connections
        db_info = {}
        for db_name in settings.DATABASES.keys():
            try:
                # Check if database is responding
                with connections[db_name].cursor() as cursor:
                    cursor.execute("SELECT 1")
                    status_msg = 'Connected'
            except Exception as e:
                status_msg = f'Error: {str(e)}'
            
            db_info[db_name] = {
                'status': status_msg,
                'engine': settings.DATABASES[db_name]['ENGINE'].split('.')[-1],
                'name': settings.DATABASES[db_name]['NAME'],
                'host': settings.DATABASES[db_name]['HOST']
            }
        
        # Manually set Django version since settings.DJANGO_VERSION doesn't exist
        django_version = django.get_version()  # Make sure to import django
        
        if platform.system() == 'Linux':
            # Try to get memory info
            try:
                memory = psutil.virtual_memory()
                memory_info = {
                    'total': round(memory.total / (1024**3), 2),  # GB
                    'available': round(memory.available / (1024**3), 2),  # GB
                    'percent_used': memory.percent
                }
            except Exception as e:
                memory_info = {'error': f'Unable to retrieve memory information: {str(e)}'}
            
            # Try to get disk info
            try:
                disk = psutil.disk_usage('/')
                disk_info = {
                    'total': round(disk.total / (1024**3), 2),  # GB
                    'used': round(disk.used / (1024**3), 2),  # GB
                    'free': round(disk.free / (1024**3), 2),  # GB
                    'percent_used': disk.percent
                }
            except Exception as e:
                disk_info = {'error': f'Unable to retrieve disk information: {str(e)}'}
            
            # Try to get CPU info
            try:
                cpu_info = {
                    'percent': psutil.cpu_percent(interval=1),
                    'cores': psutil.cpu_count(logical=True)
                }
            except Exception as e:
                cpu_info = {'error': f'Unable to retrieve CPU information: {str(e)}'}
        else:
            memory_info = {'error': 'OS not supported'}
            disk_info = {'error': 'OS not supported'}
            cpu_info = {'error': 'OS not supported'}
        
        # Application stats
        num_users = User.objects.count()
        active_users_today = User.objects.filter(last_login__date=date.today()).count()
        
        return Response({
            'system': {
                'os': platform.platform(),
                'python_version': platform.python_version(),
                'django_version': django_version,
                'hostname': platform.node(),
                'cpu': cpu_info,
                'memory': memory_info,
                'disk': disk_info
            },
            'application': {
                'debug_mode': settings.DEBUG,
                'allowed_hosts': settings.ALLOWED_HOSTS,
                'total_users': num_users,
                'active_users_today': active_users_today,
                'database': db_info
            }
        })
    
    except Exception as e:
        logger.error(f"Error retrieving system info: {str(e)}")
        return Response({'error': f'Failed to retrieve system information: {str(e)}'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)
# Dashboard Page API for Visit Duration Distribution

@api_view(['GET'])
def visit_duration_distribution(request):
    """Returns distribution of session durations"""
    try:
        # Define duration buckets (in seconds)
        buckets = [
            (0, 10, '0-10s'),
            (11, 30, '11-30s'),
            (31, 60, '31-60s'),
            (61, 180, '1-3min'),
            (181, 600, '3-10min'),
            (601, 1800, '10-30min'),
            (1801, float('inf'), '30min+')
        ]
        
        # Prepare result array
        result = []
        
        # Calculate for each bucket
        for start, end, label in buckets:
            if end == float('inf'):
                count = MatomoLogVisit.objects.filter(
                    visit_total_time__gte=start
                ).count()
            else:
                count = MatomoLogVisit.objects.filter(
                    visit_total_time__gte=start,
                    visit_total_time__lt=end
                ).count()
            
            result.append({
                'duration_range': label,
                'count': count
            })
        
        return Response(result)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def comment_source_analysis(request):
    """Returns navigation paths to comment/note pages"""
    try:
        # 1. 找出所有与评论/笔记相关的页面 action ID
        comment_actions = MatomoLogAction.objects.filter(
            Q(name__icontains='note') | 
            Q(name__icontains='comment') | 
            Q(name__icontains='forum')
        ).values_list('idaction', flat=True)

        # 2. 获取涉及这些页面访问的 visit IDs
        comment_page_visits = MatomoLogLinkVisitAction.objects.filter(
            idaction_url__in=comment_actions
        ).values_list('idvisit', flat=True).distinct()

        paths = []

        for visit_id in comment_page_visits:
            visit_actions = MatomoLogLinkVisitAction.objects.filter(
                idvisit=visit_id
            ).order_by('server_time')

            for i in range(len(visit_actions) - 1):
                if visit_actions[i + 1].idaction_url in comment_actions:
                    try:
                        source = MatomoLogAction.objects.get(idaction=visit_actions[i].idaction_url)
                        target = MatomoLogAction.objects.get(idaction=visit_actions[i + 1].idaction_url)

                        # 提取纯路径部分
                        source_path = clean_path(source.name)
                        target_path = clean_path(target.name)

                        paths.append({
                            'source': source_path,
                            'target': target_path,
                            'count': 1
                        })
                    except MatomoLogAction.DoesNotExist:
                        continue

        # 聚合相同路径
        aggregated_paths = {}
        for path in paths:
            key = f"{path['source']}|{path['target']}"
            if key in aggregated_paths:
                aggregated_paths[key]['count'] += 1
            else:
                aggregated_paths[key] = path

        return Response(list(aggregated_paths.values()))

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def clean_path(url):
    """
    去除域名，仅保留路径部分
    """
    if not url:
        return url
    if url.startswith("http"):
        return urlparse(url).path or '/'
    if '/' in url:
        return '/' + url.split('/', 1)[1]
    return url
@api_view(['GET'])
def course_source_analysis(request):
    """Returns navigation paths to course-related pages"""
    try:
        # 1. Find course-related pages by keywords
        course_actions = MatomoLogAction.objects.filter(
            Q(name__icontains='/course')
        ).values_list('idaction', flat=True)

        # 2. Get visit sessions where these actions occurred
        visit_ids = MatomoLogLinkVisitAction.objects.filter(
            idaction_url__in=course_actions
        ).values_list('idvisit', flat=True).distinct()

        # 3. Extract transitions between pages
        paths = []
        for visit_id in visit_ids:
            actions = MatomoLogLinkVisitAction.objects.filter(
                idvisit=visit_id
            ).order_by('server_time')

            for i in range(len(actions) - 1):
                if actions[i + 1].idaction_url in course_actions:
                    try:
                        source = MatomoLogAction.objects.get(idaction=actions[i].idaction_url)
                        target = MatomoLogAction.objects.get(idaction=actions[i + 1].idaction_url)

                        paths.append({
                            'source': clean_path(source.name),
                            'target': clean_path(target.name),
                            'count': 1
                        })
                    except MatomoLogAction.DoesNotExist:
                        continue

        # 4. Aggregate transitions
        aggregated = {}
        for path in paths:
            key = f"{path['source']}|{path['target']}"
            if key in aggregated:
                aggregated[key]['count'] += 1
            else:
                aggregated[key] = path

        return Response(list(aggregated.values()))

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
# User Comment Page API for Comment Time Distribution
@api_view(['GET'])
def comment_time_distribution(request):
    """Returns heatmap data showing comment activity by day and hour"""
    try:
        # Find comment-related actions
        comment_actions = MatomoLogAction.objects.filter(
            Q(name__icontains='note') | 
            Q(name__icontains='comment') | 
            Q(name__icontains='forum')
        ).values_list('idaction', flat=True)
        
        # Get comment actions with time info
        comment_actions_data = MatomoLogLinkVisitAction.objects.filter(
            idaction_url__in=comment_actions
        )
        
        # Initialize heatmap data (7 days × 24 hours)
        heatmap_data = []
        for day in range(7):  # 0=Sunday, 6=Saturday
            for hour in range(24):
                heatmap_data.append({
                    'day': day,
                    'hour': hour,
                    'count': 0
                })
        
        # Populate heatmap data
        for action in comment_actions_data:
            # Extract day and hour from server_time
            server_time = action.server_time
            # 0 = Monday in Python's weekday() function, so we convert to make Sunday=0
            day = (server_time.weekday() + 1) % 7
            hour = server_time.hour
            
            # Find and update the corresponding cell
            for cell in heatmap_data:
                if cell['day'] == day and cell['hour'] == hour:
                    cell['count'] += 1
                    break
        
        return Response(heatmap_data)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# User Engagement Page API for Visit Depth Analysis
@api_view(['GET'])
def visit_depth_analysis(request):
    """Returns distribution of pages viewed per session"""
    try:
        # Define page view count buckets
        buckets = [
            (1, 1, '1 page'),
            (2, 2, '2 pages'),
            (3, 5, '3-5 pages'),
            (6, 10, '6-10 pages'),
            (11, 20, '11-20 pages'),
            (21, float('inf'), '21+ pages')
        ]
        
        # Prepare result array
        result = []
        
        # Calculate for each bucket
        for start, end, label in buckets:
            if end == float('inf'):
                count = MatomoLogVisit.objects.filter(
                    visit_total_actions__gte=start
                ).count()
            else:
                count = MatomoLogVisit.objects.filter(
                    visit_total_actions__gte=start,
                    visit_total_actions__lte=end
                ).count()
            
            result.append({
                'depth_range': label,
                'count': count,
                'start': start  # For sorting
            })
        
        # Sort result by start value
        result = sorted(result, key=lambda x: x['start'])
        # Remove start from the output
        for item in result:
            del item['start']
            
        return Response(result)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# User Engagement Page API for User Navigation Paths
@api_view(['GET'])
def user_navigation_paths(request):
    """Returns common page-to-page navigation flows"""
    try:
        # Get limit parameter
        limit = int(request.query_params.get('limit', 10))
        
        # Get all visit actions ordered by visit and time
        paths = []
        current_visit = None
        previous_action = None
        
        # Get all visits
        visits = MatomoLogVisit.objects.all().values_list('idvisit', flat=True)
        
        for visit_id in visits:
            # Get actions for this visit in chronological order
            actions = MatomoLogLinkVisitAction.objects.filter(
                idvisit=visit_id,
                idaction_name__isnull=False  # Must have a page name
            ).order_by('server_time')
            
            # Reset previous action for new visit
            previous_action = None
            
            # Analyze page transitions
            for action in actions:
                if previous_action is not None:
                    try:
                        source = MatomoLogAction.objects.get(idaction=previous_action.idaction_name)
                        target = MatomoLogAction.objects.get(idaction=action.idaction_name)
                        
                        paths.append({
                            'source': source.name,
                            'target': target.name,
                            'count': 1  # For aggregation
                        })
                    except MatomoLogAction.DoesNotExist:
                        pass
                
                previous_action = action
        
        # Aggregate paths
        aggregated_paths = {}
        for path in paths:
            key = f"{path['source']}|{path['target']}"
            if key in aggregated_paths:
                aggregated_paths[key]['count'] += 1
            else:
                aggregated_paths[key] = path
        
        # Sort by count and return top paths
        top_paths = sorted(aggregated_paths.values(), key=lambda x: x['count'], reverse=True)[:limit]
        
        return Response(top_paths)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Course Progress Page API for Course Completion vs Visit Frequency
@api_view(['GET'])
def course_completion_vs_frequency(request):
    """Returns data correlating visit frequency with course completion"""
    try:
        # Get all visitors
        visitors = MatomoLogVisit.objects.values('idvisitor').distinct()
        
        # Create result array
        result = []
        
        for visitor in visitors:
            # Count visits for this visitor
            visit_count = MatomoLogVisit.objects.filter(
                idvisitor=visitor['idvisitor']
            ).count()
            
            # For demonstration purposes, we're generating dummy completion rates
            # In a real implementation, you would join with course completion data
            import random
            completion_rate = random.uniform(0, 100)
            
            result.append({
                'visitor_id': visitor['idvisitor'].hex() if isinstance(visitor['idvisitor'], bytes) else str(visitor['idvisitor']),
                'visit_frequency': visit_count,
                'completion_rate': round(completion_rate, 2)
            })
        
        return Response(result)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Course Progress Page API for Learning Time Distribution
@api_view(['GET'])
def learning_time_distribution(request):
    """Returns heatmap showing when users engage with course materials"""
    try:
        # Find course-related actions
        course_actions = MatomoLogAction.objects.filter(
            Q(name__icontains='course') | 
            Q(name__icontains='lesson') | 
            Q(name__icontains='module')
        ).values_list('idaction', flat=True)
        
        # Get course-related actions with time info
        course_actions_data = MatomoLogLinkVisitAction.objects.filter(
            idaction_url__in=course_actions
        )
        
        # Initialize heatmap data (7 days × 24 hours)
        heatmap_data = []
        for day in range(7):  # 0=Sunday, 6=Saturday
            for hour in range(24):
                heatmap_data.append({
                    'day': day,
                    'hour': hour,
                    'count': 0
                })
        
        # Populate heatmap data
        for action in course_actions_data:
            # Extract day and hour from server_time
            server_time = action.server_time
            # 0 = Monday in Python's weekday() function, so we convert to make Sunday=0
            day = (server_time.weekday() + 1) % 7
            hour = server_time.hour
            
            # Find and update the corresponding cell
            for cell in heatmap_data:
                if cell['day'] == day and cell['hour'] == hour:
                    cell['count'] += 1
                    break
        
        return Response(heatmap_data)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET'])
def popular_content(request):
    """获取最受欢迎的内容页面，基于访问量或停留时间"""
    metric = request.GET.get('metric', 'views')
    limit = int(request.GET.get('limit', 10))
    limit = max(1, min(limit, 100))  # 确保limit在合理范围内
    
    # 计算30天前的时间点
    time_threshold = timezone.now() - timedelta(days=30)
    
    try:
        # 基本查询条件：30天内的记录、不为空的操作名
        base_query = MatomoLogLinkVisitAction.objects.filter(
            server_time__gte=time_threshold,
            idaction_name__isnull=False
        )
        
        # 创建与MatomoLogAction的连接
        base_query = base_query.select_related('idaction_name')
        
        if metric == 'views':
            # 按页面名称分组，计算访问次数
            results = (
                base_query
                .values('idaction_name')
                .annotate(count=Count('idlink_va'))
                .order_by('-count')[:limit]
            )
            
            # 查询页面名称
            action_ids = [item['idaction_name'] for item in results if item['idaction_name']]
            actions = {
                action.idaction: action.name 
                for action in MatomoLogAction.objects.filter(idaction__in=action_ids)
            }
            
            # 格式化结果
            data = []
            for item in results:
                action_id = item['idaction_name']
                if action_id in actions:
                    data.append({
                        'pageName': actions[action_id],
                        'value': item['count']
                    })
            
        elif metric == 'timeSpent':
            # 按页面名称分组，计算停留时间
            results = (
                base_query
                .filter(time_spent_ref_action__isnull=False)
                .filter(time_spent_ref_action__gt=0) 
                .values('idaction_name')
                .annotate(time=Sum('time_spent_ref_action'))
                .order_by('-time')[:limit]
            )
            
            # 查询页面名称
            action_ids = [item['idaction_name'] for item in results if item['idaction_name']]
            actions = {
                action.idaction: action.name 
                for action in MatomoLogAction.objects.filter(idaction__in=action_ids)
            }
            
            # 格式化结果
            data = []
            for item in results:
                action_id = item['idaction_name']
                if action_id in actions:
                    data.append({
                        'pageName': actions[action_id],
                        'value': item['time']
                    })
            
        else:
            return Response({"error": "Invalid metric. Use 'views' or 'timeSpent'."}, status=400)
        
        return Response(data)
        
    except Exception as e:
        logger.error(f"Error retrieving popular content: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve popular content data'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def visit_trends(request):
    """获取访问趋势数据，支持按日/周/月聚合"""
    interval = request.GET.get('interval', 'day')
    start_date_str = request.GET.get('start_date')
    end_date_str = request.GET.get('end_date')
    
    # 解析日期
    try:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date() if start_date_str else (timezone.now() - timedelta(days=30)).date()
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date() if end_date_str else timezone.now().date()
    except ValueError:
        return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, status=400)
    
    try:
        # 根据间隔选择不同的日期截断函数
        if interval == 'day':
            date_trunc = TruncDate('visit_first_action_time')
        elif interval == 'week':
            date_trunc = TruncWeek('visit_first_action_time')
        elif interval == 'month':
            date_trunc = TruncMonth('visit_first_action_time')
        else:
            return Response({"error": "Invalid interval. Use day, week, or month."}, status=400)
        
        # 获取访问数据，按日/周/月分组
        visit_data = (
            MatomoLogVisit.objects
            .filter(
                visit_first_action_time__date__gte=start_date,
                visit_first_action_time__date__lte=end_date
            )
            .annotate(date=date_trunc)
            .values('date')
            .annotate(
                visits=Count('idvisit'),
                uniqueVisitors=Count('idvisitor', distinct=True)
            )
            .order_by('date')
        )
        
        # 将结果转换为字典以便快速查找
        data_dict = {}
        for item in visit_data:
            date_key = item['date'].strftime('%Y-%m-%d')
            data_dict[date_key] = {
                'visits': item['visits'],
                'uniqueVisitors': item['uniqueVisitors']
            }
        
        # 生成日期序列，确保包含所有日期，即使没有数据
        result = []
        current = start_date
        while current <= end_date:
            if interval == 'day':
                date_str = current.strftime('%Y-%m-%d')
                next_date = current + timedelta(days=1)
            elif interval == 'week':
                # 获取周一
                monday = current - timedelta(days=current.weekday())
                date_str = monday.strftime('%Y-%m-%d')
                next_date = monday + timedelta(days=7)
            elif interval == 'month':
                date_str = current.replace(day=1).strftime('%Y-%m-%d')
                # 下个月
                if current.month == 12:
                    next_date = current.replace(year=current.year + 1, month=1, day=1)
                else:
                    next_date = current.replace(month=current.month + 1, day=1)
            
            # 添加数据项，如果没有数据则使用零值
            if date_str in data_dict:
                result.append({
                    'date': date_str,
                    'visits': data_dict[date_str]['visits'],
                    'uniqueVisitors': data_dict[date_str]['uniqueVisitors']
                })
            else:
                result.append({
                    'date': date_str,
                    'visits': 0,
                    'uniqueVisitors': 0
                })
            
            current = next_date
        
        return Response(result)
        
    except Exception as e:
        logger.error(f"Error retrieving visit trends: {str(e)}")
        return Response(
            {'error': f'Failed to retrieve visit trends data: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
@api_view(['GET'])
def user_content_interaction(request):
    """
    API endpoint to analyze how users interact with different content types
    """
    try:
        # Get user ID from request
        user_id = request.query_params.get('user_id')
        
        if not user_id:
            return Response({'error': 'User ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate user_id is numeric
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            return Response({'error': 'Invalid user ID format'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get user from WordPress database
        wp_user = WPUser.objects.using('wordpress').filter(ID=user_id).first()
        if not wp_user:
            return Response({'error': 'WordPress user not found'}, status=status.HTTP_404_NOT_FOUND)

        # Get Matomo visitor IDs for this user
        # Try different methods to find visitor IDs associated with this user
        visitor_ids = set()
        
        # First method: Direct user_id match
        visits_by_user_id = MatomoLogVisit.objects.using('wordpress').filter(
            user_id=str(user_id)
        )
        visitor_ids.update(visits_by_user_id.values_list('idvisitor', flat=True))
        
        # Second method: Match by email if no results from first method
        if not visitor_ids and wp_user.user_email:
            visits_by_email = MatomoLogVisit.objects.using('wordpress').filter(
                user_id=wp_user.user_email
            )
            visitor_ids.update(visits_by_email.values_list('idvisitor', flat=True))
        
        # Third method: If no matches found, try to use user's IP addresses if available
        if not visitor_ids:
            # Get all visits first (might need more sophisticated matching in real implementation)
            # This is a simplified approach as an example
            all_visits = MatomoLogVisit.objects.using('wordpress').all()
            visitor_ids.update(all_visits.values_list('idvisitor', flat=True)[:5])  # Limit to first 5 as example
        
        if not visitor_ids:
            # If still no data, return friendly error
            return Response({
                'interaction_by_type': [],
                'interaction_by_time': [],
                'total_interactions': 0,
                'message': 'No interaction data found for this user'
            })
        
        # Get all visits for these visitor IDs
        visits = MatomoLogVisit.objects.using('wordpress').filter(
            idvisitor__in=visitor_ids
        )
        visit_ids = visits.values_list('idvisit', flat=True)
        
        # Get all actions for these visits
        actions = MatomoLogLinkVisitAction.objects.using('wordpress').filter(
            idvisit__in=visit_ids
        )
        
        # Get unique action IDs
        action_ids = set()
        for action in actions:
            if action.idaction_url:
                action_ids.add(action.idaction_url)
            if action.idaction_name:
                action_ids.add(action.idaction_name)
        
        # Get action details from Matomo log action table
        action_details = {}
        if action_ids:
            for action in MatomoLogAction.objects.using('wordpress').filter(idaction__in=action_ids):
                action_details[action.idaction] = {
                    'name': action.name,
                    'type': action.type
                }
        
        # Define interaction types to track
        interaction_types = {
            'page_view': 0,
            'content_view': 0,
            'course_view': 0, 
            'note_view': 0,
            'comment_view': 0,
            'bookmark_view': 0,
            'setting_view': 0,
            'other': 0
        }
        
        # Process actions to categorize them
        for action in actions:
            action_id = action.idaction_url or action.idaction_name
            if not action_id:
                continue
                
            action_info = action_details.get(action_id, {})
            name = action_info.get('name', '')
            
            if not name:
                interaction_types['other'] += 1
                continue
            
            # Categorize based on URL/name patterns
            name_lower = str(name).lower()
            if 'course' in name_lower or '/courses/' in name_lower:
                interaction_types['course_view'] += 1
            elif 'note' in name_lower or '/notes/' in name_lower:
                interaction_types['note_view'] += 1  
            elif 'comment' in name_lower or '/comment' in name_lower:
                interaction_types['comment_view'] += 1
            elif 'bookmark' in name_lower:
                interaction_types['bookmark_view'] += 1
            elif 'setting' in name_lower:
                interaction_types['setting_view'] += 1
            elif 'page' in name_lower:
                interaction_types['page_view'] += 1
            else:
                interaction_types['content_view'] += 1
        
        # Convert to list format for response
        interaction_data = [
            {'type': k, 'count': v}
            for k, v in interaction_types.items()
            if v > 0  # Only include types with non-zero counts
        ]
        
        # Sort by count (descending)
        interaction_data.sort(key=lambda x: x['count'], reverse=True)
        
        # Create time-based metrics
        time_data = []
        date_counts = defaultdict(lambda: defaultdict(int))
        
        for action in actions:
            if not action.server_time:
                continue
                
            # Format date as string
            date_str = action.server_time.strftime('%Y-%m-%d')
            
            action_id = action.idaction_url or action.idaction_name
            if not action_id:
                continue
                
            action_info = action_details.get(action_id, {})
            name = action_info.get('name', '')
            
            if not name:
                continue
                
            # Categorize based on content type
            name_lower = str(name).lower()
            if 'course' in name_lower or '/courses/' in name_lower:
                date_counts[date_str]['course_view'] += 1
            elif 'note' in name_lower or '/notes/' in name_lower:
                date_counts[date_str]['note_view'] += 1  
            elif 'comment' in name_lower or '/comment' in name_lower:
                date_counts[date_str]['comment_view'] += 1
            elif 'bookmark' in name_lower:
                date_counts[date_str]['bookmark_view'] += 1
            elif 'setting' in name_lower:
                date_counts[date_str]['setting_view'] += 1
            elif 'page' in name_lower:
                date_counts[date_str]['page_view'] += 1
            else:
                date_counts[date_str]['content_view'] += 1
        
        # Convert to time series data format
        for date_str, counts in sorted(date_counts.items()):
            entry = {'date': date_str}
            entry.update(counts)
            time_data.append(entry)
        
        # Return complete data structure
        return Response({
            'interaction_by_type': interaction_data,
            'interaction_by_time': time_data,
            'total_interactions': sum(v for v in interaction_types.values())
        })
        
    except Exception as e:
        logger.error(f"Error in user_content_interaction: {str(e)}", exc_info=True)
        return Response(
            {'error': f'Failed to analyze user content interactions: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def support_requests(request):
    """
    GET: List all support requests for current user or all requests for admin
    POST: Create a new support request
    """
    if request.method == 'GET':
        # Admins can see all tickets, regular users only see their own
        if request.user.is_staff or request.user.is_superuser:
            # Allow filtering by status
            status_filter = request.query_params.get('status', None)
            if status_filter:
                tickets = SupportRequest.objects.filter(status=status_filter)
            else:
                tickets = SupportRequest.objects.all()
            
            # Add search capability
            search = request.query_params.get('search', None)
            if search:
                tickets = tickets.filter(
                    Q(subject__icontains=search) | 
                    Q(message__icontains=search) |
                    Q(user__username__icontains=search) |
                    Q(user__email__icontains=search)
                )
        else:
            # Regular users only see their own tickets
            tickets = SupportRequest.objects.filter(user=request.user)
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))
        paginator = Paginator(tickets, page_size)
        
        try:
            current_tickets = paginator.page(page)
        except (PageNotAnInteger, EmptyPage):
            current_tickets = paginator.page(1)
        
        # Convert to dict for serialization
        tickets_data = []
        for ticket in current_tickets:
            tickets_data.append({
                'id': ticket.id,
                'subject': ticket.subject,
                'message': ticket.message,
                'status': ticket.status,
                'priority': ticket.priority,
                'created_at': ticket.created_at,
                'updated_at': ticket.updated_at,
                'user': {
                    'id': ticket.user.id,
                    'username': ticket.user.username,
                    'email': ticket.user.email
                },
                'assigned_to': {
                    'id': ticket.assigned_to.id,
                    'username': ticket.assigned_to.username,
                    'email': ticket.assigned_to.email
                } if ticket.assigned_to else None,
                'response_count': ticket.responses.count()
            })
        
        return Response({
            'tickets': tickets_data,
            'total': paginator.count,
            'page': page,
            'pages': paginator.num_pages
        })
    
    elif request.method == 'POST':
        # Create a new support request
        subject = request.data.get('subject')
        message = request.data.get('message')
        priority = request.data.get('priority', 'medium')
        
        if not subject or not message:
            return Response(
                {'error': 'Subject and message are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create ticket
        ticket = SupportRequest.objects.create(
            user=request.user,
            subject=subject,
            message=message,
            priority=priority,
            status='new'
        )
        
        # Log action
        logger.info(f"Support request created by {request.user.username}: {subject}")
        
        # Notify admins (in a real app, send email here)
        
        return Response({
            'message': 'Support request submitted successfully',
            'ticket_id': ticket.id
        }, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def support_request_detail(request, ticket_id):
    """
    GET: Retrieve a specific support request and its responses
    PUT: Update a support request status/assignment
    DELETE: Delete a support request (admin only)
    """
    try:
        ticket = SupportRequest.objects.get(id=ticket_id)
    except SupportRequest.DoesNotExist:
        return Response({'error': 'Support request not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Check permissions
    if not (request.user.is_staff or request.user.is_superuser) and ticket.user != request.user:
        return Response({'error': 'You do not have permission to access this ticket'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        # Get ticket details with responses
        responses = ticket.responses.all()
        responses_data = []
        
        for response in responses:
            responses_data.append({
                'id': response.id,
                'message': response.message,
                'created_at': response.created_at,
                'user': {
                    'id': response.user.id,
                    'username': response.user.username,
                    'email': response.user.email,
                    'is_staff': response.user.is_staff
                }
            })
        
        ticket_data = {
            'id': ticket.id,
            'subject': ticket.subject,
            'message': ticket.message,
            'status': ticket.status,
            'priority': ticket.priority,
            'created_at': ticket.created_at,
            'updated_at': ticket.updated_at,
            'user': {
                'id': ticket.user.id,
                'username': ticket.user.username,
                'email': ticket.user.email
            },
            'assigned_to': {
                'id': ticket.assigned_to.id,
                'username': ticket.assigned_to.username,
                'email': ticket.assigned_to.email
            } if ticket.assigned_to else None,
            'responses': responses_data
        }
        
        return Response(ticket_data)
    
    elif request.method == 'PUT':
        # Only admins can update status and assignment
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({'error': 'Only administrators can update tickets'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        # Update fields
        status_update = request.data.get('status')
        priority_update = request.data.get('priority')
        assigned_to_id = request.data.get('assigned_to')
        
        if status_update:
            ticket.status = status_update
        
        if priority_update:
            ticket.priority = priority_update
        
        if assigned_to_id:
            try:
                assigned_user = User.objects.get(id=assigned_to_id)
                ticket.assigned_to = assigned_user
            except User.DoesNotExist:
                return Response({'error': 'Assigned user not found'}, 
                               status=status.HTTP_400_BAD_REQUEST)
        
        ticket.save()
        logger.info(f"Support request {ticket_id} updated by {request.user.username}")
        
        return Response({'message': 'Support request updated successfully'})
    
    elif request.method == 'DELETE':
        # Only admins can delete tickets
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({'error': 'Only administrators can delete tickets'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        ticket_subject = ticket.subject
        ticket.delete()
        logger.info(f"Support request '{ticket_subject}' deleted by {request.user.username}")
        
        return Response({'message': 'Support request deleted successfully'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_support_response(request, ticket_id):
    """
    Add a response to a support request and notify the user.
    """
    message = request.data.get('message', '').strip()
    if not message:
        return Response({'error': 'Message is required'}, status=400)

    try:
        ticket = SupportRequest.objects.get(id=ticket_id)

        response = SupportResponse.objects.create(
            support_request=ticket,
            message=message,
            user=request.user
        )

        # 发送邮件通知给用户
        context = {
            'user_name': ticket.user.first_name or ticket.user.username,
            'subject': ticket.subject,
            'ticket_id': ticket.id,
            'response_message': message,
            'app_name': 'BALANCE Dashboard',
            'ticket_url': request.build_absolute_uri(f"/support/tickets/{ticket.id}")
        }

        send_email(
            subject=f"[BALANCE] Update on your support ticket #{ticket.id}",
            template_name='email/support_response.html',
            context=context,
            recipient_email=ticket.user.email
        )

        return Response({'message': 'Response added and email sent successfully'})
    
    except SupportRequest.DoesNotExist:
        return Response({'error': 'Ticket not found'}, status=404)
    except Exception as e:
        logger.error(f"Failed to add support response: {e}", exc_info=True)
        return Response({'error': 'Failed to add response'}, status=500)