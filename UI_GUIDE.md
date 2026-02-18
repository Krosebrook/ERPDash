
# UI/UX Specification: EPB Pro

## 1. Design Tokens
*   **Primary Action**: Blue-600 (`#2563eb`)
*   **Secondary Action**: Slate-800 (`#1e293b`)
*   **Success state**: Emerald-500 (`#10b981`)
*   **Warning state**: Yellow-500 (`#f59e0b`)
*   **Error state**: Rose-500 (`#f43f5e`)

## 2. Layout Rules
*   **Containers**: Use `rounded-[2rem]` or `rounded-[3rem]` for large surface panels.
*   **Typography**: 
    *   Headers: `font-black uppercase tracking-tighter`
    *   Subheaders: `text-[10px] font-black uppercase tracking-[0.3em]`
    *   Mono: `font-mono` (reserved for telemetry and timestamps).

## 3. Feedback Patterns
*   **Copy to Clipboard**:
    *   Default: Blue or Slate background.
    *   Success: Emerald background with `animate-in scale-105`.
    *   Duration: 2000ms before resetting.
*   **Thinking States**:
    *   Use the `REASONING_STEPS` array with a visual progress bar.
    *   Background should use `backdrop-blur-2xl` to maintain hierarchy.
