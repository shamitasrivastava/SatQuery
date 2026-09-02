import json
import pytest
from django.test import Client
from apps.router.graph import run_satquery_graph
from apps.router.schemas import ImageInputMetadata


@pytest.mark.django_db
def test_langgraph_vqa_flow():
    """
    Test Case 1: VQA query -> routes to vqa_node and executes specialist.
    """
    img = ImageInputMetadata(id="i1", filename="demo_images/train_2956_0001.png")
    resp = run_satquery_graph("What is visible in this image?", images=[img])

    assert resp.task == "vqa"
    assert resp.execution_status == "Success"
    assert len(resp.result) > 0
    assert resp.execution_trace is not None
    assert len(resp.execution_trace.events) == 6


@pytest.mark.django_db
def test_langgraph_grounding_flow():
    """
    Test Case 2: Grounding query -> routes to grounding_node.
    """
    img = ImageInputMetadata(id="i1", filename="demo_images/train_2956_0001.png")
    resp = run_satquery_graph("Where is the building located?", images=[img])

    assert resp.task == "object_grounding"
    assert resp.execution_status == "Success"
    assert resp.task_confidence >= 0.85


@pytest.mark.django_db
def test_langgraph_explicit_identify_tag():
    """
    Test Case 3: Explicit [identify] tag -> routes to grounding_node with high confidence.
    """
    img = ImageInputMetadata(id="i1", filename="demo_images/04444.png")
    resp = run_satquery_graph("[identify] the airport <8><26><22><37>", images=[img])

    assert resp.task == "object_grounding"
    assert resp.task_confidence >= 0.95


@pytest.mark.django_db
def test_langgraph_change_detection_two_images():
    """
    Test Case 4: Change Detection with 2 images -> routes to change_detection_node.
    """
    img1 = ImageInputMetadata(id="i1", filename="t1.png")
    img2 = ImageInputMetadata(id="i2", filename="t2.png")
    resp = run_satquery_graph("What changed between these two images?", images=[img1, img2])

    assert resp.task == "change_detection"
    assert resp.execution_status == "Success"
    assert "urban expansion" in resp.result.lower()


@pytest.mark.django_db
def test_langgraph_change_detection_one_image_rejection():
    """
    Test Case 5: Change Detection with only 1 image -> input_valid=False rejection preserved.
    """
    img1 = ImageInputMetadata(id="i1", filename="t1.png")
    resp = run_satquery_graph("What changed between these two images?", images=[img1])

    assert resp.task == "change_detection"
    assert resp.execution_status == "Incompatible"
    assert "requires at least 2 temporal images" in resp.result


@pytest.mark.django_db
def test_langgraph_unsupported_query():
    """
    Test Case 6: Ambiguous/Unsupported query -> handled cleanly by result_node.
    """
    resp = run_satquery_graph("qwertyuiop asdfghjkl")

    assert resp.task == "unsupported"
    assert resp.execution_status == "Incompatible"


@pytest.mark.django_db
def test_api_graph_endpoint_equivalence():
    """
    Test Case 7: Verifies POST /api/query/graph endpoint and compares with baseline.
    """
    client = Client()
    payload = {"query": "How many airplanes are visible in the image?"}

    # Test baseline endpoint
    resp_base = client.post('/api/query', data=json.dumps(payload), content_type='application/json')
    assert resp_base.status_code == 200
    data_base = resp_base.json()

    # Test LangGraph endpoint
    resp_graph = client.post('/api/query/graph', data=json.dumps(payload), content_type='application/json')
    assert resp_graph.status_code == 200
    data_graph = resp_graph.json()

    # Assert equivalent contracts
    assert data_graph["task"] == data_base["task"]
    assert data_graph["model"] == data_base["model"]
    assert data_graph["execution_status"] == data_base["execution_status"]
    assert len(data_graph["execution_trace"]["events"]) == len(data_base["execution_trace"]["events"])
