# EPB Enterprise Dashboard Pro

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Tech](https://img.shields.io/badge/stack-React--Tailwind--Gemini-teal)
![License](https://img.shields.io/badge/license-Enterprise-slate)

## 🎯 Overview
The **EPB Enterprise Dashboard Pro** is a high-fidelity, production-grade command center for the **Enterprise Profile Builder (EPB)** ecosystem. It provides mission-critical oversight for autonomous agent fleets, multi-tenant cost governance, and advanced AI-powered reasoning deliverables.

Built for **Admins, Engineers, and Strategic Managers**, this dashboard bridges the gap between raw LLM telemetry and executive decision-making.

## 🚀 Key Features

### 1. Agent Observability & Tracing
*   **Real-time Telemetry**: Full span tracing of agent "thought" processes (ReAct steps).
*   **Search & Filter**: Dynamic agent filtering by type (Copilot, Analyst, Bot) and status.
*   **Status Management**: Visual indicators for `Active`, `Suspended`, and `Draft` states.

### 2. AI Pro Studio (Powered by Gemini)
*   **High-Fidelity Deliverables**: Persona-based generation (Principal Consultant, Staff Engineer, Data Architect).
*   **Thinking Budget**: Leverages Gemini 3's reasoning capabilities for deep-dive analysis.
*   **Strategic Variations**: Automatic generation of growth, risk, and efficiency branches.
*   **Multimodal Interaction**: Native Text-to-Speech (TTS) for executive report narration.

### 3. Governance & Compliance
*   **Cost Controls**: Real-time budget tracking with projected spending analysis.
*   **Immutable Audit Logs**: Cryptographically verifiable trail of all system actions.
*   **Search Grounding**: Live verification of compliance frameworks (SOC2, EU AI Act) via Google Search.

### 4. Human-in-the-Loop (HITL)
*   **Risk Mitigation**: Approval queue for high-value actions (e.g., fund transfers).
*   **Contextual Review**: Deep-link to agent traces before granting authorization.

## 🛠 Tech Stack
*   **Frontend**: React 19 (ESM), Tailwind CSS
*   **Intelligence**: Google Gemini API (`@google/genai`)
    *   `gemini-3-pro-preview` (Reasoning/Complex Tasks)
    *   `gemini-3-flash-preview` (Speed/Variations)
    *   `gemini-2.5-flash-preview-tts` (Audio Synthesis)
*   **Visualization**: Recharts (Interactive SVG charting)
*   **Design**: custom "Slate-950" Enterprise Theme

## 📦 Installation & Setup
1. Ensure the `API_KEY` environment variable is configured.
2. The application uses a standard React ESM entry point via `index.html`.
3. No build step is required for the provided runtime environment.

---
*© 2024 INT INC. Proprietary and Confidential.*
