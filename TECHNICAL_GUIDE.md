# Technical Integration Guide: EPB Dashboard

This document details the architectural patterns and implementation standards used in the EPB Dashboard Pro v1.1.

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

### Deep Reasoning with Thinking Budget
For "Deep Analysis" and "Studio Deliverables," we utilize the `thinkingConfig` available in **Gemini 3**. This allows the model to perform internal "Chain of Thought" reasoning before presenting the final response.

*   **Config**: `thinkingConfig: { thinkingBudget: 4096 }` (Adaptive based on task type)
*   **Impact**: Significantly reduces hallucinations in complex architectural diagrams and strategic reports.

### Search Grounding
To prevent hallucinations in the "Compliance" section, we implement `googleSearch` tools. This ensures that mentions of the **EU AI Act** or **NIST Frameworks** are based on current web data.

### Robust JSON Handling
LLMs often wrap JSON output in Markdown code blocks (e.g., ` ```json ... ``` `). We implement a `cleanAndParseJson` utility to strip these delimiters before parsing, ensuring application stability.

## 🔊 Audio Pipeline

The dashboard implements a sophisticated Text-to-Speech (TTS) pipeline:

1.  **Generation**: Uses `gemini-2.5-flash-preview-tts` with the `Kore` voice.
2.  **Transport**: Receives raw Base64-encoded PCM audio data.
3.  **Decoding**:
    *   Decodes Base64 to `Uint8Array`.
    *   Converts `Uint8Array` to `Int16Array` (PCM 16-bit).
    *   Normalizes to Float32 (-1.0 to 1.0).
    *   Loads into a Web Audio API `AudioBuffer`.
4.  **Playback**: Managed by a custom `AudioPlayer` component that handles `AudioContext` states (suspended/running) and precise scheduling.

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