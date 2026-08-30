export type AnalysisMode = 'single' | 'swipe' | 'diff';

export type TaskType = 
  | 'SINGLE_IMAGE_RS_VQA_GROUNDING'
  | 'BI_TEMPORAL_CHANGE_DETECTION'
  | 'URBAN_CHANGE_SEGMENTATION'
  | 'BURN_SCAR_ASSESSMENT';

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

export interface ChangeMetrics {
  areaKm2: string;
  relativeDeltaPercent: string;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  waterInundationPercent: number;
  agriculturalLossPercent: number;
  settlementImpactPercent: number;
  executiveSummary: string;
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
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  detectionIds?: Array<number | string>;
  modelUsed?: string;
}