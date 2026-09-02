import json
import pytest
from django.test import Client
from apps.router.graph import run_satquery_graph
from apps.router.schemas import ImageInputMetadata
from apps.specialists.registry import SpecialistToolRegistry
from apps.router.schemas import TaskTypeEnum


@pytest.mark.django_db
def test_bitemporal_specialist_registered():
    """
    Asserts that BiTemporalSpecialist is properly registered in SpecialistToolRegistry.
    """
    specialist = SpecialistToolRegistry.get_specialist(TaskTypeEnum.CHANGE_DETECTION)
    assert specialist is not None
    assert "Bitemporal" in specialist.name or "BIT" in specialist.name


@pytest.mark.django_db
def test_bitemporal_dual_image_langgraph_flow():
    """
    Tests end-to-end Change Detection execution with 2 images through LangGraph.
    """
    t1 = ImageInputMetadata(id="t1", filename="sample_data/before.png")
    t2 = ImageInputMetadata(id="t2", filename="sample_data/after.png")
    
    resp = run_satquery_graph("What changed between these two images?", images=[t1, t2])
    
    assert resp.task == "change_detection"
    assert resp.execution_status == "Success"
    assert len(resp.result) > 0
    assert "visual_evidence" in resp.model_dump()
    assert resp.visual_evidence.get("cluster_count", 0) > 0
    assert resp.execution_trace is not None
    assert len(resp.execution_trace.events) == 6


@pytest.mark.django_db
def test_bitemporal_spatial_query_flow():
    """
    Tests specific spatial questions (e.g. location, largest cluster) routed to Bi-Temporal engine.
    """
    t1 = ImageInputMetadata(id="t1", filename="sample_data/before.png")
    t2 = ImageInputMetadata(id="t2", filename="sample_data/after.png")
    
    resp = run_satquery_graph("Where is the change located?", images=[t1, t2])
    
    assert resp.task == "change_detection"
    assert resp.execution_status == "Success"
    assert "quadrant" in resp.result.lower() or "sector" in resp.result.lower() or "region" in resp.result.lower()


@pytest.mark.django_db
def test_bitemporal_single_image_rejection():
    """
    Tests that change detection query with only 1 image is rejected as Incompatible.
    """
    t1 = ImageInputMetadata(id="t1", filename="sample_data/before.png")
    resp = run_satquery_graph("What changed between these two images?", images=[t1])
    
    assert resp.task == "change_detection"
    assert resp.execution_status == "Incompatible"
    assert "requires at least 2 temporal images" in resp.result.lower()


@pytest.mark.django_db
def test_bitemporal_api_endpoints_parity():
    """
    Tests that POST /api/query and POST /api/query/graph produce equivalent change detection responses.
    """
    client = Client()
    payload = {
        "query": "Analyze urban expansion between these two temporal images.",
        "parameters": {
            "images": [
                "C:\\geochat\\bi-temporal\\setquiery-model\\satquery-cd-api\\sample_data\\before.png",
                "C:\\geochat\\bi-temporal\\setquiery-model\\satquery-cd-api\\sample_data\\after.png"
            ]
        }
    }
    
    # Baseline endpoint
    r_base = client.post('/api/query', data=json.dumps(payload), content_type='application/json')
    assert r_base.status_code == 200
    d_base = r_base.json()
    
    # LangGraph endpoint
    r_graph = client.post('/api/query/graph', data=json.dumps(payload), content_type='application/json')
    assert r_graph.status_code == 200
    d_graph = r_graph.json()
    
    assert d_base["task"] == "change_detection"
    assert d_graph["task"] == "change_detection"
    assert d_base["execution_status"] == "Success"
    assert d_graph["execution_status"] == "Success"
    assert len(d_base["execution_trace"]["events"]) == 6
    assert len(d_graph["execution_trace"]["events"]) == 6
