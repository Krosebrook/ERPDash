
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  ENGINEER = 'engineer',
  END_USER = 'end-user'
}

export enum AgentType {
  COPILOT = 'copilot',
  AUTOMATION_BOT = 'automation_bot',
  ANALYST = 'analyst',
  CUSTOM = 'custom'
}

export interface MetricData {
  label: string;
  value: number | string;
  unit: string;
  trend?: 'up' | 'down' | 'flat';
  changePercent?: number;
}

export interface AgentPerformancePoint {
  timestamp: string;
  successRate: number;
  avgLatencyMs: number;
  costUSD: number;
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
  type: AgentType;
  status: 'active' | 'suspended' | 'draft';
  successRate: number;
  avgLatencyMs: number;
  totalTokens: number;
  costUSD: number;
  hitlPending: number;
  model?: string;
  temperature?: number;
  systemInstruction?: string;
  performanceHistory?: AgentPerformancePoint[];
}

export interface TraceSpan {
  id: string;
  timestamp: string;
  spanName: string;
  durationMs: number;
  status: 'ok' | 'error';
  tokens: number;
  cost: number;
  attributes: Record<string, any>;
}

export interface StrategicVariation {
  variantName: string;
  strategicFocus: string;
  pros: string[];
  cons: string[];
  implementationTimeline: string;
  riskScore: number;
  resourceRequirements: string;
}

export interface GroundingSource {
  web?: {
    uri?: string;
    title?: string;
  };
}

export enum DeliverableFormat {
  JPG = 'jpg',
  PNG = 'png',
  VECTOR = 'vector',
  PDF = 'pdf',
  JSON = 'json',
  MARKDOWN = 'markdown'
}

export interface FidelityConfig {
  resolution: '720p' | '1080p' | '4K';
  detailLevel: 'low' | 'medium' | 'high' | 'ultra';
  stylisticGuidelines?: string;
  format: DeliverableFormat;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
  colorProfile?: 'sRGB' | 'Display P3' | 'Adobe RGB';
}

export interface StudioDeliverable {
  content: string;
  reasoningPath?: string;
  images?: string[];
  audioUrl?: string;
  variations?: StrategicVariation[];
  sources?: GroundingSource[];
  fidelityConfig?: FidelityConfig;
  feedback?: string[];
}

export interface AuditLog {
  id: string;
  user: string;
  action: string;
  resource: string;
  status: 'success' | 'failure';
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: number;
  isError?: boolean;
}

export interface KnowledgeDoc {
  id: string;
  name: string;
  type: 'pdf' | 'txt' | 'md' | 'web';
  size: string;
  status: 'indexed' | 'indexing' | 'failed';
  lastUpdated: string;
  vectorCount: number;
  content?: string;
}

export interface SystemAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  source: 'gemini-watchdog' | 'system';
}
