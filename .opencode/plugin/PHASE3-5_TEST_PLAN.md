# Phase 3-5 Testing Plan

**Date:** 2026-01-18  
**Plugin:** Autonomy Control Plugin  
**Phases Tested:** 3 (Keyword Detection), 4 (Background Task Management), 5 (Adaptive Behavior)

---

## Quick Start Testing

### Prerequisites
1. Plugin is registered in [`opencode.json`](opencode.json)
2. OpenCode is restarted to load the plugin
3. A session is active

### Basic Verification
```bash
# 1. Check plugin loaded
# Look for in console: "✅ Autonomy control initialized for session {id}"

# 2. Test default mode
> What's the current autonomy mode?
# Expected: Agent calls autonomy_control({ action: "get" })
# Should show: "Current autonomy mode: BALANCED ⚖️"
```

---

## Phase 3: Keyword Detection Tests

### Test 1: Permissive Keyword - ultrawork:
```bash
> ultrawork: Create a new REST API with authentication

# Expected Behavior:
# ✅ Console log: "🔑 Keyword detected: ultrawork: → PERMISSIVE mode"
# ✅ Message stripped to: "Create a new REST API with authentication"
# ✅ Mode set to permissive for this message only
# ✅ High autonomy, minimal approval gates
# ✅ Temperature increased to ~0.84 (if default is 0.7)

# Verify next message returns to default:
> Add tests for the API

# Expected:
# ✅ No keyword detection
# ✅ Mode returns to session default (balanced)
# ✅ Normal approval workflow
```

### Test 2: Permissive Keyword - ulw:
```bash
> ulw: Fix the bug in utils.ts

# Expected Behavior:
# ✅ Console log: "🔑 Keyword detected: ulw: → PERMISSIVE mode"
# ✅ Message stripped to: "Fix the bug in utils.ts"
# ✅ Mode set to permissive
```

### Test 3: Permissive Keyword - quick:
```bash
> quick: Update documentation

# Expected Behavior:
# ✅ Console log: "🔑 Keyword detected: quick: → PERMISSIVE mode"
# ✅ Permissive mode active
```

### Test 4: Permissive Keyword - fast:
```bash
> fast: Refactor the codebase

# Expected Behavior:
# ✅ Console log: "🔑 Keyword detected: fast: → PERMISSIVE mode"
# ✅ Permissive mode active
```

### Test 5: Restrictive Keyword - careful:
```bash
> careful: Delete old migration files

# Expected Behavior:
# ✅ Console log: "🔑 Keyword detected: careful: → RESTRICTIVE mode"
# ✅ Message stripped to: "Delete old migration files"
# ✅ Mode set to restrictive
# ✅ All tools except reads require approval
# ✅ Temperature reduced to ~0.56 (if default is 0.7)
```

### Test 6: Restrictive Keyword - verify:
```bash
> verify: Deploy to production

# Expected Behavior:
# ✅ Console log: "🔑 Keyword detected: verify: → RESTRICTIVE mode"
# ✅ Maximum oversight mode
# ✅ All actions require approval
```

### Test 7: Restrictive Keyword - safe:
```bash
> safe: Run database migration

# Expected Behavior:
# ✅ Console log: "🔑 Keyword detected: safe: → RESTRICTIVE mode"
# ✅ Restrictive mode active
```

### Test 8: Restrictive Keyword - production:
```bash
> production: Update configuration

# Expected Behavior:
# ✅ Console log: "🔑 Keyword detected: production: → RESTRICTIVE mode"
# ✅ Restrictive mode active
```

### Test 9: No Keyword (Default Behavior)
```bash
> Create a new component

# Expected Behavior:
# ✅ No keyword detection log
# ✅ Uses session override OR default mode
# ✅ Normal processing
```

### Test 10: Keyword with Extra Spacing
```bash
> ultrawork:    Create feature with lots of spaces

# Expected Behavior:
# ✅ Keyword detected despite extra spacing
# ✅ All spaces after colon stripped
# ✅ Message: "Create feature with lots of spaces"
```

### Test 11: Case Insensitivity
```bash
> ULTRAWORK: Create feature
> Ultrawork: Create another feature
> ultrawork: Create yet another feature

# Expected Behavior:
# ✅ All variations detected correctly
# ✅ Case-insensitive matching
```

### Test 12: Keyword Override Session Mode
```bash
# First, set session mode
> /mode-restrictive

# Then use keyword override
> ultrawork: Quick prototype

# Expected:
# ✅ Keyword override takes precedence
# ✅ Runs in permissive mode (not restrictive)
# ✅ Next message returns to restrictive (session override)
```

---

## Phase 4: Background Task Management Tests

### Test 13: Background Task Tracking
```bash
# Trigger a tool with background metadata (if supported)
# Or observe existing background tasks

# Expected Behavior:
# ✅ Console log: "🔄 Background task started: {tool} ({taskID})"
# ✅ Task added to backgroundTasks Map
# ✅ Task tracked with startTime
# ✅ On completion: "✅ Background task completed: {tool} ({duration}ms)"
```

### Test 14: Task Status in Status Command
```bash
> Check autonomy status

# Expected Behavior:
# ✅ Status shows background tasks section:
#    Background Tasks:
#    - Running: {count}
#    - Max concurrent: {limit}
#    {list of running tasks if any}
```

### Test 15: Concurrent Task Limits - Balanced Mode
```bash
# Set balanced mode (limit: 5)
> /mode-balanced

# Simulate multiple background tasks
# (This requires tools that support background metadata)

# Expected Behavior:
# ✅ First 5 tasks tracked normally
# ✅ 6th task triggers: "⚠️  Background task limit reached (5)"
# ✅ Warning logged but execution continues
```

### Test 16: Concurrent Task Limits - Permissive Mode
```bash
# Set permissive mode (limit: 10)
> /mode-permissive

# Expected Behavior:
# ✅ Allows up to 10 concurrent tasks
# ✅ Warnings appear after 10
```

### Test 17: Concurrent Task Limits - Restrictive Mode
```bash
# Set restrictive mode (limit: 0)
> /mode-restrictive

# Expected Behavior:
# ✅ No background tasks allowed
# ✅ All tasks run sequentially
```

### Test 18: Task Completion Tracking
```bash
# Observe a tool execution from start to finish

# Expected Behavior:
# ✅ Start: "🔄 Background task started"
# ✅ End: "✅ Background task completed: {tool} ({duration}ms)"
# ✅ Task status updated to "completed"
# ✅ endTime recorded
```

### Test 19: Task Error Handling
```bash
# Trigger a tool that fails

# Expected Behavior:
# ✅ Task status updated to "error"
# ✅ Still logged in completion
# ✅ Duration calculated correctly
```

---

## Phase 5: Adaptive Behavior Tests

### Test 20: Temperature Adjustment - Permissive
```bash
> /mode-permissive
> Create something creative

# Expected Behavior:
# ✅ Console log: "🚀 Permissive mode: increased temperature to 0.84"
# ✅ Temperature: default * 1.2 (e.g., 0.7 → 0.84)
# ✅ Capped at maximum 1.0
```

### Test 21: Temperature Adjustment - Restrictive
```bash
> /mode-restrictive
> Execute precise operation

# Expected Behavior:
# ✅ Console log: "🛡️ Restrictive mode: reduced temperature to 0.56"
# ✅ Temperature: default * 0.8 (e.g., 0.7 → 0.56)
# ✅ Floored at minimum 0.1
```

### Test 22: Temperature Adjustment - Balanced
```bash
> /mode-balanced
> Normal operation

# Expected Behavior:
# ✅ Console log: "⚖️ Balanced mode: using default temperature 0.70"
# ✅ Temperature: unchanged from default
```

### Test 23: Temperature with Keyword Override
```bash
> ultrawork: Creative exploration

# Expected Behavior:
# ✅ Keyword sets mode to permissive
# ✅ Temperature increased to ~0.84
# ✅ Logged: "🚀 Permissive mode: increased temperature"

> careful: Precise calculation

# Expected Behavior:
# ✅ Keyword sets mode to restrictive
# ✅ Temperature reduced to ~0.56
# ✅ Logged: "🛡️ Restrictive mode: reduced temperature"
```

### Test 24: Enhanced Status Output
```bash
> Get detailed autonomy status

# Expected Behavior:
# ✅ Status includes all sections:
#    - Mode with emoji
#    - Override status (keyword/session/none)
#    - Default mode
#    - Background tasks (running, max, list)
#    - Approval metrics (requests, granted, rate%, blocked, changes)
#    - Recent approval history (last 5 with timestamps)
#    - Session info (created, last change, duration)
```

### Test 25: Approval Rate Calculation
```bash
# After several approved and blocked actions
> Check status

# Expected Behavior:
# ✅ Approval rate shown as percentage
# ✅ Formula: (approvalsGranted / approvalsRequested) * 100
# ✅ Example: "Approval rate: 87%"
```

### Test 26: Recent Approval History
```bash
> Check status

# Expected Behavior:
# ✅ Shows last 5 approval decisions
# ✅ Format: "- {tool}: {✓/✗} {result} [{mode}] at {time}"
# ✅ Example: "- write: ✓ Approved [permissive] at 19:45:32"
# ✅ Reverse chronological order (newest first)
```

### Test 27: Session Duration Formatting
```bash
# After running session for various durations
> Check status

# Expected Behavior:
# ✅ Duration formatted as human-readable
# ✅ Examples:
#    - "30s" (< 1 minute)
#    - "5m 45s" (< 1 hour)
#    - "2h 15m" (< 1 day)
#    - "1d 3h" (>= 1 day)
```

---

## Integration Tests

### Test 28: Complete Workflow - Rapid Prototyping
```bash
# Scenario: Quick feature development
> /mode-balanced
> ultrawork: Create REST API with auth, models, tests

# Expected Flow:
# 1. ✅ Session mode set to balanced
# 2. ✅ Keyword override to permissive
# 3. ✅ Temperature increased to 0.84
# 4. ✅ Tools allowed without approval (except destructive)
# 5. ✅ Background tasks tracked (max 10)
# 6. ✅ Next message returns to balanced mode
```

### Test 29: Complete Workflow - Production Deployment
```bash
# Scenario: Critical production change
> /mode-balanced
> careful: Deploy new version with zero downtime

# Expected Flow:
# 1. ✅ Session mode set to balanced
# 2. ✅ Keyword override to restrictive
# 3. ✅ Temperature reduced to 0.56
# 4. ✅ All tools require approval (except reads)
# 5. ✅ No background tasks allowed
# 6. ✅ All actions logged in approval history
# 7. ✅ Next message returns to balanced mode
```

### Test 30: Complete Workflow - Session Mode Persistence
```bash
# Scenario: Verify state persistence
> /mode-permissive
> Create a feature

# Close session, reopen

> Continue the feature

# Expected Behavior:
# ✅ Mode persists across session close/reopen
# ✅ Still in permissive mode
# ✅ Metrics preserved
# ✅ Approval history maintained
```

---

## Error Handling Tests

### Test 31: Malformed Message
```bash
# Empty message with keyword
> ultrawork:

# Expected Behavior:
# ✅ Gracefully handles empty content
# ✅ Mode still set to permissive
# ✅ No crash or error
```

### Test 32: Non-Text Message Parts
```bash
# Send message with only non-text parts (files, images)
# (Difficult to test manually, but code handles it)

# Expected Behavior:
# ✅ No keyword detection (no text parts)
# ✅ Uses session/default mode
# ✅ No error thrown
```

### Test 33: State Load Failure
```bash
# Delete state file while session active
# (Simulate persistence failure)

# Expected Behavior:
# ✅ Plugin continues working with in-memory state
# ✅ Warning logged: "❌ Failed to persist autonomy state"
# ✅ No crash
```

---

## Console Log Verification

### Expected Console Logs

**On Plugin Load:**
```
✅ Autonomy control initialized for session {sessionID}
   Default mode: balanced
```

**On Keyword Detection:**
```
🔑 Keyword detected: ultrawork: → PERMISSIVE mode
🔑 Keyword detected: careful: → RESTRICTIVE mode
```

**On Temperature Adjustment:**
```
🚀 Permissive mode: increased temperature to 0.84
🛡️ Restrictive mode: reduced temperature to 0.56
⚖️ Balanced mode: using default temperature 0.70
```

**On Background Task:**
```
🔄 Background task started: search (toolu_123)
✅ Background task completed: search (1234ms)
⚠️  Background task limit reached (5)
```

**On Permission Check:**
```
🔐 Permission check: tool=write, mode=restrictive
✅ Permissive mode: allowing write
🛡️  Restrictive mode: approval required for write
```

**On Session End:**
```
📊 Session {sessionID} autonomy metrics:
   Mode changes: 5
   Approvals: 13/15
   Blocked tools: 2
```

---

## Success Criteria

### Phase 3: Keyword Detection ✅
- [ ] All 8 keyword triggers work (4 permissive, 4 restrictive)
- [ ] Keywords stripped from message content
- [ ] Per-message mode override functional
- [ ] Priority resolution correct (keyword > session > default)
- [ ] Next message returns to session/default mode
- [ ] Case-insensitive matching works
- [ ] Handles extra whitespace

### Phase 4: Background Task Management ✅
- [ ] Background tasks detected and tracked
- [ ] Task lifecycle logged (start, complete, duration)
- [ ] Concurrent task limits enforced per mode
- [ ] Status shows background task information
- [ ] Task completion status updated correctly
- [ ] Error handling for failed tasks

### Phase 5: Adaptive Behavior ✅
- [ ] Temperature adjusted per mode
- [ ] Permissive: +20% temp (creative)
- [ ] Restrictive: -20% temp (precise)
- [ ] Balanced: default temp
- [ ] Parameter changes logged
- [ ] Enhanced status output complete
- [ ] Approval rate calculated correctly
- [ ] Recent approval history shown (last 5)
- [ ] Session duration formatted correctly

### Overall Integration ✅
- [ ] No TypeScript errors
- [ ] No runtime errors or crashes
- [ ] All hooks execute without blocking
- [ ] State persists across sessions
- [ ] Performance acceptable (<5ms per hook)
- [ ] Console logs informative and clear
- [ ] Error handling comprehensive

---

## Test Report Template

```markdown
## Test Execution Report

**Date:** YYYY-MM-DD
**Tester:** Name
**Plugin Version:** Phase 3-5 Complete

### Test Results

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | ultrawork: keyword | ✅ | Message stripped correctly |
| 2 | ulw: keyword | ✅ | - |
| ... | ... | ... | ... |

### Issues Found
1. Issue description
   - Expected: ...
   - Actual: ...
   - Severity: Low/Medium/High

### Overall Assessment
- Total Tests: X
- Passed: Y
- Failed: Z
- Success Rate: Y/X %

### Recommendation
- [ ] Approve for production
- [ ] Needs fixes (specify)
- [ ] Requires further testing
```

---

## Manual Testing Guide

### Setup
1. Ensure OpenCode is running
2. Verify plugin loaded in console
3. Open a test session
4. Have console visible for logs

### Execution
1. Test keywords systematically (all 8)
2. Test mode transitions
3. Monitor background tasks
4. Check status output
5. Verify temperature adjustments
6. Test error scenarios

### Validation
1. Check console logs for all expected messages
2. Verify state persistence (close/reopen session)
3. Confirm no errors in console
4. Review status output completeness
5. Test approval workflow integration

---

**Ready to Test:** ✅  
**Estimated Testing Time:** 30-45 minutes  
**Prerequisites:** Plugin installed, OpenCode running, test session active
