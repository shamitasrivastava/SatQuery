import os
import uuid
import time
from typing import List, Optional
from django.conf import settings
from ninja import Router, File, Form
from ninja.files import UploadedFile
from apps.router.schemas import (
    QueryRequestSchema,
    ClassifyRequestSchema,
    QueryResponseSchema,
    RoutingDecision,
    ImageInputMetadata,
    ExecutionTrace
)
from apps.router.input_handler import InputHandler
from apps.router.smart_algorithm import SmartTaskRouter
from apps.router.trace import TraceEngine
from apps.specialists.registry import SpecialistToolRegistry
from apps.audit.models import QueryAuditLog
from apps.router.graph import run_satquery_graph

router = Router(tags=["Task Router & Query Pipeline"])

UPLOAD_DIR = os.path.join(settings.MEDIA_ROOT, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _dump_model(model_obj):
    if hasattr(model_obj, "model_dump"):
        return model_obj.model_dump()
    if hasattr(model_obj, "dict"):
        return model_obj.dict()
    return model_obj


@router.get("/health", summary="Health Check & Tool Registry Status")
def health_check(request):
    """
    Returns system health status and registered specialist tools.
    """
    tools = SpecialistToolRegistry.list_available_tools()
    return {
        "status": "healthy",
        "service": "SatQuery AI Backend",
        "version": "1.0.0",
        "specialist_tools": tools,
        "langgraph_orchestration": "active"
    }


@router.post("/classify", response=RoutingDecision, summary="Classify Query Intent (Dry Run)")
def classify_query(request, payload: ClassifyRequestSchema):
    """
    Inspects query intent and returns the task planning decision and confidence score
    without executing the specialist model.
    """
    mock_images = [
        ImageInputMetadata(id=f"img_{i}", filename=f"image_{i}.{fmt}", format=fmt)
        for i, fmt in enumerate(payload.image_formats[:payload.image_count])
    ]
    decision = SmartTaskRouter.route(payload.query, mock_images)
    return decision


# ==========================================
# BASELINE ENDPOINTS
# ==========================================

@router.post("/query", response=QueryResponseSchema, summary="Execute Satellite Query (Baseline JSON Path)")
def process_query_json(request, payload: QueryRequestSchema):
    """
    Baseline endpoint processing query with simulated/provided image context.
    """
    req_id = str(uuid.uuid4())[:8]
    image_paths = payload.parameters.get("images", []) if payload.parameters else []
    images: List[ImageInputMetadata] = []

    if image_paths:
        for p in image_paths:
            ok, meta, msg = InputHandler.inspect_image(p, os.path.basename(p))
            if ok and meta:
                meta.filename = p
                images.append(meta)
    else:
        default_img = r"C:\geochat\vqa_grounding\GeoChat\demo_images\train_2956_0001.png"
        images.append(
            ImageInputMetadata(
                id="img_01",
                filename=default_img,
                format="png",
                modality="optical",
                width=1024,
                height=1024
            )
        )

    return _execute_routing_flow(req_id, payload.query, images, payload.parameters)


@router.post("/query/upload", response=QueryResponseSchema, summary="Execute Satellite Query (Baseline Multipart Upload)")
def process_query_upload(
    request,
    query: str = Form(..., description="Natural language satellite query"),
    image_t1: UploadedFile = File(..., description="Primary / Pre-event satellite image (T1) — GeoTIFF, PNG, JPEG"),
    image_t2: Optional[UploadedFile] = File(None, description="Optional Post-event satellite image (T2) for Bi-Temporal comparison"),
    temperature: float = Form(0.6, description="Sampling temperature"),
    max_new_tokens: int = Form(512, description="Max generated tokens")
):
    """
    Baseline endpoint accepting 1 or 2 uploaded images (T1 and optional T2).
    """
    req_id = str(uuid.uuid4())[:8]
    images: List[ImageInputMetadata] = []
    file_list = [image_t1] + ([image_t2] if image_t2 else [])

    for up_file in file_list:
        safe_name = f"{req_id}_{up_file.name}"
        save_path = os.path.join(UPLOAD_DIR, safe_name)
        with open(save_path, "wb") as dest:
            for chunk in up_file.chunks():
                dest.write(chunk)

        ok, meta, err = InputHandler.inspect_image(save_path, up_file.name)
        if ok and meta:
            meta.filename = save_path
            images.append(meta)
        else:
            decision = RoutingDecision(
                task="unsupported",
                model="None",
                confidence=0.0,
                reason="File validation failed",
                input_valid=False,
                error_message=err
            )
            exec_trace = TraceEngine.create_standard_trace(
                request_id=req_id,
                query=query,
                images=[],
                decision=decision,
                exec_status="Error",
                result_details=err,
                exec_duration_ms=2.0
            )
            return QueryResponseSchema(
                request_id=req_id,
                task="unsupported",
                model="None",
                task_confidence=0.0,
                execution_status="Error",
                result=err,
                visual_evidence={},
                execution_trace=exec_trace
            )

    params = {"temperature": temperature, "max_new_tokens": max_new_tokens}
    return _execute_routing_flow(req_id, query, images, params)


# ==========================================
# LANGGRAPH ORCHESTRATED ENDPOINTS
# ==========================================

@router.post("/query/graph", response=QueryResponseSchema, summary="Execute Satellite Query (LangGraph StateGraph JSON)")
def process_query_graph_json(request, payload: QueryRequestSchema):
    """
    LangGraph-orchestrated endpoint executing query through compiled StateGraph.
    """
    req_id = str(uuid.uuid4())[:8]
    image_paths = payload.parameters.get("images", []) if payload.parameters else []
    images: List[ImageInputMetadata] = []

    if image_paths:
        for p in image_paths:
            ok, meta, msg = InputHandler.inspect_image(p, os.path.basename(p))
            if ok and meta:
                meta.filename = p
                images.append(meta)
    else:
        default_img = r"C:\geochat\vqa_grounding\GeoChat\demo_images\train_2956_0001.png"
        images.append(
            ImageInputMetadata(
                id="img_01",
                filename=default_img,
                format="png",
                modality="optical",
                width=1024,
                height=1024
            )
        )

    return run_satquery_graph(
        query=payload.query,
        images=images,
        parameters=payload.parameters,
        request_id=req_id
    )


@router.post("/query/graph/upload", response=QueryResponseSchema, summary="Execute Satellite Query (LangGraph StateGraph Multipart Upload)")
def process_query_graph_upload(
    request,
    query: str = Form(..., description="Natural language satellite query"),
    image_t1: UploadedFile = File(..., description="Primary / Pre-event satellite image (T1) — GeoTIFF, PNG, JPEG"),
    image_t2: Optional[UploadedFile] = File(None, description="Optional Post-event satellite image (T2) for Bi-Temporal comparison"),
    temperature: float = Form(0.6, description="Sampling temperature"),
    max_new_tokens: int = Form(512, description="Max generated tokens")
):
    """
    LangGraph-orchestrated endpoint accepting 1 or 2 uploaded images (T1 Before and optional T2 After).
    """
    req_id = str(uuid.uuid4())[:8]
    images: List[ImageInputMetadata] = []
    file_list = [image_t1] + ([image_t2] if image_t2 else [])

    for up_file in file_list:
        safe_name = f"{req_id}_{up_file.name}"
        save_path = os.path.join(UPLOAD_DIR, safe_name)
        with open(save_path, "wb") as dest:
            for chunk in up_file.chunks():
                dest.write(chunk)

        ok, meta, err = InputHandler.inspect_image(save_path, up_file.name)
        if ok and meta:
            meta.filename = save_path
            images.append(meta)
        else:
            decision = RoutingDecision(
                task="unsupported",
                model="None",
                confidence=0.0,
                reason="File validation failed",
                input_valid=False,
                error_message=err
            )
            exec_trace = TraceEngine.create_standard_trace(
                request_id=req_id,
                query=query,
                images=[],
                decision=decision,
                exec_status="Error",
                result_details=err,
                exec_duration_ms=2.0
            )
            return QueryResponseSchema(
                request_id=req_id,
                task="unsupported",
                model="None",
                task_confidence=0.0,
                execution_status="Error",
                result=err,
                visual_evidence={},
                execution_trace=exec_trace
            )

    params = {"temperature": temperature, "max_new_tokens": max_new_tokens}
    return run_satquery_graph(
        query=query,
        images=images,
        parameters=params,
        request_id=req_id
    )


# ==========================================
# INTERNAL ROUTING FLOW HELPER
# ==========================================

def _execute_routing_flow(
    req_id: str,
    query: str,
    images: List[ImageInputMetadata],
    parameters: Optional[dict] = None
) -> QueryResponseSchema:
    decision = SmartTaskRouter.route(query, images)

    if not decision.input_valid:
        exec_trace = TraceEngine.create_standard_trace(
            request_id=req_id,
            query=query,
            images=images,
            decision=decision,
            exec_status="Incompatible",
            result_details=decision.error_message or "Input context failed validation.",
            exec_duration_ms=5.0
        )
        response_data = QueryResponseSchema(
            request_id=req_id,
            task=decision.task.value,
            model=decision.model,
            task_confidence=decision.confidence,
            execution_status="Incompatible",
            result=decision.error_message or "Input incompatible with requested task.",
            visual_evidence={},
            execution_trace=exec_trace
        )
        QueryAuditLog.objects.create(
            request_id=req_id,
            user_query=query,
            task=decision.task.value,
            model=decision.model,
            task_confidence=decision.confidence,
            input_valid=False,
            execution_status="Incompatible",
            result=response_data.result,
            execution_trace=_dump_model(exec_trace),
            total_duration_ms=exec_trace.total_duration_ms
        )
        return response_data

    specialist = SpecialistToolRegistry.get_specialist(decision.task)
    if not specialist:
        exec_trace = TraceEngine.create_standard_trace(
            request_id=req_id,
            query=query,
            images=images,
            decision=decision,
            exec_status="Error",
            result_details=f"No specialist model found for task '{decision.task.value}'.",
            exec_duration_ms=2.0
        )
        return QueryResponseSchema(
            request_id=req_id,
            task=decision.task.value,
            model=decision.model,
            task_confidence=decision.confidence,
            execution_status="Error",
            result="No specialist model registered for this task.",
            visual_evidence={},
            execution_trace=exec_trace
        )

    spec_result = specialist.execute(query, images, parameters)

    exec_trace = TraceEngine.create_standard_trace(
        request_id=req_id,
        query=query,
        images=images,
        decision=decision,
        exec_status=spec_result["status"],
        result_details=f"Result successfully synthesized from {specialist.name}.",
        exec_duration_ms=spec_result["duration_ms"]
    )

    response_data = QueryResponseSchema(
        request_id=req_id,
        task=decision.task.value,
        model=specialist.name,
        task_confidence=decision.confidence,
        execution_status=spec_result["status"],
        result=spec_result["text"],
        visual_evidence=spec_result.get("evidence", {}),
        execution_trace=exec_trace
    )

    try:
        QueryAuditLog.objects.create(
            request_id=req_id,
            user_query=query,
            task=decision.task.value,
            model=specialist.name,
            task_confidence=decision.confidence,
            input_valid=True,
            execution_status=spec_result["status"],
            result=spec_result["text"],
            visual_evidence=spec_result.get("evidence", {}),
            execution_trace=_dump_model(exec_trace),
            total_duration_ms=exec_trace.total_duration_ms
        )
    except Exception as e:
        print(f"Warning: Failed to save audit log: {e}")

    return response_data
