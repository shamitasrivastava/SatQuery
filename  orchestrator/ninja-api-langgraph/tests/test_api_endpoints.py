import json
import pytest
from django.test import Client
from apps.audit.models import QueryAuditLog


@pytest.mark.django_db
def test_health_endpoint():
    client = Client()
    response = client.get('/api/health')
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "specialist_tools" in data
    assert "vqa" in data["specialist_tools"]


@pytest.mark.django_db
def test_classify_dry_run_endpoint():
    client = Client()
    payload = {
        "query": "Where are the airplanes located?",
        "image_count": 1,
        "image_formats": ["png"]
    }
    response = client.post('/api/classify', data=json.dumps(payload), content_type='application/json')
    assert response.status_code == 200
    data = response.json()
    assert data["task"] == "object_grounding"
    assert data["confidence"] >= 0.85
    assert data["input_valid"] is True


@pytest.mark.django_db
def test_query_vqa_flow():
    client = Client()
    payload = {
        "query": "How many airplanes are visible in the image?"
    }
    response = client.post('/api/query', data=json.dumps(payload), content_type='application/json')
    assert response.status_code == 200
    data = response.json()
    
    # Check top-level response
    assert data["task"] == "vqa"
    assert data["execution_status"] == "Success"
    assert "airplane" in data["result"].lower() or "airplanes" in data["result"].lower()
    
    # Check 6-step execution trace
    trace = data["execution_trace"]
    assert trace["status"] == "Success"
    assert len(trace["events"]) == 6
    assert trace["events"][0]["event"] == "Query Received"
    assert trace["events"][1]["event"] == "Task Identification"
    assert trace["events"][2]["event"] == "Input Validation"
    assert trace["events"][3]["event"] == "Tool Selection"
    assert trace["events"][4]["event"] == "Model Execution"
    assert trace["events"][5]["event"] == "Result Generation"

    # Verify audit log saved to SQLite DB
    log = QueryAuditLog.objects.get(request_id=data["request_id"])
    assert log.task == "vqa"
    assert log.execution_status == "Success"


@pytest.mark.django_db
def test_query_change_detection_flow():
    client = Client()
    payload = {
        "query": "What changed between these two satellite images?",
        "parameters": {
            "images": [
                "C:\\geochat\\bi-temporal\\setquiery-model\\satquery-cd-api\\sample_data\\before.png",
                "C:\\geochat\\bi-temporal\\setquiery-model\\satquery-cd-api\\sample_data\\after.png"
            ]
        }
    }
    response = client.post('/api/query', data=json.dumps(payload), content_type='application/json')
    assert response.status_code == 200
    data = response.json()
    assert data["task"] == "change_detection"
    assert data["execution_status"] == "Success"
    assert "change" in data["result"].lower() or "region" in data["result"].lower()
