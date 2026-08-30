from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict

class BoundingBox(BaseModel):
    id: str | int
    label: str
    confidence: float
    bbox: List[float]
    area: Optional[str] = None
    color: Optional[str] = "#06b6d4"

class VqaRequest(BaseModel):
    query: str
    image_b64: Optional[str] = None
    coordinates: Optional[List[float]] = None

class VqaResponse(BaseModel):
    answer: str
    detections: List[BoundingBox]
    latency_ms: float
    model_invoked: str

class ChangeDetectionRequest(BaseModel):
    t1_image_b64: Optional[str] = None
    t2_image_b64: Optional[str] = None
    task_preset: Optional[str] = "urban_change"

class ChangeDetectionResponse(BaseModel):
    altered_area_km2: float
    delta_percent: float
    risk_level: str
    summary: str
    mask_b64: Optional[str] = None

class AgenticTraceResponse(BaseModel):
    routed_pipeline: str
    intent_confidence: float
    dag_steps: List[Dict[str, Any]]