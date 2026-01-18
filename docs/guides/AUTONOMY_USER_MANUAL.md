# OpenAgents Autonomy Controller User Manual

The Autonomy Controller is a core safety and productivity feature of OpenAgents. it manages the balance between autonomous execution and user oversight by classifying tasks and enforcing appropriate "approval gates."

## Core Concepts

### 1. Autonomy Modes
The overall behavior of the agent is governed by three primary modes configured in `~/.config/opencode/autonomy.json`:

| Mode | Philosophy | Ideal For |
| :--- | :--- | :--- |
| **Permissive** | High speed, low drag. Skips planning approvals for most tasks. | Rapid prototyping, exploration, and non-destructive tasks. |
| **Balanced** | Safety-first implementation. Requires approval for plans but executes autonomously. | Standard development workflows and feature implementation. |
| **Restrictive** | Maximum oversight. Requires approval for both planning and specific tool execution. | Production environments and high-risk refactoring. |

### 2. Task Classification
Every request is automatically analyzed by the **Task Classifier** to determine its risk level:

*   **HIGH (Exploratory)**: Reading code, searching logs, or documentation research.
*   **MEDIUM (Implementation)**: Writing new components, adding tests, or minor refactoring.
*   **LOW (Architectural/Risky)**: Changing APIs, deleting directories, or infrastructure changes.

## Approval Gates

The Autonomy Controller intercepts actions based on the current mode and task classification.

### Planning Gate
For **Balanced** and **Restrictive** modes, the agent will present an **Implementation Plan** before starting any work. You must approve this via:
*   `/approve`: Confirm the plan and start execution.
*   `/reject`: Stop the agent from proceeding.

### Tool execution Gate
In **Restrictive** mode, sensitive tools (like `edit`, `write`, or destructive `bash` commands) will trigger an additional approval request at the moment of use.

## Background Tasks

The system leverages a **Background Task Manager** to run non-blocking operations in parallel (enabled in Permissive and Balanced modes).

*   **Parallel Exploration**: While the main agent plans, background agents can search for context or documentation.
*   **Verification**: Tests can run in the background after implementation steps.

### Commands:
*   `/status`: View current autonomy level and running background tasks.
*   `/background cancel [taskId]`: Terminate a specific background process.

## Customizing Your Experience

### Switching Modes via Chat
You can change the autonomy mode for your current session using slash commands:
*   `/mode permissive`
*   `/mode balanced`
*   `/mode restrictive`

### Configuration File
Advanced users can modify `~/.config/opencode/autonomy.json` to customize keyword triggers and specific tool permissions:

```json
{
  "autonomy": {
    "defaultLevel": "balanced",
    "lowAutonomyTriggers": ["production", "delete", "breaking"],
    "mediumApprovalTimeoutMs": 5000
  }
}
```

## Best Practices

1.  **Use `ultrawork`**: Start your prompt with this keyword to temporarily boost autonomy for exploratory tasks.
2.  **Use `careful`**: Use this keyword when working in production-critical files to force the agent into restrictive mode.
3.  **Review the Plan**: In Balanced mode, always review the implementation plan during the approval gate to ensure the agent's logic aligns with your architecture.
