from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class TaskTypeEnum(str, Enum):
    VQA = "vqa"
    OBJECT_GROUNDING = "object_grounding"
    CHANGE_DETECTION = "change_detection"
    SCENE_CLASSIFICATION = "scene_classification"
    UNSUPPORTED = "unsupported"


class ImageFormatEnum(str, Enum):
    GEOTIFF = "geotiff"
    TIFF = "tiff"
    PNG = "png"
    JPEG = "jpeg"
    JPG = "jpg"
    UNKNOWN = "unknown"


class ImageModalityEnum(str, Enum):
    OPTICAL = "optical"
    SAR = "sar"
    MULTISPECTRAL = "multispectral"
    UNKNOWN = "unknown"


class ImageInputMetadata(BaseModel):
    id: str = Field(..., description="Unique image identifier")
    filename: str = Field(..., description="Original filename")
    format: str = Field(default="png", description="Image format e.g. geotiff, png")
    modality: str = Field(default="optical", description="Modality e.g. optical, sar")
    width: Optional[int] = Field(default=None, description="Image width in pixels")
    height: Optional[int] = Field(default=None, description="Image height in pixels")
    channels: Optional[int] = Field(default=3, description="Number of channels")
    timestamp: Optional[str] = Field(default=None, description="Image timestamp (ISO 8601)")


class QueryRequestSchema(BaseModel):
    query: str = Field(..., description="Natural language user query")
    parameters: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Inference parameters (e.g. temperature, max_tokens)")


class ClassifyRequestSchema(BaseModel):
    query: str = Field(..., description="User query to classify")
    image_count: int = Field(default=1, description="Number of uploaded images")
    image_formats: Optional[List[str]] = Field(default_factory=lambda: ["png"], description="Image formats")


class RoutingDecision(BaseModel):
    task: TaskTypeEnum = Field(..., description="Identified remote sensing task")
    model: str = Field(..., description="Selected specialist AI model or tool")
    confidence: float = Field(..., description="Task selection confidence score (0.0 to 1.0)")
    reason: str = Field(..., description="Explainable reason for routing decision")
    input_valid: bool = Field(default=True, description="Whether input context matches task requirements")
    error_message: Optional[str] = Field(default=None, description="Validation failure details if incompatible")


class TraceEvent(BaseModel):
    step: int = Field(..., description="Step index (1 to N)")
    timestamp: str = Field(..., description="ISO 8601 timestamp")
    event: str = Field(..., description="Name of the trace event")
    status: str = Field(..., description="Status e.g. Success, Warning, Error")
    task: Optional[str] = Field(default=None, description="Current task context")
    model_tool: Optional[str] = Field(default=None, description="Selected specialist tool/model")
    confidence: Optional[float] = Field(default=None, description="Confidence score if applicable")
    details: str = Field(..., description="Detailed description of what occurred")
    duration_ms: Optional[float] = Field(default=None, description="Step execution time in ms")


class ExecutionTrace(BaseModel):
    request_id: str = Field(..., description="Unique transaction ID")
    status: str = Field(..., description="Final execution status: Success / Incompatible / Failed")
    user_query: str = Field(..., description="Original user query")
    total_duration_ms: float = Field(default=0.0, description="Total execution duration in milliseconds")
    events: List[TraceEvent] = Field(default_factory=list, description="Ordered audit trace events")
    summary: str = Field(..., description="Human-readable execution summary for dashboard")


class QueryResponseSchema(BaseModel):
    request_id: str = Field(..., description="Unique transaction ID")
    task: str = Field(..., description="Identified task")
    model: str = Field(..., description="Executed specialist model")
    task_confidence: float = Field(..., description="Router task selection confidence (0.0 - 1.0)")
    execution_status: str = Field(..., description="Status: Success, Incompatible, Error")
    result: str = Field(..., description="Textual result from specialist model")
    visual_evidence: Dict[str, Any] = Field(default_factory=dict, description="Visual evidence: bounding boxes, masks, regions")
    execution_trace: ExecutionTrace = Field(..., description="Complete auditable execution trace")
