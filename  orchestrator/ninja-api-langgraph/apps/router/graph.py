import uuid
from typing import Dict, Any, Optional
from langgraph.graph import StateGraph, START, END

from apps.router.graph_state import SatQueryState
from apps.router.schemas import (
    TaskTypeEnum,
    RoutingDecision,
    ExecutionTrace,
    QueryResponseSchema
)
from apps.router.smart_algorithm import SmartTaskRouter
from apps.router.trace import TraceEngine
from apps.specialists.registry import SpecialistToolRegistry
from apps.audit.models import QueryAuditLog


def _dump_model(model_obj):
    if hasattr(model_obj, "model_dump"):
        return model_obj.model_dump()
    if hasattr(model_obj, "dict"):
        return model_obj.dict()
    return model_obj


# ==========================================
# 1. GRAPH NODES
# ==========================================

def router_node(state: SatQueryState) -> Dict[str, Any]:
    """
    Wraps the existing SmartTaskRouter without modifying its rules or logic.
    """
    query = state["query"]
    images = state.get("images", [])
    decision = SmartTaskRouter.route(query, images)

    return {
        "routing_decision": decision,
        "task": decision.task.value,
        "confidence": decision.confidence,
        "model": decision.model,
        "status": "Incompatible" if not decision.input_valid else "Success",
        "error": decision.error_message if not decision.input_valid else None
    }


def vqa_node(state: SatQueryState) -> Dict[str, Any]:
    """
    Executes the existing VQA & Scene Classification specialist.
    """
    specialist = SpecialistToolRegistry.get_specialist(TaskTypeEnum.VQA)
    if not specialist:
        return {
            "status": "Error",
            "error": "No VQA specialist registered",
            "result": "No VQA specialist registered in registry."
        }

    spec_result = specialist.execute(state["query"], state.get("images", []), state.get("parameters"))
    return {
        "specialist_result": spec_result,
        "model": specialist.name,
        "result": spec_result.get("text", ""),
        "visual_evidence": spec_result.get("evidence", {}),
        "status": spec_result.get("status", "Success")
    }


def grounding_node(state: SatQueryState) -> Dict[str, Any]:
    """
    Executes the existing Object Grounding specialist.
    """
    specialist = SpecialistToolRegistry.get_specialist(TaskTypeEnum.OBJECT_GROUNDING)
    if not specialist:
        return {
            "status": "Error",
            "error": "No Grounding specialist registered",
            "result": "No Grounding specialist registered in registry."
        }

    spec_result = specialist.execute(state["query"], state.get("images", []), state.get("parameters"))
    return {
        "specialist_result": spec_result,
        "model": specialist.name,
        "result": spec_result.get("text", ""),
        "visual_evidence": spec_result.get("evidence", {}),
        "status": spec_result.get("status", "Success")
    }


def change_detection_node(state: SatQueryState) -> Dict[str, Any]:
    """
    Executes the existing Bi-Temporal Change Detection specialist / stub.
    """
    specialist = SpecialistToolRegistry.get_specialist(TaskTypeEnum.CHANGE_DETECTION)
    if not specialist:
        return {
            "status": "Error",
            "error": "No Change Detection specialist registered",
            "result": "No Change Detection specialist registered in registry."
        }

    spec_result = specialist.execute(state["query"], state.get("images", []), state.get("parameters"))
    return {
        "specialist_result": spec_result,
        "model": specialist.name,
        "result": spec_result.get("text", ""),
        "visual_evidence": spec_result.get("evidence", {}),
        "status": spec_result.get("status", "Success")
    }


def result_node(state: SatQueryState) -> Dict[str, Any]:
    """
    Synthesizes the final execution trace, preserves frontend schema contracts,
    and logs the transaction to the SQLite audit database.
    """
    req_id = state.get("request_id") or str(uuid.uuid4())[:8]
    query = state["query"]
    images = state.get("images", [])
    decision = state.get("routing_decision")
    spec_result = state.get("specialist_result") or {}
    status = state.get("status", "Success")
    error_msg = state.get("error")
    model_name = state.get("model") or (decision.model if decision else "None")

    # Incompatible / Rejection path
    if decision and not decision.input_valid:
        exec_trace = TraceEngine.create_standard_trace(
            request_id=req_id,
            query=query,
            images=images,
            decision=decision,
            exec_status="Incompatible",
            result_details=error_msg or decision.error_message or "Input context failed validation.",
            exec_duration_ms=5.0
        )
        final_result = error_msg or decision.error_message or "Input incompatible with requested task."
        visual_evidence = {}
    elif decision and decision.task == TaskTypeEnum.UNSUPPORTED:
        exec_trace = TraceEngine.create_standard_trace(
            request_id=req_id,
            query=query,
            images=images,
            decision=decision,
            exec_status="Incompatible",
            result_details=decision.error_message or "Unsupported task intent.",
            exec_duration_ms=2.0
        )
        final_result = decision.error_message or "Unsupported task intent."
        visual_evidence = {}
    else:
        # Successful / Specialist executed path
        duration_ms = spec_result.get("duration_ms", 100.0)
        final_result = state.get("result") or spec_result.get("text", "")
        visual_evidence = state.get("visual_evidence") or spec_result.get("evidence", {})
        
        exec_trace = TraceEngine.create_standard_trace(
            request_id=req_id,
            query=query,
            images=images,
            decision=decision,
            exec_status=status,
            result_details=f"Result successfully synthesized from {model_name} via LangGraph.",
            exec_duration_ms=duration_ms
        )

    # Persist audit record
    try:
        QueryAuditLog.objects.create(
            request_id=req_id,
            user_query=query,
            task=decision.task.value if decision else "unknown",
            model=model_name,
            task_confidence=decision.confidence if decision else 0.0,
            input_valid=decision.input_valid if decision else False,
            execution_status=status,
            result=final_result,
            visual_evidence=visual_evidence,
            execution_trace=_dump_model(exec_trace),
            total_duration_ms=exec_trace.total_duration_ms
        )
    except Exception as e:
        print(f"Warning: Failed to save LangGraph audit log: {e}")

    return {
        "request_id": req_id,
        "model": model_name,
        "result": final_result,
        "visual_evidence": visual_evidence,
        "execution_trace": exec_trace,
        "status": status
    }


# ==========================================
# 2. CONDITIONAL ROUTER
# ==========================================

def select_specialist_node(state: SatQueryState) -> str:
    """
    Conditional edge evaluator based strictly on state['routing_decision'].
    """
    decision = state.get("routing_decision")
    if not decision or not decision.input_valid:
        return "result_node"

    task = decision.task
    if task in [TaskTypeEnum.VQA, TaskTypeEnum.SCENE_CLASSIFICATION]:
        return "vqa_node"
    elif task == TaskTypeEnum.OBJECT_GROUNDING:
        return "grounding_node"
    elif task == TaskTypeEnum.CHANGE_DETECTION:
        return "change_detection_node"
    else:
        return "result_node"


# ==========================================
# 3. BUILD AND COMPILE GRAPH
# ==========================================

def build_satquery_graph() -> Any:
    workflow = StateGraph(SatQueryState)

    # Add Nodes
    workflow.add_node("router_node", router_node)
    workflow.add_node("vqa_node", vqa_node)
    workflow.add_node("grounding_node", grounding_node)
    workflow.add_node("change_detection_node", change_detection_node)
    workflow.add_node("result_node", result_node)

    # Add Edges
    workflow.add_edge(START, "router_node")

    workflow.add_conditional_edges(
        "router_node",
        select_specialist_node,
        {
            "vqa_node": "vqa_node",
            "grounding_node": "grounding_node",
            "change_detection_node": "change_detection_node",
            "result_node": "result_node"
        }
    )

    workflow.add_edge("vqa_node", "result_node")
    workflow.add_edge("grounding_node", "result_node")
    workflow.add_edge("change_detection_node", "result_node")
    workflow.add_edge("result_node", END)

    return workflow.compile()


satquery_graph = build_satquery_graph()


def run_satquery_graph(
    query: str,
    images: Optional[list] = None,
    parameters: Optional[dict] = None,
    request_id: Optional[str] = None
) -> QueryResponseSchema:
    """
    Convenience executor invoking the compiled LangGraph and returning QueryResponseSchema.
    """
    req_id = request_id or str(uuid.uuid4())[:8]
    initial_state: SatQueryState = {
        "request_id": req_id,
        "query": query,
        "images": images or [],
        "parameters": parameters or {},
        "status": "Running"
    }

    final_state = satquery_graph.invoke(initial_state)

    decision = final_state.get("routing_decision")
    return QueryResponseSchema(
        request_id=req_id,
        task=decision.task.value if decision else "unsupported",
        model=final_state.get("model") or (decision.model if decision else "None"),
        task_confidence=decision.confidence if decision else 0.0,
        execution_status=final_state.get("status", "Success"),
        result=final_state.get("result", ""),
        visual_evidence=final_state.get("visual_evidence", {}),
        execution_trace=final_state.get("execution_trace")
    )
