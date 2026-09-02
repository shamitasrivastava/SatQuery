from typing import TypedDict, Optional, List, Dict, Any
from apps.router.schemas import ImageInputMetadata, RoutingDecision, ExecutionTrace


class SatQueryState(TypedDict, total=False):
    """
    Typed graph state for the SatQuery LangGraph orchestration pipeline.
    Carries query, images, routing decision, specialist results, and execution trace.
    """
    request_id: str
    query: str
    images: List[ImageInputMetadata]
    parameters: Optional[Dict[str, Any]]
    routing_decision: Optional[RoutingDecision]
    task: Optional[str]
    confidence: Optional[float]
    model: Optional[str]
    specialist_result: Optional[Dict[str, Any]]
    result: Optional[str]
    visual_evidence: Optional[Dict[str, Any]]
    execution_trace: Optional[ExecutionTrace]
    status: str  # "Success", "Incompatible", "Error"
    error: Optional[str]
