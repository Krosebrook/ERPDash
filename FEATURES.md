# EPB Dashboard Pro - New Features (v1.2)

## 1. Global AI Copilot
**Component**: `GlobalCopilot.tsx`
A system-wide command interface driven by `gemini-3-flash-preview` with **Function Calling**.
*   **Capabilities**: 
    *   Natural language navigation ("Take me to the cost view").
    *   Contextual Q&A about the system state.
    *   Persistent session history.
*   **Tech**: Uses `tools: [{ functionDeclarations: [...] }]` to map user intent to app router actions.

## 2. Agent Playground (Prompt Studio)
**Component**: `AgentPlayground.tsx`
A dedicated IDE for Prompt Engineering.
*   **Features**:
    *   Configurable System Instructions & Temperature.
    *   Model Selection (`pro` vs `flash`).
    *   Real-time latency and token usage metrics.
*   **Use Case**: Engineers can refine agent personas before deploying them to the production fleet.

## 3. Visual Trace Timeline
**Component**: `TraceTimeline.tsx` (Integrated into Observability)
A Gantt-chart visualization of agent execution traces.
*   **Features**:
    *   Proportional width rendering based on span duration.
    *   Color-coded status indicators (Blue = OK, Red = Error).
    *   Micro-interaction tooltips for deep inspection.
*   **Value**: Instantly identify bottlenecks in complex ReAct chains.

## 4. Knowledge Base Manager (RAG)
**Component**: `KnowledgeBase.tsx`
An interface for managing the vector search corpus.
*   **Features**:
    *   Document status tracking (Indexed/Indexing).
    *   **Retrieval Simulator**: Uses Gemini with `googleSearch` grounding to simulate how the RAG system retrieves context for a given query.
    *   Relevance scoring estimation.

## 5. Intelligent Alert Center
**Component**: `AlertCenter.tsx`
A proactive notification system for system anomalies.
*   **Features**:
    *   "Gemini Watchdog" source indicating AI-detected anomalies vs deterministic system alerts.
    *   Severity classification (Critical/Warning).
    *   Real-time badge counter.
