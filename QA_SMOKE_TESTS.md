
# QA Smoke Test Suite - EPB Pro v1.2

This suite ensures that UI refinements do not regress critical business logic or Gemini API integrations.

## 1. Intelligence Studio (High Priority)
*   **Action**: Navigate to 'Studio'.
*   **Action**: Select 'Report' deliverable and click 'Initiate Synthesis'.
*   **Expected**: Reasoning progress bar appears.
*   **Expected**: Content appears in the output area.
*   **Verification**: Click the new 'Copy Output' button. Verify the button changes to a green checkmark and content is in system clipboard.

## 2. Gemini Live Session (Hardware Dependency)
*   **Action**: Click the red microphone icon in the Global Copilot group.
*   **Expected**: Overlay appears with "Establishing Uplink...".
*   **Action**: Grant microphone permissions.
*   **Expected**: Pulse visualizer reacts to ambient sound.
*   **Verification**: Command the voice: "Navigate to Cost view". Verify the background view changes behind the overlay.

## 3. Agent Forge (Wizard)
*   **Action**: Navigate to 'Observability'.
*   **Action**: Click the '+' button in the 'Fleet Grid' header.
*   **Expected**: Forge Engine modal appears.
*   **Action**: Complete all 4 steps of the wizard.
*   **Expected**: 'Create Agent Fleet' button becomes active.
*   **Verification**: Click create. Verify the new agent appears in the list and is selected.

## 4. Responsiveness
*   **Action**: Resize browser to 375px width (Mobile).
*   **Expected**: Sidebar collapses into a hamburger menu.
*   **Expected**: Dashboard metric cards stack vertically.
*   **Expected**: Content remains scrollable without horizontal overflow.
