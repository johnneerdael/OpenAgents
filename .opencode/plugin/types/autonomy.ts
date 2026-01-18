/**
 * Type definitions for the Autonomy Control Plugin
 */

/** Available autonomy modes */
export type AutonomyMode = "permissive" | "balanced" | "restrictive"

/** Configuration for a specific autonomy mode */
export interface ModeConfig {
  emoji: string
  planningApproval: boolean
  approvalGates: string
  backgroundTasks: boolean
  maxConcurrentTasks: number
  adaptiveTemperature: number
  description: string
}

/** Complete autonomy configuration */
export interface AutonomyConfig {
  autonomy: {
    defaultLevel: AutonomyMode
    modes: Record<AutonomyMode, ModeConfig>
    keywords: {
      permissive: string[]
      restrictive: string[]
    }
    toolRiskLevels?: {
      high: string[]
      medium: string[]
      low: string[]
    }
  }
}

/** Background task tracking */
export interface BackgroundTask {
  taskID: string
  tool: string
  status: "pending" | "running" | "completed" | "error"
  startTime: number
  endTime?: number
}

/** Approval record for metrics */
export interface ApprovalRecord {
  timestamp: number
  tool: string
  approved: boolean
  mode: AutonomyMode
}

/** Session metrics */
export interface SessionMetrics {
  toolCallsBlocked: number
  approvalsRequested: number
  approvalsGranted: number
  modeChanges: number
}

/** Complete session state */
export interface AutonomySessionState {
  // Core state
  sessionID: string
  currentMode: AutonomyMode
  defaultMode: AutonomyMode
  
  // Override tracking
  keywordOverride: AutonomyMode | null
  sessionOverride: AutonomyMode | null
  
  // Background tasks
  backgroundTasks: Map<string, BackgroundTask>
  maxConcurrentTasks: number
  
  // Approval tracking
  pendingApprovals: Set<string>
  approvalHistory: ApprovalRecord[]
  
  // Metrics
  metrics: SessionMetrics
  
  // Timestamps
  created: number
  lastModeChange: number
  lastActivity: number
}

/** Serializable version of session state (for JSON persistence) */
export interface SerializableAutonomySessionState {
  sessionID: string
  currentMode: AutonomyMode
  defaultMode: AutonomyMode
  keywordOverride: AutonomyMode | null
  sessionOverride: AutonomyMode | null
  backgroundTasks: Array<[string, BackgroundTask]>
  maxConcurrentTasks: number
  pendingApprovals: string[]
  approvalHistory: ApprovalRecord[]
  metrics: SessionMetrics
  created: number
  lastModeChange: number
  lastActivity: number
}
