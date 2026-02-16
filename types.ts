
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
    uri: string;
    title?: string;
  };
}

export interface StudioDeliverable {
  content: string;
  reasoningPath?: string;
  images?: string[];
  audioUrl?: string;
  variations?: StrategicVariation[];
  sources?: GroundingSource[];
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
