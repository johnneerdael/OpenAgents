---
id: mode-balanced
name: Mode Balanced
description: "Switch to balanced autonomy mode (standard approval workflow)"
category: autonomy
version: 1.0.0
---

# Mode Balanced Command

When the user invokes `/mode-balanced`, you should immediately call the [`autonomy_control()`](cci:1:///autonomy_control) tool to switch to balanced mode.

## Instructions for Agent

1. **Call the autonomy_control tool** with these parameters:
   ```typescript
   autonomy_control({
     action: "set",
     mode: "balanced"
   })
   ```

2. **Explain the mode change** to the user:
   - Planning requires approval before execution
   - Background tasks enabled (up to 5 concurrent tasks)
   - Standard approval workflow for most operations
   - Good balance between autonomy and oversight

3. **Show the tool's response** which will confirm the mode change and display the new settings.

## What is Balanced Mode? ⚖️

**Balanced mode** is the recommended default for most development workflows:

- **Planning approval required**: You review and approve plans before execution
- **Moderate background concurrency**: Up to 5 parallel background tasks
- **Standard approval workflow**: Key decision points require confirmation
- **Best of both worlds**: Efficient workflow with appropriate oversight

### Best for:
- Standard development workflow
- Most day-to-day coding tasks
- Working on established projects
- When you want oversight without excessive interruptions

### Default Mode:
This is the **recommended default mode** for most users. It provides:
- Enough autonomy to be efficient
- Enough oversight to prevent mistakes
- Appropriate balance for team environments

## Example Usage

**User:** `/mode-balanced`

**Agent Response:**
```
Switching to balanced autonomy mode...

✅ Mode changed: BALANCED ⚖️

Settings:
- Planning approval: Required
- Background tasks: Enabled (max 5 concurrent)
- Approval gates: Standard workflow

Balanced mode active. I'll request approval for plans and key decisions.
This is the recommended default for most development work.
```

## Related Commands

- `/mode-permissive` - Switch to permissive mode (maximum autonomy)
- `/mode-restrictive` - Switch to restrictive mode (maximum oversight)
- `/autonomy-status` - Check current autonomy settings
