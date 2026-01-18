/**
 * Response formatting utilities for Autonomy Control Plugin
 */

import type { AutonomyConfig, AutonomyMode, AutonomySessionState } from "../types/autonomy"
import { getModeConfig, getModeEmoji, getModeDescription } from "./config"

/**
 * Format duration in milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

/**
 * Format mode change response
 */
export function formatModeChangeResponse(
  state: AutonomySessionState,
  config: AutonomyConfig
): string {
  const emoji = getModeEmoji(config, state.currentMode)
  const modeConfig = getModeConfig(config, state.currentMode)
  
  return `✅ Mode changed: ${state.currentMode.toUpperCase()} ${emoji}

Settings:
- Planning approval: ${modeConfig.planningApproval ? "Required" : "Auto-approved"}
- Background tasks: ${modeConfig.backgroundTasks ? `Enabled (max ${state.maxConcurrentTasks} concurrent)` : "Disabled"}
- Approval gates: ${modeConfig.approvalGates}

${getModeDescription(config, state.currentMode)}`
}

/**
 * Format current mode response
 */
export function formatCurrentMode(
  state: AutonomySessionState,
  config: AutonomyConfig
): string {
  const emoji = getModeEmoji(config, state.currentMode)
  const overrideStatus = state.sessionOverride 
    ? "Session override active" 
    : state.keywordOverride 
      ? "Keyword override active"
      : "Using default"
  
  return `Current autonomy mode: ${state.currentMode.toUpperCase()} ${emoji}
Override: ${overrideStatus}
Background tasks: ${state.backgroundTasks.size} running (max ${state.maxConcurrentTasks})`
}

/**
 * Format detailed status response
 */
export function formatDetailedStatus(
  state: AutonomySessionState,
  config: AutonomyConfig
): string {
  const emoji = getModeEmoji(config, state.currentMode)
  const runningTasks = Array.from(state.backgroundTasks.values())
    .filter(t => t.status === "running")
  
  const overrideInfo = state.sessionOverride
    ? "Session"
    : state.keywordOverride
      ? "Keyword"
      : "None"
  
  const tasksList = runningTasks.length > 0
    ? runningTasks.map(t => `  - ${t.tool} (${t.taskID})`).join('\n')
    : "  (none)"
  
  // Format approval history (last 5 decisions)
  const recentHistory = state.approvalHistory.slice(-5).reverse()
  const historyList = recentHistory.length > 0
    ? recentHistory.map(h => {
        const result = h.approved ? "✓ Approved" : "✗ Blocked"
        const time = new Date(h.timestamp).toLocaleTimeString()
        return `  - ${h.tool}: ${result} [${h.mode}] at ${time}`
      }).join('\n')
    : "  (none)"
  
  // Calculate approval rate
  const approvalRate = state.metrics.approvalsRequested > 0
    ? Math.round((state.metrics.approvalsGranted / state.metrics.approvalsRequested) * 100)
    : 0
  
  return `📊 Autonomy Control Status

Mode: ${state.currentMode.toUpperCase()} ${emoji}
Override: ${overrideInfo}
Default: ${state.defaultMode.toUpperCase()}

Background Tasks:
- Running: ${runningTasks.length}
- Max concurrent: ${state.maxConcurrentTasks}
${tasksList}

Approval Metrics:
- Requests: ${state.metrics.approvalsRequested}
- Granted: ${state.metrics.approvalsGranted}
- Approval rate: ${approvalRate}%
- Blocked tools: ${state.metrics.toolCallsBlocked}
- Mode changes: ${state.metrics.modeChanges}

Recent Approval History (last 5):
${historyList}

Session Info:
- Created: ${new Date(state.created).toLocaleString()}
- Last mode change: ${new Date(state.lastModeChange).toLocaleString()}
- Duration: ${formatDuration(Date.now() - state.created)}`
}
