
import { Agent, UserRole, AgentType, TraceSpan, AuditLog } from './types';

export const MOCK_AGENTS: Agent[] = [
  {
    id: 'agent-1',
    name: 'Finance Copilot',
    type: AgentType.COPILOT,
    status: 'active',
    successRate: 98.4,
    avgLatencyMs: 1240,
    totalTokens: 450000,
    costUSD: 12.45,
    hitlPending: 2
  },
  {
    id: 'agent-2',
    name: 'Ops Automation Bot',
    type: AgentType.AUTOMATION_BOT,
    status: 'active',
    successRate: 92.1,
    avgLatencyMs: 4500,
    totalTokens: 1200000,
    costUSD: 45.20,
    hitlPending: 0
  },
  {
    id: 'agent-3',
    name: 'Marketing Analyst',
    type: AgentType.ANALYST,
    status: 'active',
    successRate: 95.5,
    avgLatencyMs: 820,
    totalTokens: 230000,
    costUSD: 5.67,
    hitlPending: 1
  },
  {
    id: 'agent-4',
    name: 'Security Sentinel',
    type: AgentType.AUTOMATION_BOT,
    status: 'suspended',
    successRate: 45.2,
    avgLatencyMs: 2100,
    totalTokens: 89000,
    costUSD: 2.30,
    hitlPending: 5
  },
  {
    id: 'agent-5',
    name: 'Legal Policy Advisor',
    type: AgentType.COPILOT,
    status: 'draft',
    successRate: 0,
    avgLatencyMs: 0,
    totalTokens: 0,
    costUSD: 0.00,
    hitlPending: 0
  },
  {
    id: 'agent-6',
    name: 'Data Pipeline Orchestrator',
    type: AgentType.CUSTOM,
    status: 'active',
    successRate: 99.9,
    avgLatencyMs: 150,
    totalTokens: 5600000,
    costUSD: 112.50,
    hitlPending: 0
  },
  {
    id: 'agent-7',
    name: 'Legacy Support Bot',
    type: AgentType.AUTOMATION_BOT,
    status: 'suspended',
    successRate: 23.5,
    avgLatencyMs: 5400,
    totalTokens: 12000,
    costUSD: 0.50,
    hitlPending: 0
  },
  {
    id: 'agent-8',
    name: 'HR Policy Guide',
    type: AgentType.COPILOT,
    status: 'active',
    successRate: 97.2,
    avgLatencyMs: 1100,
    totalTokens: 340000,
    costUSD: 8.90,
    hitlPending: 0
  }
];

export const MOCK_TRACES: TraceSpan[] = [
  {
    id: 'trace-1',
    timestamp: '2024-05-20T10:00:00Z',
    spanName: 'agent.invoke',
    durationMs: 450,
    status: 'ok',
    tokens: 1200,
    cost: 0.02,
    attributes: { reactStep: 1, tool: 'search' }
  },
  {
    id: 'trace-2',
    timestamp: '2024-05-20T10:05:00Z',
    spanName: 'tool_call',
    durationMs: 120,
    status: 'ok',
    tokens: 450,
    cost: 0.005,
    attributes: { tool: 'calculator' }
  },
  {
    id: 'trace-3',
    timestamp: '2024-05-20T10:06:00Z',
    spanName: 'agent.respond',
    durationMs: 3400,
    status: 'error',
    tokens: 2100,
    cost: 0.035,
    attributes: { error: 'Rate limit hit' }
  },
  {
    id: 'trace-4',
    timestamp: '2024-05-20T10:08:22Z',
    spanName: 'rag.retrieve',
    durationMs: 890,
    status: 'ok',
    tokens: 300,
    cost: 0.001,
    attributes: { vector_db: 'pinecone', hits: 5 }
  },
  {
    id: 'trace-5',
    timestamp: '2024-05-20T10:12:15Z',
    spanName: 'agent.planning',
    durationMs: 2200,
    status: 'ok',
    tokens: 4500,
    cost: 0.08,
    attributes: { model: 'gemini-3-pro' }
  },
  {
    id: 'trace-6',
    timestamp: '2024-05-20T10:15:00Z',
    spanName: 'tool_call.failed',
    durationMs: 5000,
    status: 'error',
    tokens: 100,
    cost: 0.001,
    attributes: { error: 'Connection timeout', tool: 'weather_api' }
  },
  {
    id: 'trace-7',
    timestamp: '2024-05-20T10:18:10Z',
    spanName: 'agent.memory.write',
    durationMs: 45,
    status: 'ok',
    tokens: 50,
    cost: 0.0001,
    attributes: { memory_type: 'short_term', items: 3 }
  },
  {
    id: 'trace-8',
    timestamp: '2024-05-20T10:20:05Z',
    spanName: 'model.generate',
    durationMs: 12000,
    status: 'ok',
    tokens: 15000,
    cost: 0.15,
    attributes: { model: 'gemini-3-pro-preview', mode: 'thinking' }
  }
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: 'log-1', user: 'admin@int.inc', action: 'agent.deploy', resource: 'agent:finance-1', status: 'success', timestamp: '2024-05-20T09:00:00Z' },
  { id: 'log-2', user: 'eng-01@int.inc', action: 'config.update', resource: 'org:global', status: 'success', timestamp: '2024-05-20T09:15:00Z' },
  { id: 'log-3', user: 'admin@int.inc', action: 'data.export', resource: 'audit_logs', status: 'failure', timestamp: '2024-05-20T09:45:00Z' },
  { id: 'log-4', user: 'system', action: 'budget.alert', resource: 'billing:monthly', status: 'success', timestamp: '2024-05-20T10:30:00Z' },
  { id: 'log-5', user: 'sec-ops@int.inc', action: 'agent.suspend', resource: 'agent:security-sentinel', status: 'success', timestamp: '2024-05-20T11:00:00Z' },
  { id: 'log-6', user: 'manager@int.inc', action: 'hitl.approve', resource: 'request:h-1', status: 'success', timestamp: '2024-05-20T11:15:00Z' },
  { id: 'log-7', user: 'unknown', action: 'auth.login_attempt', resource: 'portal:access', status: 'failure', timestamp: '2024-05-20T11:45:22Z' },
  { id: 'log-8', user: 'system', action: 'auto.scale_up', resource: 'cluster:na-east', status: 'success', timestamp: '2024-05-20T12:00:00Z' },
  { id: 'log-9', user: 'eng-02@int.inc', action: 'model.finetune', resource: 'model:custom-finance-v2', status: 'success', timestamp: '2024-05-20T12:30:00Z' }
];
