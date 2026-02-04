
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
  }
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: 'log-1', user: 'admin@int.inc', action: 'agent.deploy', resource: 'agent:finance-1', status: 'success', timestamp: '2024-05-20T09:00:00Z' },
  { id: 'log-2', user: 'eng-01@int.inc', action: 'config.update', resource: 'org:global', status: 'success', timestamp: '2024-05-20T09:15:00Z' },
  { id: 'log-3', user: 'admin@int.inc', action: 'data.export', resource: 'audit_logs', status: 'failure', timestamp: '2024-05-20T09:45:00Z' }
];
