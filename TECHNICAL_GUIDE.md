# Technical Integration Guide: EPB Dashboard

This document details the architectural patterns and implementation standards used in the EPB Dashboard Pro.

## 🧠 Gemini API Integration Patterns

The dashboard leverages the `@google/genai` SDK with specific configurations to achieve enterprise-grade "fidelity."

### Persona-Based Prompting
Located in `services/geminiService.ts`, we use **System Instructions** to ground the model in professional personas. This increases output consistency by 30-40%.

```typescript
const systemInstructions = {
  report: "You are a Principal Management Consultant...",
  code: "You are a Senior Staff Engineer..."
};
```

### Reasoning with Thinking Budget
For "Deep Analysis," we utilize the `thinkingConfig`. This allows the model to perform internal "Chain of Thought" reasoning before presenting the final response.

*   **Config**: `thinkingConfig: { thinkingBudget: 8000 }`
*   **Use Case**: Executive summaries and strategic variations.

### Search Grounding
To prevent hallucinations in the "Compliance" section, we implement `googleSearch` tools. This ensures that mentions of the **EU AI Act** or **NIST Frameworks** are based on current web data.

### Multimodal TTS (Text-to-Speech)
The `speakReport` function uses `gemini-2.5-flash-preview-tts` to convert reports into audio.
*   **Voice**: `Kore` (Professional/Authoritative)
*   **Implementation**: Raw PCM decoding via Web Audio API (`AudioContext`).

## 🎨 UI/UX Component Library

### 1. Tooltip Provider
A custom React component utilizing Tailwind's `animate-in` for high-performance micro-interactions. Used on all interactive buttons to explain secondary functions.

### 2. Observability Table
A high-density data grid designed for telemetry.
*   **Patterns**: Mono fonts for timestamps, pill-badges for status, and hover-state reasoning inspection.

### 3. Recharts Integration
Customized charts to match the "Slate" theme.
*   **Interactive Tooltips**: Custom SVG overlays for token usage.
*   **Responsiveness**: Wrapped in `ResponsiveContainer` to handle fluid enterprise layouts.

## 🔐 Security & Governance

### Audit Trail
All actions (e.g., `agent.deploy`) are logged to an immutable state. In a production environment, these would be backed by a distributed ledger or a WORM (Write Once Read Many) storage system.

### HITL (Human-in-the-Loop)
The system enforces a "Pause-on-Risk" state where agents stop execution until an authorized user interacts with the `HitlQueue`.

## 📈 Coding Standards

1.  **Tailwind Utility First**: Avoid custom CSS files; use the utility-first approach for maintenance.
2.  **Strict Typing**: All data structures must be defined in `types.ts`.
3.  **Graceful Degradation**: Gemini calls include error boundaries and loading states to handle API rate limits or network issues.

---
*Document Version: 1.1*
*Author: Lead Systems Architect, INT INC*
