from django.contrib import admin
from .models import SecurityQuestion

@admin.register(SecurityQuestion)
class SecurityQuestionAdmin(admin.ModelAdmin):
    list_display = ('user', 'question_number', 'question_text', 'created_at')
    list_filter = ('question_number', 'created_at')
    search_fields = ('user__username', 'user__email', 'question_text')
    date_hierarchy = 'created_at'