# EPB Enterprise Dashboard Pro

![Version](https://img.shields.io/badge/version-1.1.0-blue)
![Tech](https://img.shields.io/badge/stack-React--Tailwind--Gemini-teal)
![License](https://img.shields.io/badge/license-Enterprise-slate)

## 🎯 Overview
The **EPB Enterprise Dashboard Pro** is a high-fidelity, production-grade command center for the **Enterprise Profile Builder (EPB)** ecosystem. It provides mission-critical oversight for autonomous agent fleets, multi-tenant cost governance, and advanced AI-powered reasoning deliverables.

Built for **Admins, Engineers, and Strategic Managers**, this dashboard bridges the gap between raw LLM telemetry and executive decision-making using the latest **Google Gemini 3** models.

## 🚀 Key Features

### 1. Agent Observability & Tracing
*   **Real-time Telemetry**: Full span tracing of agent "thought" processes (ReAct steps).
*   **Search & Filter**: Dynamic agent filtering by type (Copilot, Analyst, Bot) and status.
*   **Status Management**: Visual indicators for `Active`, `Suspended`, and `Draft` states.

### 2. AI Pro Studio (Powered by Gemini 3 Pro)
*   **Deep Reasoning**: Utilizes `gemini-3-pro-preview` with configurable **Thinking Budgets** (up to 8k tokens) to solve complex architectural and strategic problems before generating output.
*   **High-Fidelity Deliverables**: Persona-based generation (Principal Consultant, Staff Engineer, Data Architect).
*   **Strategic Variations**: Automatic generation of growth, risk, and efficiency branches with structured JSON output.
*   **Multimodal Interaction**: Native Text-to-Speech (TTS) using `gemini-2.5-flash-preview-tts` for executive report narration.
*   **Client-Side Audio**: Robust Web Audio API implementation for playback, seeking, and visual progress tracking.

### 3. Governance & Compliance
*   **Cost Controls**: Real-time budget tracking with projected spending analysis.
*   **Immutable Audit Logs**: Cryptographically verifiable trail of all system actions.
*   **Search Grounding**: Live verification of compliance frameworks (SOC2, EU AI Act) via **Google Search** tools.

### 4. Human-in-the-Loop (HITL)
*   **Risk Mitigation**: Approval queue for high-value actions (e.g., fund transfers).
*   **Contextual Review**: Deep-link to agent traces before granting authorization.

## 🛠 Tech Stack
*   **Frontend**: React 19 (ESM), Tailwind CSS
*   **Intelligence**: Google Gemini API (`@google/genai` v1.38+)
    *   `gemini-3-pro-preview`: Reasoning/Complex Tasks (Thinking Budget: 4k-8k)
    *   `gemini-3-flash-preview`: Speed/Variations
    *   `gemini-2.5-flash-preview-tts`: Audio Synthesis
*   **Visualization**: Recharts (Interactive SVG charting)
*   **Design**: custom "Slate-950" Enterprise Theme

## 📦 Installation & Setup
1. Ensure the `API_KEY` environment variable is configured in your execution environment.
2. The application uses a standard React ESM entry point via `index.html`.
3. No build step is required for the provided runtime environment.

## 🎵 Audio Features
The dashboard features a custom **AudioPlayer** component that handles:
*   Raw PCM audio decoding from Gemini API responses.
*   Browser Autoplay Policy management (auto-resume context).
*   Precise seeking and real-time visual progress bars.

---
*© 2024 INT INC. Proprietary and Confidential.*