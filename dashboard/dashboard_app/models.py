from django.db import models
from django.contrib.auth.models import User


#  WordPress 用户表
class WPUser(models.Model):
    ID = models.BigAutoField(primary_key=True)  # 用户 ID，自增主键
    user_login = models.CharField(max_length=60, default="")
    user_pass = models.CharField(max_length=255, default="")  # 加密存储密码
    user_nicename = models.CharField(max_length=50, default="")
    user_email = models.EmailField(unique=True, max_length=100, default="")
    user_url = models.URLField(max_length=100, default="")
    user_registered = models.DateTimeField(auto_now_add=True)  # 注册时间
    user_activation_key = models.CharField(max_length=255, default="")
    user_status = models.IntegerField(default=0)
    display_name = models.CharField(max_length=250, default="")

    class Meta:
        db_table = 'bl_users'  # 关联 WordPress 表
        managed = False
        app_label = 'wordpress'  # 只读模式，Django 不会修改表结构


#  WordPress 用户 Meta 数据表
class WPUserMeta(models.Model):
    umeta_id = models.BigAutoField(primary_key=True)  # 主键
    user = models.ForeignKey(WPUser, on_delete=models.CASCADE, db_column='user_id', to_field='ID')  # 关联用户
    meta_key = models.CharField(max_length=255, null=True, blank=True)
    meta_value = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'bl_usermeta'
        managed = False
        app_label = 'wordpress'  # 只读模式


#  统计用户登录次数（通过 `wp_usermeta`）
class WPUserLoginActivity(models.Model):
    user = models.ForeignKey(WPUser, on_delete=models.CASCADE, db_column='user_id', to_field='ID')  # 关联用户
    login_count = models.IntegerField()

    class Meta:
        db_table = 'bl_usermeta'  # 仍然使用 wp_usermeta 记录
        managed = False
        app_label = 'wordpress'

class WPTerms(models.Model):
    term_id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=200)
    slug = models.CharField(max_length=200)
    term_group = models.BigIntegerField()

    class Meta:
        db_table = 'bl_terms'
        managed = False
        app_label = 'wordpress'  # 只读模式
#  统计评论（反馈消息）
class WPComments(models.Model):
    comment_ID = models.BigAutoField(primary_key=True)  # 评论 ID
    comment_post_ID = models.BigIntegerField(default=0)  # 关联的文章 ID
    comment_author = models.TextField()  # 评论作者
    comment_author_email = models.CharField(max_length=100, default="")  # 作者邮箱
    comment_content = models.TextField(null=True, blank=True)  # 评论内容
    comment_date = models.DateTimeField(auto_now_add=True)  # 评论时间
    user = models.ForeignKey(WPUser, on_delete=models.SET_NULL, null=True, blank=True, db_column='user_id', to_field='ID')  # 关联用户

    class Meta:
        db_table = 'bl_comments'
        managed = False
        app_label = 'wordpress'  # 只读模式

    
# Security Question Model for storing user security questions and answers
class SecurityQuestion(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='security_questions')
    question_number = models.IntegerField()  # 1 or 2 for first or second question
    question_text = models.CharField(max_length=255)
    answer = models.CharField(max_length=255)  # Store hashed answers in production
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'question_number']
        

class WPPost(models.Model):
    """
    WordPress posts table model (bl_posts).
    Contains main note data including title, content, date, etc.
    """
    ID = models.BigAutoField(primary_key=True)
    post_title = models.TextField()
    post_content = models.TextField()
    post_date = models.DateTimeField()
    post_author = models.BigIntegerField()
    post_status = models.CharField(max_length=20)
    post_type = models.CharField(max_length=20)
    post_date_gmt = models.DateTimeField(null=True, blank=True)
    post_excerpt = models.TextField(blank=True)
    post_password = models.CharField(max_length=255, blank=True)
    post_name = models.CharField(max_length=200)
    post_modified = models.DateTimeField()
    post_modified_gmt = models.DateTimeField()
    guid = models.CharField(max_length=255)
    
    class Meta:
        managed = False  # Django won't manage this table
        db_table = 'bl_posts'  # Actual table name in WordPress database
        app_label = 'wordpress'  # App label to use with database router




class WPPostMeta(models.Model):
    """
    WordPress post meta table model (bl_postmeta).
    Contains metadata for posts such as module tags, note types, and image references.
    """
    meta_id = models.BigAutoField(primary_key=True)
    post = models.ForeignKey(
        WPPost, 
        on_delete=models.CASCADE, 
        db_column='post_id',
        related_name='meta'
    )
    meta_key = models.CharField(max_length=255, blank=True, null=True)
    meta_value = models.TextField(blank=True, null=True)

    class Meta:
        managed = False  # Django won't manage this table
        db_table = 'bl_postmeta'  # Actual table name in WordPress database
        app_label = 'wordpress'  # App label to use with database router
        indexes = [
            models.Index(fields=['post', 'meta_key']),
        ]

class UserPreference(models.Model):
    """Store user interface preferences for dashboard users"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='preferences')
    theme = models.CharField(max_length=20, default='light')
    layout = models.CharField(max_length=20, default='default')
    chart_style = models.CharField(max_length=20, default='default')
    sidebar_collapsed = models.BooleanField(default=False)
    notifications_enabled = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username}'s preferences"
    
class MatomoLogVisit(models.Model):
    idvisit = models.CharField(max_length=255)
    idsite = models.IntegerField()
    idvisitor = models.CharField(max_length=255)
    visit_last_action_time = models.DateTimeField()
    config_id = models.CharField(max_length=255)
    location_ip = models.CharField(max_length=255)
    last_idlink_va = models.CharField(max_length=255, null=True, blank=True)
    custom_dimension_1 = models.CharField(max_length=255, null=True, blank=True)
    custom_dimension_2 = models.CharField(max_length=255, null=True, blank=True)
    custom_dimension_3 = models.CharField(max_length=255, null=True, blank=True)
    custom_dimension_4 = models.CharField(max_length=255, null=True, blank=True)
    custom_dimension_5 = models.CharField(max_length=255, null=True, blank=True)
    profilable = models.BooleanField(default=True)
    user_id = models.CharField(max_length=255, null=True, blank=True)
    visit_first_action_time = models.DateTimeField()
    visit_goal_buyer = models.BooleanField(default=False)
    visit_goal_converted = models.BooleanField(default=False)
    visitor_returning = models.BooleanField(default=False)
    visitor_seconds_since_first = models.IntegerField(default=0)
    visitor_seconds_since_order = models.IntegerField(default=0)
    visitor_count_visits = models.IntegerField(default=0)
    visit_entry_idaction_name = models.CharField(max_length=255, null=True, blank=True)
    visit_entry_idaction_url = models.CharField(max_length=255, null=True, blank=True)
    visit_exit_idaction_name = models.CharField(max_length=255, null=True, blank=True)
    visit_exit_idaction_url = models.CharField(max_length=255, null=True, blank=True)
    visit_total_actions = models.IntegerField(default=0)
    visit_total_interactions = models.IntegerField(default=0)
    visit_total_searches = models.IntegerField(default=0)
    referer_keyword = models.CharField(max_length=255, null=True, blank=True)
    referer_name = models.CharField(max_length=255, null=True, blank=True)
    referer_type = models.CharField(max_length=255, null=True, blank=True)
    referer_url = models.CharField(max_length=255, null=True, blank=True)
    location_browser_lang = models.CharField(max_length=255, null=True, blank=True)
    config_browser_engine = models.CharField(max_length=255, null=True, blank=True)
    config_browser_name = models.CharField(max_length=255, null=True, blank=True)
    config_browser_version = models.CharField(max_length=255, null=True, blank=True)
    config_client_type = models.CharField(max_length=255, null=True, blank=True)
    config_device_brand = models.CharField(max_length=255, null=True, blank=True)
    config_device_model = models.CharField(max_length=255, null=True, blank=True)
    config_device_type = models.CharField(max_length=255, null=True, blank=True)
    config_os = models.CharField(max_length=255, null=True, blank=True)
    config_os_version = models.CharField(max_length=255, null=True, blank=True)
    visit_total_events = models.IntegerField(default=0)
    visitor_localtime = models.DateTimeField(null=True, blank=True)
    visitor_seconds_since_last = models.IntegerField(default=0)
    config_resolution = models.CharField(max_length=255, null=True, blank=True)
    config_cookie = models.BooleanField(default=False)
    config_flash = models.BooleanField(default=False)
    config_java = models.BooleanField(default=False)
    config_pdf = models.BooleanField(default=False)
    config_quicktime = models.BooleanField(default=False)
    config_realplayer = models.BooleanField(default=False)
    config_silverlight = models.BooleanField(default=False)
    config_windowsmedia = models.BooleanField(default=False)
    visit_total_time = models.IntegerField(default=0)
    location_city = models.CharField(max_length=255, null=True, blank=True)
    location_country = models.CharField(max_length=255, null=True, blank=True)
    location_latitude = models.FloatField(null=True, blank=True)
    location_longitude = models.FloatField(null=True, blank=True)
    location_region = models.CharField(max_length=255, null=True, blank=True)
    class Meta:
        managed = False 
        db_table = 'bl_matomo_log_visit' 
        app_label = 'wordpress'

class MatomoLogAction(models.Model):
    idaction = models.IntegerField(primary_key=True)  
    name = models.CharField(max_length=255) 
    hash = models.BigIntegerField() 
    type = models.IntegerField()
    url_prefix = models.CharField(max_length=255, null=True, blank=True)
    class Meta:
        managed = False 
        db_table = 'bl_matomo_log_action' 
        app_label = 'wordpress'

class MatomoLogLinkVisitAction(models.Model):
    # Primary key for the action link
    idlink_va = models.BigIntegerField(primary_key=True, unique=True, null=False, db_index=True, auto_created=True)

    # Foreign key reference to another site or action
    idsite = models.IntegerField(null=False, db_index=True)

    # Visitor ID (binary format)
    idvisitor = models.BinaryField(max_length=8, null=False)

    # Visit ID (link to a specific visit action)
    idvisit = models.BigIntegerField(null=False, db_index=True)

    # Reference for action URL (nullable)
    idaction_url_ref = models.IntegerField(null=True, default=0)

    # Reference for action name (nullable)
    idaction_name_ref = models.IntegerField(null=True)

    # Custom float value for specific use cases (nullable)
    custom_float = models.FloatField(null=True)

    # Position of the pageview (for sequence of views on the same page)
    pageview_position = models.IntegerField(null=True, default=None)

    # Time spent on the page or during the interaction (in seconds)
    time_spent = models.IntegerField(null=True)

    # Custom dimensions (could be used for any additional custom attributes)
    custom_dimension_1 = models.CharField(max_length=255, null=True, blank=True)
    custom_dimension_2 = models.CharField(max_length=255, null=True, blank=True)
    custom_dimension_3 = models.CharField(max_length=255, null=True, blank=True)
    custom_dimension_4 = models.CharField(max_length=255, null=True, blank=True)
    custom_dimension_5 = models.CharField(max_length=255, null=True, blank=True)

    # Server time (when the action was logged)
    server_time = models.DateTimeField(null=False)

    # Page ID (could be used for tracking specific pages)
    idpageview = models.CharField(max_length=6, null=True, blank=True)

    # Action name ID (reference to specific action names)
    idaction_name = models.IntegerField(null=True)

    # Action URL ID (reference to specific action URLs)
    idaction_url = models.IntegerField(null=True)

    # Search category for actions related to searches
    search_cat = models.CharField(max_length=200, null=True, blank=True)

    # Search count (how many times this action was part of a search)
    search_count = models.IntegerField(null=True)

    # Time spent on a referenced action
    time_spent_ref_action = models.IntegerField(null=True)

    # Product category IDs (up to 5 levels of categories)
    idaction_product_cat = models.IntegerField(null=True)
    idaction_product_cat2 = models.IntegerField(null=True)
    idaction_product_cat3 = models.IntegerField(null=True)
    idaction_product_cat4 = models.IntegerField(null=True)
    idaction_product_cat5 = models.IntegerField(null=True)

    # Product name ID and other related product details
    idaction_product_name = models.IntegerField(null=True)
    product_price = models.FloatField(null=True)
    idaction_product_sku = models.IntegerField(null=True)

    # Event action and category details for interaction tracking
    idaction_event_action = models.IntegerField(null=True)
    idaction_event_category = models.IntegerField(null=True)

    # Content interaction details for content-based actions
    idaction_content_interaction = models.IntegerField(null=True)
    idaction_content_name = models.IntegerField(null=True)
    idaction_content_piece = models.IntegerField(null=True)
    idaction_content_target = models.IntegerField(null=True)

    # Timing details for various processing times during the interaction
    time_dom_completion = models.IntegerField(null=True)
    time_dom_processing = models.IntegerField(null=True)
    time_network = models.IntegerField(null=True)
    time_on_load = models.IntegerField(null=True)
    time_server = models.IntegerField(null=True)
    time_transfer = models.IntegerField(null=True)
    class Meta:
        managed = False 
        db_table = 'bl_matomo_log_link_visit_action' 
        app_label = 'wordpress'

class SupportRequest(models.Model):
    STATUS_CHOICES = (
        ('new', 'New'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    )
    
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='support_requests')
    subject = models.CharField(max_length=200)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    assigned_to = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        related_name='assigned_tickets', 
        null=True, 
        blank=True
    )
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.subject} ({self.status})"


class SupportResponse(models.Model):
    support_request = models.ForeignKey(
        SupportRequest, 
        on_delete=models.CASCADE, 
        related_name='responses'
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Response to {self.support_request.subject} by {self.user.username}"