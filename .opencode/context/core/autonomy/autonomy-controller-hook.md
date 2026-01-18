# Autonomy Controller Hook

**Purpose**: Manages autonomy levels and approval gates based on task classification

## Overview

The Autonomy Controller is a hook that:
- Intercepts tool calls and user requests
- Determines autonomy level from Task Classifier
- Applies appropriate approval gate behavior
- Enables background task execution
- Reports autonomy decisions to user

## Autonomy Modes

### High Autonomy Mode
**For exploration, analysis, and information tasks**

When autonomy level is HIGH:
- No approval gates for read operations
- Background agents enabled for parallel work
- Auto-execute after brief analysis
- Report results at completion

```typescript
// High autonomy execution
if (autonomyLevel === 'high') {
  executeImmediately(); // No approval needed
  spawnBackgroundAgents(); // Parallel exploration
  reportAtCompletion();
}
```

### Medium Autonomy Mode
**For implementation and modification tasks**

When autonomy level is MEDIUM:
- Brief plan presentation
- Auto-continue on approval (default)
- Background agents for verification
- Report at milestones

```typescript
// Medium autonomy execution
if (autonomyLevel === 'medium') {
  presentBriefPlan();
  awaitImplicitApproval(); // User can override
  executeAndVerify();
}
```

### Low Autonomy Mode
**For architectural and breaking changes**

When autonomy level is LOW:
- Explicit approval required
- No background execution
- Step-by-step confirmation
- Full reporting

```typescript
// Low autonomy execution
if (autonomyLevel === 'low') {
  presentDetailedPlan();
  awaitExplicitApproval(); // Required
  executeStepByStep();
}
```

## Task Classification Integration

The hook integrates with Task Classifier:

```typescript
async function classifyTask(task: Task): Promise<AutonomyLevel> {
  const classifier = await getSubagent('task-classifier');
  const result = await classifier.execute(task);
  return result.autonomy_level;
}
```

## Approval Gate Behavior

| Autonomy Level | Approval Type | Background Agents |
|---------------|--------------|-----------------|
| High | None | Full |
| Medium | Implicit | Full + Verification |
| Low | Explicit | None |

## Configuration

### Default Mode
```json
{
  "autonomy": {
    "default_mode": "medium",
    "high_autonomy_keywords": ["explore", "find", "analyze", "quick"],
    "low_autonomy_keywords": ["design", "architect", "breaking"],
    "background_enabled": true,
    "max_background_agents": 5
  }
}
```

### Custom Modes
```json
{
  "autonomy": {
    "permissive": {
      "high_threshold": "low",
      "auto_approve_always": true,
      "max_background": 10
    },
    "balanced": {
      "high_threshold": "medium",
      "auto_approve_high": true,
      "max_background": 5
    },
    "restrictive": {
      "high_threshold": "high",
      "auto_approve_never": true,
      "max_background": 2
    }
  }
}
```

## Hook Flow

```
User Request
    ↓
Task Classifier
    ↓
┌─────────────────────────────────────┐
│  Autonomy Level Determination        │
│  ├─ High: Execute immediately      │
│  ├─ Medium: Brief plan → Execute   │
│  └─ Low: Explicit approval        │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  Background Agent Spawning            │
│  ├─ High: Parallel exploration     │
│  ├─ Medium: Verification tasks     │
│  └─ Low: No background          │
└─────────────────────────────────────┘
    ↓
Execution + Reporting
```

## Examples

### High Autonomy Example
```
User: "Find all React components in src/"
→ Classification: HIGH
→ Action: Execute immediately, spawn background search
→ Result: Report findings at completion
```

### Medium Autonomy Example
```
User: "Add tests for user authentication"
→ Classification: MEDIUM
→ Action: Present brief plan, execute after 5s (user can cancel)
→ Result: Report at milestones
```

### Low Autonomy Example
```
User: "Design new API architecture"
→ Classification: LOW
→ Action: Present detailed plan, wait explicit approval
→ Result: Report each step
```

## Background Task Integration

The hook coordinates with Background Task Manager:

```typescript
async function spawnBackgroundTasks(task: Task, autonomy: AutonomyLevel) {
  const backgroundManager = await getSubagent('background-task-manager');
  
  if (autonomy.can_parallelize) {
    const candidates = autonomy.background_candidates;
    for (const candidate of candidates) {
      await backgroundManager.spawn({
        task: candidate,
        priority: getPriority(autonomy.risk_level),
        notify_on_complete: true
      });
    }
  }
}
```

## Error Handling

If classification fails:
- Default to medium autonomy
- Log uncertainty
- Continue with default behavior
- Report classification issue to user

If background tasks fail:
- Continue main execution
- Log failures
- Report in completion summary
- No blocking

## Metrics and Reporting

The hook tracks:
- Classification accuracy
- Autonomy level distribution
- Background task success rate
- User override frequency
- Approval gate bypasses

```typescript
const metrics = {
  high_autonomy_tasks: 45,
  medium_autonomy_tasks: 30,
  low_autonomy_tasks: 25,
  background_tasks_spawned: 120,
  background_tasks_completed: 115,
  user_overrides: 8,
  approval_gates_bypassed: 45
};
```

## Configuration Options

### Enable/Disable
```json
{
  "hooks": {
    "autonomy-controller": {
      "enabled": true
    }
  }
}
```

### Custom Thresholds
```json
{
  "autonomy": {
    "keywords": {
      "high": ["explore", "quick", "find", "analyze"],
      "medium": ["implement", "add", "modify"],
      "low": ["design", "architect", "breaking"]
    }
  }
}
```

### Approval Timeouts
```json
{
  "autonomy": {
    "medium_approval_timeout_ms": 5000,
    "require_explicit_low": true
  }
}
```

## Best Practices

1. **Start conservative** - Default to medium autonomy
2. **Learn from overrides** - Improve classification
3. **Use background wisely** - Don't overwhelm system
4. **Report clearly** - User knows what's happening
5. **Provide escape hatches** - Always allow user override
