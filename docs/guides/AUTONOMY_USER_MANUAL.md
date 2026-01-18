# OpenAgents Autonomy Controller User Manual

The Autonomy Controller is a core safety and productivity feature of OpenAgents. it manages the balance between autonomous execution and user oversight by classifying tasks and enforcing appropriate "approval gates."

## Core Concepts

### 1. Autonomy Modes

The overall behavior of the agent is governed by three primary modes:

| Mode | Emoji | Philosophy | Ideal For |
| :--- | :---: | :--- | :--- |
| **Permissive** | 🚀 | High speed, low drag. Skips planning approvals for most tasks. | Rapid prototyping, exploration, and non-destructive tasks. |
| **Balanced** | ⚖️ | Safety-first implementation. Requires approval for plans but executes autonomously. | Standard development workflows and feature implementation. |
| **Restrictive** | 🛡️ | Maximum oversight. Requires approval for both planning and specific tool execution. | Production environments and high-risk refactoring. |

### 2. Task Classification

Every request is automatically analyzed by the **Task Classifier** to determine its autonomy level:

* **HIGH Autonomy (Exploratory)**: Reading code, searching logs, or documentation research.
* **MEDIUM Autonomy (Implementation)**: Writing new components, adding tests, or minor refactoring.
* **LOW Autonomy (Architectural/Risky)**: Changing APIs, deleting directories, or infrastructure changes.

## Controlling Autonomy: Three Methods

OpenAgents provides three complementary ways to control autonomy levels, each suited for different scenarios:

### Method 1: Keyword Triggers (Per-Prompt)

Add keywords at the start of your prompt to temporarily override the autonomy level for that specific request:

**Permissive Mode Triggers:**
```
ultrawork: Create a React component for user authentication
ulw: Build a REST API with Express
quick: Add unit tests for the UserService class
fast: Refactor utility functions to use TypeScript
```

**Restrictive Mode Triggers:**
```
careful: Update production database schema
verify: Modify authentication middleware
safe: Delete unused API endpoints
production: Deploy configuration changes
```

**When to Use:**
- Quick one-time mode changes
- Explicit control for specific requests
- No need to remember to switch back
- Ideal for alternating between safe and risky tasks

### Method 2: Slash Commands (Session-Scoped)

Use slash commands to change the autonomy mode for the entire session without editing config files:

| Command | Effect | Duration |
|---------|--------|----------|
| `/mode-permissive` | 🚀 Switch to permissive mode | Current session |
| `/mode-balanced` | ⚖️ Switch to balanced mode | Current session |
| `/mode-restrictive` | 🛡️ Switch to restrictive mode | Current session |

**Examples:**

```bash
# Start of prototyping session
> /mode-permissive
✓ Autonomy mode set to PERMISSIVE for this session
  • Planning: Auto-approved
  • Execution: Autonomous
  • Background tasks: Enabled

> Create authentication module
> Add user registration
> Build JWT token service
# All requests now run in permissive mode without repeating keywords

# Switching to production work
> /mode-restrictive
✓ Autonomy mode set to RESTRICTIVE for this session
  • Planning: Approval required
  • Execution: Approval required
  • Background tasks: Disabled

> Update database connection string
> Modify production API endpoints
# All requests now require full approval
```

**When to Use:**
- Working on multiple related tasks in the same mode
- Prototyping sessions where you want consistent high autonomy
- Production deployment sessions requiring consistent oversight
- Avoid repeating keywords in every prompt

**Checking Current Mode:**
```bash
> /status
Current Configuration:
  • Autonomy Level: PERMISSIVE (session override)
  • Planning: Auto-approved
  • Execution: Autonomous
  • Background Tasks: 2 running
  • Session Duration: 15 minutes
```

### Method 3: Config File (Permanent Default)

Edit `~/.config/opencode/autonomy.json` to set your preferred default mode and customize trigger keywords:

```json
{
  "autonomy": {
    "defaultLevel": "balanced",
    "highAutonomy": {
      "triggers": ["ultrawork", "ulw", "quick", "fast"],
      "approvalRequired": false,
      "backgroundTasksEnabled": true
    },
    "mediumAutonomy": {
      "triggers": [],
      "approvalRequired": false,
      "backgroundTasksEnabled": true
    },
    "lowAutonomy": {
      "triggers": ["careful", "verify", "safe", "production"],
      "approvalRequired": true,
      "backgroundTasksEnabled": false,
      "extraValidation": true
    }
  }
}
```

**When to Use:**
- Set your preferred default behavior
- Customize keyword triggers to match your workflow
- Configure organization-wide standards
- Define tool-specific permissions

### Priority Order

When multiple control methods are active, they follow this priority (highest to lowest):

1. **Slash Commands** (session override) - Overrides everything for the current session
2. **Keyword Triggers** (per-prompt) - Overrides config file for one request
3. **Config File** (default) - Base configuration when no overrides are active

**Example:**
```bash
# Config file sets default to "balanced"
# Session override to permissive
> /mode-permissive

# This uses permissive (session override)
> Create new feature

# This uses restrictive (keyword overrides session)
> careful: Update production code

# Back to permissive (session override still active)
> Add more features
```

### Comparison Table

| Method | Scope | Priority | Use Case | Persistence |
|--------|-------|----------|----------|-------------|
| **Keyword triggers** (`ultrawork:`, `careful:`) | Single prompt | Medium | Quick one-time switch | None (one request) |
| **Slash commands** (`/mode-permissive`) | Current session | Highest | Multiple related tasks | Until session ends |
| **Config file** (`autonomy.json`) | All sessions | Lowest | Default preferences | Permanent |

## Approval Gates

The Autonomy Controller intercepts actions based on the current mode and task classification.

### Planning Gate

For **Balanced** and **Restrictive** modes, the agent will present an **Implementation Plan** before starting any work. You must approve this via:

* `/approve`: Confirm the plan and start execution.
* `/reject`: Stop the agent from proceeding.

### Tool execution Gate

In **Restrictive** mode, sensitive tools (like `edit`, `write`, or destructive `bash` commands) will trigger an additional approval request at the moment of use.

## Background Tasks

The system leverages a **Background Task Manager** to run non-blocking operations in parallel (enabled in Permissive and Balanced modes).

* **Parallel Exploration**: While the main agent plans, background agents can search for context or documentation.
* **Verification**: Tests can run in the background after implementation steps.

### Commands

* `/status`: View current autonomy level and running background tasks.
* `/background cancel [taskId]`: Terminate a specific background process.

## Practical Usage Scenarios

### Scenario 1: Morning Prototyping → Afternoon Production

```bash
# Morning: Rapid prototyping
> /mode-permissive
> Build new dashboard component
> Add chart visualization
> Create API endpoints

# Afternoon: Production deployment
> /mode-restrictive
> Deploy dashboard to production
> Update production config
> Migrate production database
```

### Scenario 2: Mixed Safety Levels

```bash
# Default: Balanced mode
> Refactor user service

# One risky operation
> careful: Delete deprecated API endpoints

# Back to balanced for next task
> Add new API endpoint
```

### Scenario 3: Team Collaboration

```bash
# Junior developer: Use restrictive by default
{
  "defaultLevel": "restrictive"
}

# Senior developer: Use balanced with quick access to permissive
{
  "defaultLevel": "balanced",
  "highAutonomy": {
    "triggers": ["ultrawork", "ulw", "quick"]
  }
}
```

## Best Practices

1. **Start Sessions Intentionally**: Use `/mode-permissive` at the start of prototyping sessions, `/mode-restrictive` for production work.

2. **Use Keyword Triggers for Exceptions**: When working in permissive mode but need extra safety for one task, use `careful:` prefix.

3. **Check Status Regularly**: Use `/status` to verify your current mode, especially in long sessions.

4. **Configure Defaults Thoughtfully**: Set `defaultLevel` in config file to match your most common workflow.

5. **Review Plans in Balanced Mode**: Always review the implementation plan during the approval gate to ensure the agent's logic aligns with your architecture.

6. **Leverage Keyword Triggers**: 
   - Use `ultrawork:` for exploratory tasks and prototyping
   - Use `careful:` for production changes and risky operations

7. **Session Overrides for Context Switches**: Use slash commands when switching between different types of work (prototyping → production, exploration → implementation).
