---
id: mode-restrictive
name: Mode Restrictive
description: "Switch to restrictive autonomy mode (maximum oversight)"
category: autonomy
version: 1.0.0
---

# Mode Restrictive Command

When the user invokes `/mode-restrictive`, you should immediately call the [`autonomy_control()`](cci:1:///autonomy_control) tool to switch to restrictive mode.

## Instructions for Agent

1. **Call the autonomy_control tool** with these parameters:
   ```typescript
   autonomy_control({
     action: "set",
     mode: "restrictive"
   })
   ```

2. **Explain the mode change** to the user:
   - All actions require explicit approval
   - No background tasks - everything is sequential
   - Step-by-step confirmation workflow
   - Maximum oversight and control
   - Best for critical operations and learning

3. **Show the tool's response** which will confirm the mode change and display the new settings.

## What is Restrictive Mode? 🛡️

**Restrictive mode** provides maximum oversight for critical operations:

- **All actions require approval**: Every significant action needs explicit confirmation
- **No background tasks**: Sequential execution only - no parallel operations
- **Step-by-step workflow**: Complete visibility into each operation
- **Maximum control**: You approve every step before it executes
- **Safe and controlled**: Ideal when mistakes could be costly

### Best for:
- Production changes and deployments
- Risky operations (database migrations, deletions)
- Learning the system and understanding what agents do
- Working on unfamiliar codebases
- Critical business operations
- Compliance and audit requirements

### Trade-offs:
- Slower workflow due to frequent approvals
- More interruptions requiring your attention
- Best for situations where safety > speed

## Example Usage

**User:** `/mode-restrictive`

**Agent Response:**
```
Switching to restrictive autonomy mode...

✅ Mode changed: RESTRICTIVE 🛡️

Settings:
- Planning approval: Required
- Background tasks: Disabled
- Approval gates: Maximum (every action)
- Execution: Step-by-step with approval

Restrictive mode active. I'll request approval for every significant action.
This ensures maximum oversight and control.
```

## Related Commands

- `/mode-permissive` - Switch to permissive mode (maximum autonomy)
- `/mode-balanced` - Switch to balanced mode (recommended default)
- `/autonomy-status` - Check current autonomy settings
