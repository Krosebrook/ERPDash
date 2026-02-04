
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
  type: AgentType;
  status: 'active' | 'suspended' | 'draft';
  successRate: number;
  avgLatencyMs: number;
  totalTokens: number;
  costUSD: number;
  hitlPending: number;
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

export interface CostBreakdown {
  model: string;
  tokens: number;
  cost: number;
}

export interface AuditLog {
  id: string;
  user: string;
  action: string;
  resource: string;
  status: 'success' | 'failure';
  timestamp: string;
}
