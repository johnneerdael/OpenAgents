/**
 * Autonomy Control Plugin - Phase 1: Core Plugin & Tool
 * 
 * Provides the autonomy_control tool for managing autonomy modes
 * and session state management.
 */

import { Plugin, tool } from "@opencode-ai/plugin"
import { writeFile, readFile, mkdir } from "node:fs/promises"
import { join } from "node:path"
import type {
  AutonomyConfig,
  AutonomyMode,
  AutonomySessionState,
  SerializableAutonomySessionState
} from "./types/autonomy.js"
import {
  loadAutonomyConfig,
  getDefaultConfig,
  getMaxTasks,
  getModeEmoji,
  getModeDescription
} from "./utils/config.js"
import {
  formatModeChangeResponse,
  formatCurrentMode,
  formatDetailedStatus
} from "./utils/formatting.js"
import {
  isDestructiveCommand,
  getToolRiskLevel,
  isReadOnlyTool,
  isHighRiskTool
} from "./utils/risk-detection.js"

/**
 * Main Autonomy Control Plugin
 */
export const AutonomyControlPlugin: Plugin = async (ctx) => {
  // Session state management
  const sessions = new Map<string, AutonomySessionState>()
  
  // Load configuration
  let config: AutonomyConfig
  try {
    config = await loadAutonomyConfig()
  } catch (error) {
    console.error("❌ Failed to load autonomy config:", error)
    config = getDefaultConfig()
  }
  
  /**
   * Get or create session state
   */
  function getOrCreateState(sessionID: string): AutonomySessionState {
    let state = sessions.get(sessionID)
    
    if (!state) {
      const defaultMode = config.autonomy.defaultLevel
      state = {
        sessionID,
        currentMode: defaultMode,
        defaultMode,
        keywordOverride: null,
        sessionOverride: null,
        backgroundTasks: new Map(),
        maxConcurrentTasks: getMaxTasks(config, defaultMode),
        pendingApprovals: new Set(),
        approvalHistory: [],
        metrics: {
          toolCallsBlocked: 0,
          approvalsRequested: 0,
          approvalsGranted: 0,
          modeChanges: 0
        },
        created: Date.now(),
        lastModeChange: Date.now(),
        lastActivity: Date.now()
      }
      sessions.set(sessionID, state)
    }
    
    return state
  }
  
  /**
   * Persist session state to disk
   */
  async function persistState(state: AutonomySessionState): Promise<void> {
    try {
      const stateDir = join(ctx.directory, ".opencode/state/autonomy")
      await mkdir(stateDir, { recursive: true })
      
      const statePath = join(stateDir, `${state.sessionID}.json`)
      
      // Convert to serializable format
      const serializable: SerializableAutonomySessionState = {
        sessionID: state.sessionID,
        currentMode: state.currentMode,
        defaultMode: state.defaultMode,
        keywordOverride: state.keywordOverride,
        sessionOverride: state.sessionOverride,
        backgroundTasks: Array.from(state.backgroundTasks.entries()),
        maxConcurrentTasks: state.maxConcurrentTasks,
        pendingApprovals: Array.from(state.pendingApprovals),
        approvalHistory: state.approvalHistory,
        metrics: state.metrics,
        created: state.created,
        lastModeChange: state.lastModeChange,
        lastActivity: state.lastActivity
      }
      
      await writeFile(statePath, JSON.stringify(serializable, null, 2), "utf-8")
    } catch (error) {
      console.error(`❌ Failed to persist autonomy state: ${error}`)
    }
  }
  
  /**
   * Load session state from disk
   */
  async function loadState(sessionID: string): Promise<AutonomySessionState | null> {
    try {
      const statePath = join(ctx.directory, ".opencode/state/autonomy", `${sessionID}.json`)
      const data = await readFile(statePath, "utf-8")
      const serializable = JSON.parse(data) as SerializableAutonomySessionState
      
      // Convert back to full state
      const state: AutonomySessionState = {
        ...serializable,
        backgroundTasks: new Map(serializable.backgroundTasks),
        pendingApprovals: new Set(serializable.pendingApprovals)
      }
      
      return state
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        console.error(`❌ Failed to load autonomy state: ${error}`)
      }
      return null
    }
  }
  
  // Return plugin hooks
  return {
    /**
     * Tool: autonomy_control
     * Control the autonomy mode for the current session
     */
    tool: {
      autonomy_control: tool({
        description: `Control the autonomy mode for the current session.

Modes:
- permissive: High autonomy, minimal approval gates (🚀)
- balanced: Standard workflow with planning approval (⚖️)
- restrictive: Maximum oversight, all actions require approval (🛡️)

Actions:
- set: Change the autonomy mode for this session
- get: Query the current autonomy mode and settings
- status: Get detailed status including background tasks

Examples:
autonomy_control({ action: "set", mode: "permissive" })
autonomy_control({ action: "get" })
autonomy_control({ action: "status" })`,
        
        args: {},
        
        async execute(args: any) {
          const action = args.action as string
          const mode = args.mode as string | undefined
          try {
            // For Phase 1, use a default session ID
            const sessionID = "default"
            const state = getOrCreateState(sessionID)
            
            switch (action) {
              case "set": {
                if (!mode) {
                  return "Error: mode is required when action is 'set'"
                }
                
                // Validate mode
                if (!["permissive", "balanced", "restrictive"].includes(mode)) {
                  return `Error: Invalid mode '${mode}'. Valid modes: permissive, balanced, restrictive`
                }
                
                // Update state
                state.sessionOverride = mode as AutonomyMode
                state.currentMode = mode as AutonomyMode
                state.lastModeChange = Date.now()
                state.metrics.modeChanges++
                
                // Update max concurrent tasks based on mode
                state.maxConcurrentTasks = getMaxTasks(config, mode as AutonomyMode)
                
                // Persist state
                await persistState(state)
                
                // TODO: Add toast notification in Phase 2
                // (Requires proper event publishing API)
                console.log(`✅ Mode changed to ${mode.toUpperCase()}`)
                
                return formatModeChangeResponse(state, config)
              }
              
              case "get": {
                return formatCurrentMode(state, config)
              }
              
              case "status": {
                return formatDetailedStatus(state, config)
              }
              
              default: {
                return `Error: Unknown action '${action}'. Valid actions: set, get, status`
              }
            }
          } catch (error) {
            console.error("❌ Error in autonomy_control tool:", error)
            return `Error: ${error instanceof Error ? error.message : String(error)}`
          }
        }
      })
    },
    
    /**
     * Event Hook: Track session lifecycle
     */
    async event({ event }) {
      try {
        // Session created - initialize state
        if (event.type === "session.created") {
          const sessionID = event.properties.info.id
          
          // Try to load existing state
          const loadedState = await loadState(sessionID)
          
          if (loadedState) {
            sessions.set(sessionID, loadedState)
            console.log(`✅ Autonomy control restored for session ${sessionID}`)
            console.log(`   Current mode: ${loadedState.currentMode}`)
          } else {
            // Create new state
            const defaultMode = config.autonomy.defaultLevel
            const state = getOrCreateState(sessionID)
            await persistState(state)
            
            console.log(`✅ Autonomy control initialized for session ${sessionID}`)
            console.log(`   Default mode: ${defaultMode}`)
          }
        }
        
        // Session deleted - cleanup
        if (event.type === "session.deleted") {
          const sessionID = event.properties.info.id
          const state = sessions.get(sessionID)
          
          if (state) {
            // Final metrics log
            console.log(`📊 Session ${sessionID} autonomy metrics:`)
            console.log(`   Mode changes: ${state.metrics.modeChanges}`)
            console.log(`   Approvals: ${state.metrics.approvalsGranted}/${state.metrics.approvalsRequested}`)
            console.log(`   Blocked tools: ${state.metrics.toolCallsBlocked}`)
            
            // Cleanup in-memory state
            sessions.delete(sessionID)
          }
        }
        
        // Message updated - update activity timestamp
        if (event.type === "message.updated") {
          const msg = event.properties.info
          const state = sessions.get(msg.sessionID)
          
          if (state) {
            state.lastActivity = Date.now()
            // Don't persist on every message update to avoid performance impact
          }
        }
      } catch (error) {
        console.error("❌ Autonomy control event error:", error)
      }
    },
    
    /**
     * Permission Hook: Enforce approval gates based on autonomy mode
     */
    async "permission.ask"(input, output) {
      try {
        // Extract session ID from input
        const sessionID = (input as any).sessionID || "default"
        const state = sessions.get(sessionID)
        
        if (!state) {
          // No autonomy state - use default permissive behavior
          console.log("⚠️  No autonomy state found, allowing by default")
          return
        }
        
        const mode = state.currentMode
        const tool = (input as any).tool
        const args = (input as any).args || {}
        
        // Log permission check
        console.log(`🔐 Permission check: tool=${tool}, mode=${mode}`)
        
        // PERMISSIVE MODE: Allow everything except destructive bash commands
        if (mode === "permissive") {
          // Check for destructive bash commands
          if (tool === "bash" && args.command && isDestructiveCommand(args.command)) {
            console.log(`⚠️  Destructive bash command detected in permissive mode: ${args.command}`)
            output.status = "ask"
            state.metrics.approvalsRequested++
            state.pendingApprovals.add((input as any).callID || tool)
            await persistState(state)
            return
          }
          
          // Allow all other tools
          output.status = "allow"
          console.log(`✅ Permissive mode: allowing ${tool}`)
          return
        }
        
        // BALANCED MODE: Require approval for planning tools and high-risk operations
        if (mode === "balanced") {
          // Planning tools need approval
          if (tool === "task" && args.type === "plan") {
            console.log(`⚖️  Balanced mode: planning approval required for task`)
            output.status = "ask"
            state.metrics.approvalsRequested++
            state.pendingApprovals.add((input as any).callID || tool)
            await persistState(state)
            return
          }
          
          // High risk tools need approval
          if (isHighRiskTool(tool)) {
            console.log(`⚖️  Balanced mode: approval required for high-risk tool ${tool}`)
            output.status = "ask"
            state.metrics.approvalsRequested++
            state.pendingApprovals.add((input as any).callID || tool)
            await persistState(state)
            return
          }
          
          // Check for destructive bash commands
          if (tool === "bash" && args.command && isDestructiveCommand(args.command)) {
            console.log(`⚖️  Balanced mode: destructive bash command requires approval`)
            output.status = "ask"
            state.metrics.approvalsRequested++
            state.pendingApprovals.add((input as any).callID || tool)
            await persistState(state)
            return
          }
          
          // Allow medium and low risk tools
          output.status = "allow"
          console.log(`✅ Balanced mode: allowing ${tool}`)
          return
        }
        
        // RESTRICTIVE MODE: Require approval for everything except read-only tools
        if (mode === "restrictive") {
          // Read-only tools are allowed
          if (isReadOnlyTool(tool)) {
            output.status = "allow"
            console.log(`✅ Restrictive mode: allowing read-only tool ${tool}`)
            return
          }
          
          // Everything else needs approval
          console.log(`🛡️  Restrictive mode: approval required for ${tool}`)
          output.status = "ask"
          state.metrics.approvalsRequested++
          state.pendingApprovals.add((input as any).callID || tool)
          await persistState(state)
          return
        }
        
        // Default: allow (should not reach here)
        console.log(`⚠️  Unknown mode ${mode}, allowing by default`)
        output.status = "allow"
      } catch (error) {
        console.error("❌ Permission hook error:", error)
        // On error, default to asking for approval (safe)
        output.status = "ask"
      }
    },
    
    /**
     * Message Hook: Detect keyword triggers and apply per-message overrides
     */
    async "chat.message"(input, output) {
      try {
        const message = output.message
        const sessionID = message.sessionID
        const state = getOrCreateState(sessionID)
        
        // Reset keyword override for new message
        state.keywordOverride = null
        
        // Extract text content from message parts
        const textParts = output.parts.filter((part: any) => part.type === "text")
        if (textParts.length === 0) {
          // No text content, use default mode
          state.currentMode = state.sessionOverride || state.defaultMode
          state.lastActivity = Date.now()
          await persistState(state)
          return
        }
        
        // Get the first text part's content
        const firstTextPart = textParts[0] as any
        const text = (firstTextPart.text || "").trim()
        const lowerText = text.toLowerCase()
        
        // Permissive triggers
        const permissiveTriggers = ["ultrawork:", "ulw:", "quick:", "fast:"]
        const permissiveMatch = permissiveTriggers.find(trigger => lowerText.startsWith(trigger))
        
        if (permissiveMatch) {
          state.keywordOverride = "permissive"
          state.currentMode = "permissive"
          
          // Strip keyword from message text
          firstTextPart.text = text.replace(/^(ultrawork|ulw|quick|fast):\s*/i, '')
          
          console.log(`🔑 Keyword detected: ${permissiveMatch} → PERMISSIVE mode`)
          
          // TODO: Add toast notification when proper event publishing API is available
          // await ctx.client.events.publish({...})
        }
        
        // Restrictive triggers
        const restrictiveTriggers = ["careful:", "verify:", "safe:", "production:"]
        const restrictiveMatch = restrictiveTriggers.find(trigger => lowerText.startsWith(trigger))
        
        if (restrictiveMatch) {
          state.keywordOverride = "restrictive"
          state.currentMode = "restrictive"
          
          // Strip keyword from message text
          firstTextPart.text = text.replace(/^(careful|verify|safe|production):\s*/i, '')
          
          console.log(`🔑 Keyword detected: ${restrictiveMatch} → RESTRICTIVE mode`)
          
          // TODO: Add toast notification when proper event publishing API is available
        }
        
        // If no keyword, use priority resolution: Session > Default
        if (!state.keywordOverride) {
          state.currentMode = state.sessionOverride || state.defaultMode
        }
        
        // Update last activity
        state.lastActivity = Date.now()
        
        await persistState(state)
      } catch (error) {
        console.error("❌ Message hook error:", error)
      }
    },
    
    /**
     * Chat Params Hook: Adjust LLM parameters based on autonomy mode
     */
    async "chat.params"(input, output) {
      try {
        const sessionID = input.message.sessionID
        const state = sessions.get(sessionID)
        
        if (!state) return
        
        // Adjust temperature based on autonomy mode
        switch (state.currentMode) {
          case "permissive":
            // Higher temperature for creative exploration
            output.temperature = Math.min((output.temperature || 0.7) * 1.2, 1.0)
            console.log(`🚀 Permissive mode: increased temperature to ${output.temperature.toFixed(2)}`)
            break
          
          case "restrictive":
            // Lower temperature for precise execution
            output.temperature = Math.max((output.temperature || 0.7) * 0.8, 0.1)
            console.log(`🛡️ Restrictive mode: reduced temperature to ${output.temperature.toFixed(2)}`)
            break
          
          case "balanced":
            // Keep default temperature
            console.log(`⚖️ Balanced mode: using default temperature ${(output.temperature || 0.7).toFixed(2)}`)
            break
        }
      } catch (error) {
        console.error("❌ Chat params hook error:", error)
      }
    },
    
    /**
     * Tool Execution Hook (Before): Track background task starts
     */
    async "tool.execute.before"(input, output) {
      try {
        const sessionID = (input as any).sessionID || "default"
        const state = sessions.get(sessionID)
        
        if (!state) return
        
        // Track background task starts
        if ((input as any).metadata?.background) {
          const taskID = (input as any).callID || `${(input as any).tool}-${Date.now()}`
          
          // Check concurrent task limit
          const runningTasks = Array.from(state.backgroundTasks.values())
            .filter(t => t.status === "running")
          
          if (runningTasks.length >= state.maxConcurrentTasks) {
            console.warn(`⚠️  Background task limit reached (${state.maxConcurrentTasks})`)
            // Log warning but continue - could be enhanced to queue tasks in the future
          }
          
          // Add to background tasks Map
          state.backgroundTasks.set(taskID, {
            taskID,
            tool: (input as any).tool,
            status: "running",
            startTime: Date.now()
          })
          
          console.log(`🔄 Background task started: ${(input as any).tool} (${taskID})`)
        }
      } catch (error) {
        console.error("❌ Tool execution before hook error:", error)
      }
    },
    
    /**
     * Tool Execution Hook (After): Track approval outcomes and metrics
     */
    async "tool.execute.after"(input, output) {
      try {
        const sessionID = (input as any).sessionID || "default"
        const state = sessions.get(sessionID)
        
        if (!state) return
        
        const callID = (input as any).callID
        const tool = (input as any).tool
        
        // Track approval outcomes
        if (callID && state.pendingApprovals.has(callID)) {
          state.pendingApprovals.delete(callID)
          
          // Check if the tool execution was successful
          const approved = !(output as any).error
          
          if (approved) {
            state.metrics.approvalsGranted++
          } else {
            state.metrics.toolCallsBlocked++
          }
          
          // Add to approval history
          state.approvalHistory.push({
            timestamp: Date.now(),
            tool,
            approved,
            mode: state.currentMode
          })
          
          // Limit history to last 50 entries to avoid unbounded growth
          if (state.approvalHistory.length > 50) {
            state.approvalHistory = state.approvalHistory.slice(-50)
          }
          
          console.log(`📊 Approval outcome: ${tool} ${approved ? "✓ granted" : "✗ blocked"}`)
          
          // Persist updated state
          await persistState(state)
        }
        
        // Update background task completion (from Phase 1, kept for Phase 4)
        const taskID = callID
        const task = state.backgroundTasks.get(taskID)
        
        if (task) {
          task.status = (output as any).error ? "error" : "completed"
          task.endTime = Date.now()
          
          const duration = task.endTime - task.startTime
          console.log(`✅ Background task completed: ${task.tool} (${duration}ms)`)
        }
      } catch (error) {
        console.error("❌ Tool execution after hook error:", error)
      }
    }
  }
}

// Export as default
export default AutonomyControlPlugin
