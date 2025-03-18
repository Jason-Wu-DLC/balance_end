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