# Phase 2 Implementation Test Plan

## Overview
This document outlines the test plan for Phase 2: Permission Enforcement of the Autonomy Control Plugin.

## Implementation Summary

### Files Created/Modified
1. ✅ `.opencode/plugin/utils/risk-detection.ts` - NEW
   - `isDestructiveCommand()` - Detects destructive bash patterns
   - `getToolRiskLevel()` - Classifies tools as high/medium/low risk
   - `isReadOnlyTool()` - Helper for read-only detection
   - `isHighRiskTool()` - Helper for high-risk detection
   - `getRiskDescription()` - Human-readable risk descriptions

2. ✅ `.opencode/plugin/utils/formatting.ts` - ENHANCED
   - Updated `formatDetailedStatus()` to include:
     - Approval rate calculation
     - Recent approval history (last 5)
     - Better metrics display

3. ✅ `.opencode/plugin/autonomy-control.ts` - ENHANCED
   - Added `permission.ask` hook with mode-specific logic:
     - **Permissive Mode**: Allow all except destructive bash
     - **Balanced Mode**: Require approval for planning + high-risk tools
     - **Restrictive Mode**: Require approval for all except read-only tools
   - Added `tool.execute.after` hook for approval tracking:
     - Removes completed approvals from pending set
     - Tracks approval outcomes in history
     - Updates metrics counters
     - Limits history to 50 entries

## Test Cases

### 1. Risk Detection Tests

#### Test 1.1: Destructive Command Detection
```typescript
// Should detect as destructive:
isDestructiveCommand("rm -rf /tmp/test")           // ✓ true
isDestructiveCommand("rm -fr /tmp/test")           // ✓ true
isDestructiveCommand("rm *.txt")                   // ✓ true
isDestructiveCommand("rmdir /tmp/test")            // ✓ true
isDestructiveCommand("drop database mydb")         // ✓ true
isDestructiveCommand("truncate table users")       // ✓ true
isDestructiveCommand("sudo rm -rf /")              // ✓ true

// Should NOT detect as destructive:
isDestructiveCommand("ls -la")                     // ✗ false
isDestructiveCommand("echo 'test'")                // ✗ false
isDestructiveCommand("cat file.txt")               // ✗ false
isDestructiveCommand("grep pattern file.txt")      // ✗ false
```

#### Test 1.2: Tool Risk Classification
```typescript
// High risk tools:
getToolRiskLevel("write")    // "high"
getToolRiskLevel("edit")     // "high"
getToolRiskLevel("bash")     // "high"
getToolRiskLevel("delete")   // "high"
getToolRiskLevel("commit")   // "high"

// Medium risk tools:
getToolRiskLevel("task")     // "medium"
getToolRiskLevel("fetch")    // "medium"
getToolRiskLevel("search")   // "medium"

// Low risk tools:
getToolRiskLevel("read")     // "low"
getToolRiskLevel("list")     // "low"
getToolRiskLevel("grep")     // "low"
getToolRiskLevel("glob")     // "low"
```

### 2. Permissive Mode Tests

#### Test 2.1: Allow Non-Destructive Operations
**Setup**: Set mode to permissive
```bash
autonomy_control({ action: "set", mode: "permissive" })
```

**Expected Behavior**:
- `write` tool → ✅ ALLOW (no approval required)
- `edit` tool → ✅ ALLOW (no approval required)
- `read` tool → ✅ ALLOW (no approval required)
- `bash` with safe command → ✅ ALLOW (no approval required)

**Verification**:
```
✅ Permissive mode: allowing write
✅ Permissive mode: allowing edit
✅ Permissive mode: allowing read
✅ Permissive mode: allowing bash
```

#### Test 2.2: Block Destructive Bash Commands
**Setup**: Set mode to permissive
```bash
autonomy_control({ action: "set", mode: "permissive" })
```

**Test**: Execute bash with destructive command
```bash
bash({ command: "rm -rf /tmp/test" })
```

**Expected Behavior**:
- ⚠️ APPROVAL REQUIRED
- Metrics: `approvalsRequested` increments
- Pending approvals: Tool added to set

**Verification**:
```
⚠️ Destructive bash command detected in permissive mode: rm -rf /tmp/test
📊 Approval outcome: bash ✓ granted (if approved)
```

### 3. Balanced Mode Tests

#### Test 3.1: Allow Low/Medium Risk Tools
**Setup**: Set mode to balanced
```bash
autonomy_control({ action: "set", mode: "balanced" })
```

**Expected Behavior**:
- `read` tool → ✅ ALLOW (low risk)
- `list` tool → ✅ ALLOW (low risk)
- `grep` tool → ✅ ALLOW (low risk)
- `task` (non-planning) → ✅ ALLOW (medium risk, but not planning)

**Verification**:
```
✅ Balanced mode: allowing read
✅ Balanced mode: allowing list
✅ Balanced mode: allowing grep
```

#### Test 3.2: Block High-Risk Tools
**Setup**: Set mode to balanced
```bash
autonomy_control({ action: "set", mode: "balanced" })
```

**Test**: Execute high-risk tools
```bash
write({ path: "test.txt", content: "test" })
edit({ path: "test.txt", old: "test", new: "test2" })
delete({ path: "test.txt" })
```

**Expected Behavior**:
- ⚠️ APPROVAL REQUIRED for each
- Metrics: `approvalsRequested` increments by 3

**Verification**:
```
⚖️ Balanced mode: approval required for high-risk tool write
⚖️ Balanced mode: approval required for high-risk tool edit
⚖️ Balanced mode: approval required for high-risk tool delete
```

#### Test 3.3: Block Planning Tasks
**Setup**: Set mode to balanced
```bash
autonomy_control({ action: "set", mode: "balanced" })
```

**Test**: Execute task with planning type
```bash
task({ type: "plan", description: "Plan project" })
```

**Expected Behavior**:
- ⚠️ APPROVAL REQUIRED
- Metrics: `approvalsRequested` increments

**Verification**:
```
⚖️ Balanced mode: planning approval required for task
```

#### Test 3.4: Block Destructive Bash
**Setup**: Set mode to balanced
```bash
autonomy_control({ action: "set", mode: "balanced" })
```

**Test**: Execute destructive bash command
```bash
bash({ command: "rm -rf /tmp/test" })
```

**Expected Behavior**:
- ⚠️ APPROVAL REQUIRED
- Metrics: `approvalsRequested` increments

**Verification**:
```
⚖️ Balanced mode: destructive bash command requires approval
```

### 4. Restrictive Mode Tests

#### Test 4.1: Allow Read-Only Tools
**Setup**: Set mode to restrictive
```bash
autonomy_control({ action: "set", mode: "restrictive" })
```

**Expected Behavior**:
- `read` tool → ✅ ALLOW (read-only)
- `list` tool → ✅ ALLOW (read-only)
- `grep` tool → ✅ ALLOW (read-only)
- `glob` tool → ✅ ALLOW (read-only)

**Verification**:
```
✅ Restrictive mode: allowing read-only tool read
✅ Restrictive mode: allowing read-only tool list
✅ Restrictive mode: allowing read-only tool grep
✅ Restrictive mode: allowing read-only tool glob
```

#### Test 4.2: Block All Non-Read-Only Tools
**Setup**: Set mode to restrictive
```bash
autonomy_control({ action: "set", mode: "restrictive" })
```

**Test**: Execute various non-read-only tools
```bash
write({ path: "test.txt", content: "test" })
edit({ path: "test.txt", old: "test", new: "test2" })
task({ type: "execute", description: "Run task" })
bash({ command: "echo 'test'" })
```

**Expected Behavior**:
- ⚠️ APPROVAL REQUIRED for ALL
- Metrics: `approvalsRequested` increments by 4

**Verification**:
```
🛡️ Restrictive mode: approval required for write
🛡️ Restrictive mode: approval required for edit
🛡️ Restrictive mode: approval required for task
🛡️ Restrictive mode: approval required for bash
```

### 5. Approval Tracking Tests

#### Test 5.1: Pending Approvals Management
**Setup**: Set mode to restrictive, execute multiple tools

**Expected Behavior**:
1. `write` tool requires approval → Added to `pendingApprovals` set
2. User approves → Removed from `pendingApprovals` set
3. `approvalsGranted` increments
4. Approval added to `approvalHistory` array

**Verification**:
```
📊 Approval outcome: write ✓ granted
Recent Approval History (last 5):
  - write: ✓ Approved [restrictive] at 19:54:00
```

#### Test 5.2: Blocked Tool Tracking
**Setup**: Set mode to restrictive, execute tool and reject

**Expected Behavior**:
1. `write` tool requires approval → Added to `pendingApprovals` set
2. User rejects → Removed from `pendingApprovals` set
3. `toolCallsBlocked` increments
4. Rejection added to `approvalHistory` array

**Verification**:
```
📊 Approval outcome: write ✗ blocked
Recent Approval History (last 5):
  - write: ✗ Blocked [restrictive] at 19:54:00
```

#### Test 5.3: History Limit
**Setup**: Execute 60 tools requiring approval

**Expected Behavior**:
- `approvalHistory` array capped at 50 entries
- Oldest entries removed when limit exceeded

**Verification**:
```typescript
state.approvalHistory.length === 50  // Always ≤ 50
```

### 6. Status Report Tests

#### Test 6.1: Status Command Shows Approval Metrics
**Setup**: Execute various tools with approvals

**Command**:
```bash
autonomy_control({ action: "status" })
```

**Expected Output**:
```
📊 Autonomy Control Status

Mode: RESTRICTIVE 🛡️
Override: Session
Default: BALANCED

Background Tasks:
- Running: 0
- Max concurrent: 0
  (none)

Approval Metrics:
- Requests: 15
- Granted: 12
- Approval rate: 80%
- Blocked tools: 3
- Mode changes: 2

Recent Approval History (last 5):
  - write: ✓ Approved [restrictive] at 19:54:00
  - edit: ✓ Approved [restrictive] at 19:53:45
  - bash: ✗ Blocked [restrictive] at 19:53:30
  - delete: ✓ Approved [balanced] at 19:53:15
  - commit: ✗ Blocked [balanced] at 19:53:00

Session Info:
- Created: 1/18/2026, 7:52:00 PM
- Last mode change: 1/18/2026, 7:54:00 PM
- Duration: 2m 15s
```

### 7. Integration Tests

#### Test 7.1: Mode Change Updates Enforcement
**Test Flow**:
1. Start in permissive mode
2. Execute `write` tool → ✅ ALLOW
3. Change to restrictive mode
4. Execute `write` tool → ⚠️ APPROVAL REQUIRED

**Expected Behavior**:
- Permission enforcement updates immediately after mode change
- No restart required

#### Test 7.2: State Persistence
**Test Flow**:
1. Set mode to restrictive
2. Execute several tools requiring approval
3. Check status → Metrics recorded
4. Plugin reloads (session restart)
5. Check status → Metrics persisted

**Expected Behavior**:
- `approvalHistory` persists across restarts
- `metrics` values persist across restarts

## Success Criteria

### ✅ Phase 2 Complete When:
- [x] Risk detection utility created
- [x] `isDestructiveCommand()` detects all destructive patterns
- [x] `getToolRiskLevel()` classifies tools correctly
- [x] `permission.ask` hook implemented
- [x] Permissive mode logic: allows most, blocks destructive bash
- [x] Balanced mode logic: blocks high-risk + planning + destructive bash
- [x] Restrictive mode logic: blocks all except read-only
- [x] `tool.execute.after` tracks approval outcomes
- [x] Status command shows approval metrics
- [x] Status command shows approval history
- [x] No TypeScript errors
- [ ] All test cases pass (manual verification required)

## Manual Verification Steps

1. **Start OpenCode with plugin loaded**
   ```bash
   opencode
   ```

2. **Test Permissive Mode**
   ```
   > autonomy_control({ action: "set", mode: "permissive" })
   > (Try write, read, bash with safe command → should allow)
   > (Try bash with "rm -rf" → should require approval)
   ```

3. **Test Balanced Mode**
   ```
   > autonomy_control({ action: "set", mode: "balanced" })
   > (Try read, list → should allow)
   > (Try write, edit → should require approval)
   > (Try task with type: "plan" → should require approval)
   ```

4. **Test Restrictive Mode**
   ```
   > autonomy_control({ action: "set", mode: "restrictive" })
   > (Try read, list, grep → should allow)
   > (Try write, edit, bash → should require approval)
   ```

5. **Check Status and Metrics**
   ```
   > autonomy_control({ action: "status" })
   > (Verify approval metrics are displayed)
   > (Verify recent approval history shows last 5 decisions)
   ```

## Known Limitations

1. **Session ID**: Currently using "default" session ID in Phase 2. Will be enhanced in future phases to use actual session IDs from context.

2. **Toast Notifications**: Not implemented in Phase 2 (deferred to Phase 3).

3. **Background Task Limits**: Tracked but not enforced yet (Phase 4 feature).

4. **Keyword Detection**: Not implemented in Phase 2 (Phase 3 feature).

## Next Steps (Phase 3+)

- Phase 3: Implement keyword detection (`chat.message` hook)
- Phase 4: Implement background task tracking and limits
- Phase 5: Implement adaptive parameters (`chat.params` hook)
