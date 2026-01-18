---
id: mode-permissive
name: Mode Permissive
description: "Switch to permissive autonomy mode (auto-approved execution)"
category: autonomy
version: 1.0.0
---

# Mode Permissive Command

When the user invokes `/mode-permissive`, you should immediately call the [`autonomy_control()`](cci:1:///autonomy_control) tool to switch to permissive mode.

## Instructions for Agent

1. **Call the autonomy_control tool** with these parameters:
   ```typescript
   autonomy_control({
     action: "set",
     mode: "permissive"
   })
   ```

2. **Explain the mode change** to the user:
   - Planning is auto-approved - no approval gates
   - Background tasks enabled (up to 10 concurrent tasks)
   - Maximum autonomy for rapid prototyping and exploration
   - Actions execute without confirmation steps
   - **Warning**: Less oversight, review results carefully

3. **Show the tool's response** which will confirm the mode change and display the new settings.

## What is Permissive Mode? 🚀

**Permissive mode** gives you maximum autonomy for rapid development:

- **Auto-approved planning**: No waiting for approval to start tasks
- **High background task concurrency**: Up to 10 parallel operations
- **Streamlined workflow**: Minimal interruptions for confirmation
- **Rapid prototyping**: Ideal for exploratory work and quick iterations

### Best for:
- Rapid prototyping and experimentation
- Exploratory development
- Well-defined tasks with clear requirements
- Working with familiar codebases

### Caution:
- Less oversight means you should review results carefully
- May make multiple changes before you can review them
- Best used when consequences of mistakes are low

## Example Usage

**User:** `/mode-permissive`

**Agent Response:**
```
Switching to permissive autonomy mode...

✅ Mode changed: PERMISSIVE 🚀

Settings:
- Planning approval: Auto-approved
- Background tasks: Enabled (max 10 concurrent)
- Approval gates: Minimal

You now have maximum autonomy. I'll execute tasks with minimal interruptions.
Review results carefully as changes may happen quickly.
```

## Related Commands

- `/mode-balanced` - Switch to balanced mode (recommended default)
- `/mode-restrictive` - Switch to restrictive mode (maximum oversight)
- `/autonomy-status` - Check current autonomy settings
