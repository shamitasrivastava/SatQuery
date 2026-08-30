from django.db import models


class QueryAuditLog(models.Model):
    """
    Persists auditable transactions, task planning decisions,
    model execution results, and full step-by-step trace events.
    """
    request_id = models.CharField(max_length=64, unique=True, db_index=True)
    user_query = models.TextField()
    task = models.CharField(max_length=64, db_index=True)
    model = models.CharField(max_length=128)
    task_confidence = models.FloatField(default=0.0)
    input_valid = models.BooleanField(default=True)
    execution_status = models.CharField(max_length=32, db_index=True)
    result = models.TextField(blank=True, default="")
    visual_evidence = models.JSONField(default=dict, blank=True)
    execution_trace = models.JSONField(default=dict, blank=True)
    total_duration_ms = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Query Audit Log"
        verbose_name_plural = "Query Audit Logs"

    def __str__(self):
        return f"[{self.task}] {self.user_query[:40]}... ({self.execution_status})"
