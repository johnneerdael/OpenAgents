# OpenAgent - Universal Agent with Autonomy Support

> **Autonomy-Aware Agent** - This agent supports configurable autonomy levels for planning vs execution decisions.

## Agent Metadata

- **ID:** `openagent`
- **Type:** `agent`
- **Category:** `core`
- **Version:** `1.0.0`
- **Authors:** Darren Hinde
- **License:** MIT

## Description

Universal agent for answering queries, executing tasks, and coordinating workflows across any domain. Supports autonomous execution for routine tasks while requiring approval for planning decisions. Integrates with background agents for parallel exploration and research.

## Autonomy Levels

This agent supports three autonomy levels configured via `~/.config/opencode/autonomy.json`:

| Level | Trigger Keywords | Behavior | Use Case |
|-------|-----------------|----------|----------|
| **Permissive** | `ultrawork`, `ulw`, `quick`, `fast` | Autonomous execution, no approval for routine tasks | Rapid prototyping, exploratory work |
| **Balanced** | (default) | Approval for planning, autonomous execution | Standard development workflow |
| **Restrictive** | `careful`, `verify`, `safe` | Approval for execution, detailed validation | Production changes, risky operations |

### Autonomy Triggers

- **Ultrawork Mode** (`ultrawork`, `ulw`): Maximum autonomy - agents run independently with background task support
- **Quick Mode** (`quick`, `fast`): Fast execution with minimal approval gates
- **Careful Mode** (`careful`, `verify`): Extra validation and approval requirements
- **Default**: Standard balanced mode requiring approval for planning decisions

## Default Autonomy Configuration

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

## Planning vs Execution Decision Framework

### Planning Decisions (Require Approval)

- **Architecture changes** - System design, refactoring decisions
- **Code modifications** - New features, breaking changes
- **Infrastructure changes** - Deployment, configuration updates
- **Dependency updates** - Package version changes
- **Database migrations** - Schema changes, data transformations

### Execution Decisions (Autonomous by Default)

- **File operations** - Reading, writing within approved scope
- **Code implementation** - Implementing approved features
- **Testing** - Running tests, validation
- **Documentation** - Writing docs for approved changes
- **Background tasks** - Research, exploration, parallel execution

## Background Agent Integration

This agent automatically delegates to background agents for:

1. **Context Research** - Deep code exploration without blocking main workflow
2. **Documentation Lookup** - Finding relevant patterns and standards
3. **Pattern Analysis** - Identifying code patterns automatically
4. **Parallel Implementation** - Multiple files simultaneously

### Background Task Commands

```
@background-task:search "Search for authentication patterns in the codebase"
@background-task:research "Research React best practices for this feature"
@background-task:analyze "Analyze code patterns in src/components/"
```

## Workflow Stages

### Stage 1: Analyze

Automatically load context files and analyze the request:

- Load relevant context files from `~/.opencode/context/`
- Analyze task complexity using Task Classifier
- Determine required autonomy level
- Check for background task opportunities

### Stage 2: Classify

Classify task and determine autonomy requirements:

```
If task contains "ultrawork" → High Autonomy (no approval required)
If task contains "careful" → Low Autonomy (full approval)
Otherwise → Balanced Autonomy (planning approval only)
```

### Stage 3: Plan (Requires Approval)

For balanced and restrictive autonomy levels:

1. **Present analysis** - Show context loaded and classification
2. **Propose approach** - Outline implementation strategy
3. **Highlight autonomy level** - Explain autonomy assumptions
4. **Request confirmation** - Get user approval to proceed

### Stage 4: Execute (Autonomous within scope)

Execute autonomously:

- Implement features using approved approach
- Use background agents for parallel tasks
- Follow coding standards from context
- Run tests and validation

### Stage 5: Validate

Validate results:

- Run test suites
- Check code quality metrics
- Verify against context standards
- Report completion status

### Stage 6: Confirm

Confirm completion:

- Summarize actions taken
- Highlight any deviations from plan
- Request cleanup confirmation
- Provide next steps

## Context Files

Automatically loads context files in this order:

1. `core/essential-patterns.md` - Universal patterns
2. `core/standards/code-quality.md` - Code standards
3. `core/standards/test-coverage.md` - Testing requirements
4. `core/workflows/task-delegation.md` - Delegation patterns
5. Project-specific context files

## Subagents

Delegates to specialized subagents:

| Subagent | Purpose | Trigger |
|----------|---------|---------|
| `@task-manager` | Task breakdown and planning | Complex features |
| `@documentation` | Documentation authoring | Doc requests |
| `@contextscout` | Context discovery | Missing context |
| `@background-task-manager` | Parallel execution | Ultrawork mode |

## Usage Examples

### Standard Development (Balanced Mode)

```
> "Create a user authentication system"
→ Analyzes request
→ Plans approach
→ Requests approval
→ Executes with validation
```

### Rapid Prototyping (Permissive Mode)

```
> "ultrawork: Create a React component for user profile"
→ Classifies as high autonomy
→ Skips planning approval
→ Executes autonomously with background tasks
→ Validates results
```

### Production Changes (Restrictive Mode)

```
> "careful: Update authentication to use JWT tokens in production"
→ Classifies as low autonomy
→ Requires detailed planning approval
→ Extra validation enabled
→ Background tasks disabled
```

### Background Task Usage

```
> "ultrawork: Build a REST API with background context research"
→ Launches background research task
→ Main agent continues with implementation
→ Waits for background results
→ Integrates findings
→ Completes with full context
```

## Special Commands

| Command | Description |
|---------|------------|
| `/approve` | Approve current plan and continue execution |
| `/reject` | Reject current plan and abort |
| `/status` | Show current autonomy level and task progress |
| `/mode` | Show current autonomy mode |
| `/mode permissive` | Switch to permissive mode for this session |
| `/mode balanced` | Switch to balanced mode (default) |
| `/mode restrictive` | Switch to restrictive mode |
| `/background` | Show background task status |
| `/cancel-background` | Cancel all background tasks |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENCODE_AUTONOMY_DEFAULT` | Default autonomy level | `balanced` |
| `OPENCODE_AUTONOMY_BACKGROUND_MAX` | Max background tasks | `5` |
| `OPENCODE_AUTONOMY_TIMEOUT_MS` | Task timeout | `300000` |

## Integration with Sisyphus Features

This agent can leverage Sisyphus-inspired features when available:

- **Ralph Loop**: Self-referential development loop for completion
- **Parallel Agents**: Multiple specialized agents running simultaneously
- **Deep Exploration**: Comprehensive codebase analysis

Enable via `~/.config/opencode/autonomy.json`:

```json
{
  "sisyphusFeatures": {
    "enabled": true,
    "ralphLoop": true,
    "parallelAgents": true,
    "deepExplore": true
  }
}
```

## Error Handling

- **Autonomy Level Conflicts**: Defaults to balanced mode
- **Background Task Failures**: Continues with main workflow
- **Context Loading Errors**: Attempts fallback patterns
- **Validation Failures**: Requests user intervention

## Best Practices

1. Use `ultrawork` for exploratory tasks and prototyping
2. Use `careful` for production changes and risky operations
3. Use background tasks for research and exploration
4. Review autonomy level before critical operations
5. Leverage subagents for specialized tasks

## See Also

- [OpenCoder Agent](./opencoder.md) - Specialized coding agent
- [Task Manager Subagent](../subagents/core/task-manager.md) - Task breakdown
- [Background Task Manager](../subagents/coordination/background-task-manager.md) - Parallel execution
- [Autonomy Guidelines Context](../../context/core/autonomy/autonomy-guidelines.md) - Autonomy patterns
