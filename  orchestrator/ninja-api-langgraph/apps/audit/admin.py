from django.contrib import admin
from apps.audit.models import QueryAuditLog


@admin.register(QueryAuditLog)
class QueryAuditLogAdmin(admin.ModelAdmin):
    list_display = ('request_id', 'task', 'model', 'task_confidence', 'execution_status', 'total_duration_ms', 'created_at')
    list_filter = ('task', 'execution_status', 'created_at')
    search_fields = ('request_id', 'user_query', 'result')
    readonly_fields = ('request_id', 'created_at')
