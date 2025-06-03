import logging
from datetime import datetime, timedelta
from django.utils import timezone
from django.http import QueryDict

logger = logging.getLogger(__name__)

class DateParamMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        logger.info("DateParamMiddleware initialized")
        
        # 定义需要排除的API端点（不进行日期处理）
        self.excluded_paths = [
            '/api/session-activity/',
            '/api/user-posts-analysis/',
            '/api/user-content-interaction/',
            '/api/debug-api/',
            '/api/test-session-simple/',
            '/api/debug-session-data/',
        ]
        
        # 定义需要严格日期限制的API端点
        self.strict_date_paths = [
            '/api/user-activity-trends/',
            '/api/note-upload-trends/',
            '/api/analytics/',
        ]

    def __call__(self, request):
        # 检查是否应该处理此请求
        should_process = self._should_process_request(request)
        
        if should_process:
            try:
                # 根据路径类型选择处理方式
                if any(request.path.startswith(strict_path) for strict_path in self.strict_date_paths):
                    self._process_date_params_strict(request)
                else:
                    self._process_date_params_lenient(request)
            except Exception as e:
                # Log error but don't crash the request
                logger.error(f"Error in DateParamMiddleware: {str(e)}")
                # 只在严格模式下设置默认日期
                if any(request.path.startswith(strict_path) for strict_path in self.strict_date_paths):
                    self._set_default_dates(request)
        else:
            logger.debug(f"Skipping DateParamMiddleware for path: {request.path}")
        
        response = self.get_response(request)
        return response
    
    def _should_process_request(self, request):
        """确定是否应该处理此请求"""
        # 不是API请求，跳过
        if not request.path.startswith('/api/'):
            return False
        
        # 在排除列表中，跳过
        if any(request.path.startswith(excluded) for excluded in self.excluded_paths):
            return False
        
        # 检查是否有日期参数
        has_date_params = (
            'start_date' in request.GET or 
            'end_date' in request.GET or
            any(param in request.GET for param in ['from_date', 'to_date', 'date_from', 'date_to'])
        )
        
        return has_date_params
    
    def _process_date_params_strict(self, request):
        """严格模式：强制执行日期限制"""
        logger.debug(f"Processing date params (strict mode) for: {request.path}")
        
        # 获取原始参数
        original_params = {key: request.GET.get(key) for key in request.GET}
        logger.debug(f"Original params: {original_params}")
        
        # Make request.GET mutable
        mutable_get = request.GET.copy()
        
        # 默认日期范围（30天）
        default_start = timezone.now() - timedelta(days=30)
        default_end = timezone.now()
        
        # 最大允许的日期范围（1年）
        max_range_days = 365
        
        # 处理开始日期
        start_date = self._parse_date(
            request.GET.get('start_date') or request.GET.get('from_date'),
            default_start
        )
        
        # 处理结束日期
        end_date = self._parse_date(
            request.GET.get('end_date') or request.GET.get('to_date'),
            default_end
        )
        
        # 应用严格限制
        now = timezone.now()
        
        # 不能是未来日期
        if end_date > now:
            logger.warning(f"End date {end_date} is in future, adjusting to now")
            end_date = now
        
        if start_date > now:
            logger.warning(f"Start date {start_date} is in future, adjusting")
            start_date = now - timedelta(days=30)
        
        # 确保开始日期不晚于结束日期
        if start_date > end_date:
            logger.warning(f"Start date {start_date} > end date {end_date}, adjusting")
            start_date = end_date - timedelta(days=30)
        
        # 限制最大日期范围
        date_range = (end_date - start_date).days
        if date_range > max_range_days:
            logger.warning(f"Date range {date_range} days > {max_range_days}, adjusting")
            start_date = end_date - timedelta(days=max_range_days)
        
        # 更新参数
        date_format = '%Y-%m-%d'
        mutable_get['start_date'] = start_date.strftime(date_format)
        mutable_get['end_date'] = end_date.strftime(date_format)
        
        # 更新备用参数名
        if 'from_date' in request.GET:
            mutable_get['from_date'] = start_date.strftime(date_format)
        if 'to_date' in request.GET:
            mutable_get['to_date'] = end_date.strftime(date_format)
        
        request.GET = mutable_get
        request.parsed_dates = {'start_date': start_date, 'end_date': end_date}
        
        logger.debug(f"Strict processed dates: {start_date.strftime(date_format)} to {end_date.strftime(date_format)}")
    
    def _process_date_params_lenient(self, request):
        """宽松模式：只验证格式，不强制限制"""
        logger.debug(f"Processing date params (lenient mode) for: {request.path}")
        
        # 获取原始参数
        original_params = {key: request.GET.get(key) for key in request.GET}
        logger.debug(f"Original params: {original_params}")
        
        # 只验证日期格式，不修改有效的日期
        mutable_get = request.GET.copy()
        
        # 验证并可能修正开始日期
        start_date_str = request.GET.get('start_date') or request.GET.get('from_date')
        if start_date_str:
            start_date = self._parse_date(start_date_str, None)
            if start_date is None:
                # 只有在解析失败时才设置默认值
                default_start = timezone.now() - timedelta(days=30)
                mutable_get['start_date'] = default_start.strftime('%Y-%m-%d')
                logger.warning(f"Invalid start_date '{start_date_str}', using default")
        
        # 验证并可能修正结束日期
        end_date_str = request.GET.get('end_date') or request.GET.get('to_date')
        if end_date_str:
            end_date = self._parse_date(end_date_str, None)
            if end_date is None:
                # 只有在解析失败时才设置默认值
                default_end = timezone.now()
                mutable_get['end_date'] = default_end.strftime('%Y-%m-%d')
                logger.warning(f"Invalid end_date '{end_date_str}', using default")
        
        request.GET = mutable_get
        logger.debug(f"Lenient mode: minimal changes applied")
    
    def _parse_date(self, date_str, default_date):
        """解析日期字符串，支持多种格式"""
        if not date_str or date_str in ['Invalid date', 'undefined', 'null', '']:
            return default_date
        
        # 尝试多种日期格式
        formats_to_try = [
            '%Y-%m-%d',     # 2025-05-31
            '%m/%d/%Y',     # 05/31/2025
            '%d/%m/%Y',     # 31/05/2025
            '%Y/%m/%d',     # 2025/05/31
            '%d-%m-%Y',     # 31-05-2025
            '%Y-%m-%d %H:%M:%S',  # 2025-05-31 12:00:00
        ]
        
        for date_format in formats_to_try:
            try:
                parsed_date = datetime.strptime(date_str, date_format)
                # 如果解析成功但没有时区信息，假设为当前时区
                if parsed_date.tzinfo is None:
                    parsed_date = timezone.make_aware(parsed_date, timezone.get_current_timezone())
                return parsed_date
            except ValueError:
                continue
        
        # 尝试ISO格式
        try:
            return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        except ValueError:
            pass
        
        # 尝试时间戳
        try:
            # 检查是否是毫秒时间戳
            timestamp = float(date_str)
            if len(date_str) > 10:  # 毫秒时间戳
                timestamp = timestamp / 1000
            return datetime.fromtimestamp(timestamp, tz=timezone.get_current_timezone())
        except (ValueError, TypeError, OverflowError):
            pass
        
        # 如果所有解析都失败，返回默认值
        if default_date is not None:
            logger.warning(f"Could not parse date '{date_str}', using default: {default_date}")
        return default_date
    
    def _set_default_dates(self, request):
        """设置默认日期（仅在错误情况下使用）"""
        default_start = timezone.now() - timedelta(days=30)
        default_end = timezone.now()
        
        mutable_get = request.GET.copy()
        
        # 只有在没有有效日期时才设置默认值
        if 'start_date' not in request.GET or not request.GET['start_date']:
            mutable_get['start_date'] = default_start.strftime('%Y-%m-%d')
        
        if 'end_date' not in request.GET or not request.GET['end_date']:
            mutable_get['end_date'] = default_end.strftime('%Y-%m-%d')
        
        request.GET = mutable_get
        request.parsed_dates = {'start_date': default_start, 'end_date': default_end}
        
        logger.info(f"Set default dates for request to {request.path}")