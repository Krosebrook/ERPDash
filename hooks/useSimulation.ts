
import { useState, useEffect, useRef, useCallback } from 'react';
import { Agent, TraceSpan, AuditLog, SystemAlert, AgentType, MetricData } from '../types';
import { MOCK_AGENTS, MOCK_TRACES, MOCK_AUDIT_LOGS } from '../constants';

const NAMES = ['Finance Copilot', 'Ops Bot', 'Sec Sentinel', 'Data Orch', 'HR Guide'];
const ACTIONS = ['agent.invoke', 'tool_call', 'rag.retrieve', 'model.generate', 'memory.write'];
const STATUSES = ['ok', 'ok', 'ok', 'ok', 'error']; // 20% error rate

export const useSimulation = () => {
  // --- STATE ---
  const [agents, setAgents] = useState<Agent[]>(MOCK_AGENTS);
  const [traces, setTraces] = useState<TraceSpan[]>(MOCK_TRACES);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(MOCK_AUDIT_LOGS);
  const [alerts, setAlerts] = useState<SystemAlert[]>([
     { id: '1', severity: 'warning', title: 'System Initialized', message: 'Live simulation stream connected.', timestamp: 'Now', read: false, source: 'system' }
  ]);
  const [hitlRequests, setHitlRequests] = useState<any[]>([
     { id: 'h-1', agent: 'Finance Copilot', action: 'Transfer Funds', amount: '$45,000', user: 'j.doe@int.inc', time: '2 mins ago' }
  ]);

  // Live Metrics
  const [metrics, setMetrics] = useState({
      cost: 12450.00,
      activeAgents: 24,
      tokens: 45200000,
      latency: 1200
  });

  // Live Chart Data (Rolling window)
  const [chartData, setChartData] = useState<any[]>([
      { name: '00s', usage: 4000, cost: 240 },
      { name: '10s', usage: 3000, cost: 198 },
      { name: '20s', usage: 2000, cost: 98 },
      { name: '30s', usage: 2780, cost: 390 },
      { name: '40s', usage: 1890, cost: 480 },
      { name: '50s', usage: 2390, cost: 380 },
      { name: '60s', usage: 3490, cost: 430 },
  ]);

  // --- ACTIONS ---
  
  const approveHitl = useCallback((id: string) => {
      setHitlRequests(prev => prev.filter(req => req.id !== id));
      // Log the approval
      const newLog: AuditLog = {
          id: `log-${Date.now()}`,
          user: 'admin@int.inc',
          action: 'hitl.approve',
          resource: `request:${id}`,
          status: 'success',
          timestamp: new Date().toISOString()
      };
      setAuditLogs(prev => [newLog, ...prev].slice(0, 100));
  }, []);

  const rejectHitl = useCallback((id: string) => {
      setHitlRequests(prev => prev.filter(req => req.id !== id));
       const newLog: AuditLog = {
          id: `log-${Date.now()}`,
          user: 'admin@int.inc',
          action: 'hitl.reject',
          resource: `request:${id}`,
          status: 'success',
          timestamp: new Date().toISOString()
      };
      setAuditLogs(prev => [newLog, ...prev].slice(0, 100));
  }, []);

  const addTrace = useCallback((trace: TraceSpan) => {
      setTraces(prev => [trace, ...prev].slice(0, 100));
  }, []);

  // --- SIMULATION LOOP ---
  
  useEffect(() => {
    const interval = setInterval(() => {
        const now = new Date();

        // 1. Update Metrics (Random Walk)
        setMetrics(prev => ({
            cost: prev.cost + (Math.random() * 10 - 2), // Trend up slowly
            activeAgents: Math.max(0, Math.min(50, prev.activeAgents + (Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0))),
            tokens: prev.tokens + Math.floor(Math.random() * 5000),
            latency: Math.max(100, prev.latency + (Math.random() * 200 - 100))
        }));

        // 2. Generate New Trace (Simulate Traffic)
        if (Math.random() > 0.3) {
            const agent = NAMES[Math.floor(Math.random() * NAMES.length)];
            const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
            const status = STATUSES[Math.floor(Math.random() * STATUSES.length)] as 'ok' | 'error';
            
            const newTrace: TraceSpan = {
                id: `trace-${Date.now()}`,
                timestamp: now.toISOString(),
                spanName: `${agent.split(' ')[0].toLowerCase()}.${action}`,
                durationMs: Math.floor(Math.random() * 2000 + 100),
                status: status,
                tokens: Math.floor(Math.random() * 1000),
                cost: Math.random() * 0.05,
                attributes: { simulated: true }
            };
            
            setTraces(prev => [newTrace, ...prev].slice(0, 50)); // Keep last 50
            
            // If error, maybe trigger alert
            if (status === 'error' && Math.random() > 0.8) {
                const newAlert: SystemAlert = {
                    id: `alert-${Date.now()}`,
                    severity: 'warning',
                    title: 'Agent Error Rate Spike',
                    message: `Elevated error rate detected on ${agent}.`,
                    timestamp: 'Just now',
                    read: false,
                    source: 'system'
                };
                setAlerts(prev => [newAlert, ...prev].slice(0, 10));
            }
        }

        // 3. Update Chart (Rolling)
        if (now.getSeconds() % 5 === 0) { // Every 5 seconds
            setChartData(prev => {
                const newData = [...prev.slice(1)];
                newData.push({
                    name: `${now.getSeconds()}s`,
                    usage: Math.floor(Math.random() * 4000 + 1000),
                    cost: Math.floor(Math.random() * 500)
                });
                return newData;
            });
        }

        // 4. Random Audit Log
        if (Math.random() > 0.9) {
             const newLog: AuditLog = {
                id: `log-${Date.now()}`,
                user: Math.random() > 0.5 ? 'system' : 'agent',
                action: 'auto.scale',
                resource: 'cluster:na-east',
                status: 'success',
                timestamp: now.toISOString()
            };
            setAuditLogs(prev => [newLog, ...prev].slice(0, 100));
        }

    }, 1000); // 1s tick

    return () => clearInterval(interval);
  }, []);

  return {
      agents,
      setAgents,
      traces,
      auditLogs,
      alerts,
      hitlRequests,
      metrics,
      chartData,
      approveHitl,
      rejectHitl,
      addTrace
  };
};
