from django.db import models

# 🎯 WordPress 用户表
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
        db_table = 'wp_users'  # 关联 WordPress 表
        managed = False
        app_label = 'wordpress'  # 只读模式，Django 不会修改表结构

    def __str__(self):
        return self.display_name or self.user_login  # 方便 Django shell 显示

# 🎯 WordPress 用户 Meta 数据表
class WPUserMeta(models.Model):
    umeta_id = models.BigAutoField(primary_key=True)  # 主键
    user = models.ForeignKey(WPUser, on_delete=models.CASCADE, db_column='user_id', to_field='ID')  # 关联用户
    meta_key = models.CharField(max_length=255, null=True, blank=True)
    meta_value = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'wp_usermeta'
        managed = False
        app_label = 'wordpress'  # 只读模式

    def __str__(self):
        return f"{self.user.user_login} - {self.meta_key}: {self.meta_value[:50]}"

# 🎯 统计用户登录次数（通过 `wp_usermeta`）
class WPUserLoginActivity(models.Model):
    user = models.ForeignKey(WPUser, on_delete=models.CASCADE, db_column='user_id', to_field='ID')  # 关联用户
    login_count = models.IntegerField()

    class Meta:
        db_table = 'wp_usermeta'  # 仍然使用 wp_usermeta 记录
        managed = False
        app_label = 'wordpress'


    def __str__(self):
        return f"{self.user.user_login} - Logins: {self.login_count}"

# 🎯 统计评论（反馈消息）
class WPComments(models.Model):
    comment_ID = models.BigAutoField(primary_key=True)  # 评论 ID
    comment_post_ID = models.BigIntegerField(default=0)  # 关联的文章 ID
    comment_author = models.TextField()  # 评论作者
    comment_author_email = models.CharField(max_length=100, default="")  # 作者邮箱
    comment_content = models.TextField(null=True, blank=True)  # 评论内容
    comment_date = models.DateTimeField(auto_now_add=True)  # 评论时间
    user = models.ForeignKey(WPUser, on_delete=models.SET_NULL, null=True, blank=True, db_column='user_id', to_field='ID')  # 关联用户

    class Meta:
        db_table = 'wp_comments'
        managed = False
        app_label = 'wordpress'  # 只读模式

    def __str__(self):
        return f"Comment by {self.comment_author} on {self.comment_date}"
    

class VerificationCode(models.Model):
    """
    验证码模型，用于邮箱验证和密码重置
    """
    email = models.EmailField(verbose_name="邮箱地址")
    code = models.CharField(max_length=6, verbose_name="验证码")
    purpose = models.CharField(max_length=20, choices=[
        ('register', '注册'),
        ('reset_password', '重置密码'),
    ], verbose_name="用途")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    expires_at = models.DateTimeField(verbose_name="过期时间")
    is_used = models.BooleanField(default=False, verbose_name="是否已使用")
    
    class Meta:
        verbose_name = "验证码"
        verbose_name_plural = "验证码列表"
        
    def __str__(self):
        return f"{self.email} - {self.purpose} ({self.code})"
    
    @classmethod
    def generate_code(cls, email, purpose):
        """
        生成新的验证码
        """
        # 生成6位随机数字验证码
        code = ''.join(random.choices(string.digits, k=6))
        
        # 设置过期时间（10分钟后）
        expires_at = datetime.now() + timedelta(minutes=10)
        
        # 如果存在未过期的验证码，先标记为已使用
        cls.objects.filter(
            email=email, 
            purpose=purpose, 
            is_used=False, 
            expires_at__gt=datetime.now()
        ).update(is_used=True)
        
        # 创建新验证码
        verification = cls.objects.create(
            email=email,
            code=code,
            purpose=purpose,
            expires_at=expires_at
        )
        
        return verification
    
    @classmethod
    def verify_code(cls, email, code, purpose):
        """
        验证验证码是否有效
        """
        verification = cls.objects.filter(
            email=email,
            code=code,
            purpose=purpose,
            is_used=False,
            expires_at__gt=datetime.now()
        ).first()
        
        if verification:
            verification.is_used = True
            verification.save()
            return True
        
        return False