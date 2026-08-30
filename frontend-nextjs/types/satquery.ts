export type AnalysisMode = 'single' | 'swipe' | 'diff';

export type TaskType = 
  | 'SINGLE_IMAGE_RS_VQA_GROUNDING'
  | 'BI_TEMPORAL_CHANGE_DETECTION'
  | 'URBAN_CHANGE_SEGMENTATION'
  | 'BURN_SCAR_ASSESSMENT';

export type TaskTypeEnum =
  | 'vqa'
  | 'object_grounding'
  | 'change_detection'
  | 'scene_classification'
  | 'unsupported';

export interface BoundingBoxDetection {
  id: number | string;
  label: string;
  confidence: number;
  bbox: [number, number, number, number]; // [ymin, xmin, ymax, xmax] or [lat1, lng1, lat2, lng2]
  area?: string;
  status?: string;
  category?: string;
  color?: string;
}

export interface MapEntity {
  id: number;
  name: string;
  confidence: number;
  area_m2: number;
  latMin: number;
  lngMin: number;
  latMax: number;
  lngMax: number;
  color: string;
  // Position as % of raster image (0-100)
  xPct?: number;
  yPct?: number;
  wPct?: number;
  hPct?: number;
}

export interface ChangeMetrics {
  areaKm2: string;
  areaM2?: number;
  relativeDeltaPercent: string;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  waterInundationPercent: number;
  agriculturalLossPercent: number;
  settlementImpactPercent: number;
  dominantLocation?: string;
  clusterCount?: number;
  changeType?: string;
  executiveSummary: string;
}

export interface TraceEvent {
  step: number;
  timestamp: string;
  event: string;
  status: string;
  task?: string | null;
  model_tool?: string | null;
  confidence?: number | null;
  details: string;
  duration_ms?: number | null;
}

export interface ExecutionTrace {
  request_id: string;
  status: string;
  user_query: string;
  total_duration_ms: number;
  events: TraceEvent[];
  summary: string;
}

export interface RoutingDecision {
  task: TaskTypeEnum | string;
  model: string;
  confidence: number;
  reason: string;
  input_valid: boolean;
  error_message?: string | null;
}

export interface QueryResponseSchema {
  request_id: string;
  task: string;
  model: string;
  task_confidence: number;
  execution_status: string;
  result: string;
  visual_evidence: Record<string, any>;
  execution_trace?: ExecutionTrace;
}

export interface BackendHealthResponse {
  status: string;
  service: string;
  version: string;
  specialist_tools: Record<string, string>;
  langgraph_orchestration: string;
}

export interface AuditStep {
  stepNumber: number;
  stepName: string;
  latencyMs: number;
  details: string;
  metadata: Record<string, any>;
  status: 'SUCCESS' | 'RUNNING' | 'FAILED';
}

export interface AuditTrace {
  sessionId: string;
  timestamp: string;
  taskType: TaskType;
  intentConfidence: number;
  routerNode: string;
  modelsInvoked: Array<{
    name: string;
    role: string;
    latencyMs: number;
    vramGb?: number;
    tokensGenerated?: number;
  }>;
  steps: AuditStep[];
}

export interface ScenarioPreset {
  id: string;
  name: string;
  subtitle: string;
  coordinates: [number, number];
  zoom: number;
  sensor: string;
  defaultMode: AnalysisMode;
  t1Date?: string;
  t2Date?: string;
  detections: BoundingBoxDetection[];
  changeMetrics?: ChangeMetrics;
  auditTrace: AuditTrace;
  initialPrompt?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system' | 'ai';
  text: string;
  timestamp: string;
  detectionIds?: Array<number | string>;
  modelUsed?: string;
  task?: string;
  confidence?: number;
}