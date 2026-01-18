/**
 * Autonomy Controller Hook
 * 
 * This hook manages autonomy levels and approval gates for agents based on task classification.
 * 
 * Hook Integration:
 * - onTaskSubmit: Classifies task and determines autonomy level
 * - onToolUse: Controls tool execution based on autonomy settings
 * - onAgentComplete: Reports autonomy decisions and tracks metrics
 */

// import type { PluginInput, HookResult } from '@opencode-ai/plugin';
// Since @opencode-ai/plugin is not available in the current environment's module resolution,
// we'll define minimal interfaces to allow the hook to function. 
// In a real OpenCode environment, these would be provided by the host.

export interface PluginInput {
  config: any;
  ui: {
    notify: (payload: { type: string; message: string }) => Promise<void>;
  };
}

export interface HookResult {
  modified: boolean;
  data?: any;
}

import type { AutonomyConfig, AutonomyModeSettings, AutonomyLevel, AutonomyLevelSettings, TaskClassification, Task, ToolCall, AgentResult, ExecutionContext } from './types';

/**
 * NOTE: Session autonomy state is managed by oh-my-opencode/src/shared/session-autonomy-state.ts
 * This hook imports those functions at runtime when the OpenCode extension is running.
 * For standalone testing, we provide inline stubs.
 */

// Inline session autonomy state (for when hook runs standalone)
const sessionAutonomyStore = new Map<string, 'permissive' | 'balanced' | 'restrictive'>();

function getSessionAutonomyMode(sessionId: string): 'permissive' | 'balanced' | 'restrictive' | null {
  // In production, this would import from oh-my-opencode shared module
  // For now, use inline storage
  return sessionAutonomyStore.get(sessionId) || null;
}

// Export for use by tools if needed
export function setSessionAutonomyMode(sessionId: string, mode: 'permissive' | 'balanced' | 'restrictive'): void {
  sessionAutonomyStore.set(sessionId, mode);
}

export function clearSessionAutonomyMode(sessionId: string): void {
  sessionAutonomyStore.delete(sessionId);
}

export function hasSessionAutonomyOverride(sessionId: string): boolean {
  return sessionAutonomyStore.has(sessionId);
}

/**
 * Create the autonomy controller hook
 */
export function createAutonomyControllerHook(input: PluginInput) {
  const baseConfig = loadAutonomyConfig(input.config);
  
  return {
    name: 'autonomy-controller',
    
    /**
     * Called when a task is submitted
     * Classifies the task and determines autonomy level
     */
    onTaskSubmit: async (task: Task): Promise<HookResult> => {
      // Get session ID from task context
      const sessionId = task.session_id || 'default';
      
      // Check for session override first
      const overrideMode = getSessionAutonomyMode(sessionId);
      
      // Apply session override if exists
      const config = overrideMode
        ? { ...baseConfig, modes: { ...baseConfig.modes, default: overrideMode } }
        : baseConfig;
      
      const classification = await classifyTask(task, config.classification);
      const autonomyLevel = determineAutonomyLevel(classification, config.classification.default_level);
      
      return {
        modified: true,
        data: {
          autonomy_level: autonomyLevel,
          autonomy_mode: config.modes.default,
          session_id: sessionId,
          session_override: overrideMode,
          can_execute_immediately: canExecuteImmediately(autonomyLevel, config),
          requires_approval: requiresApproval(autonomyLevel, config),
          background_tasks: getBackgroundCandidates(task, autonomyLevel),
          metadata: {
            classification,
            confidence: classification.confidence,
            timestamp: new Date().toISOString()
          }
        }
      } as any;
    },
    
    /**
     * Called when a tool is about to be used
     * Checks if approval is required based on autonomy level
     */
    onToolUse: async (toolCall: ToolCall, context: ExecutionContext): Promise<HookResult> => {
      const autonomyLevel = context.autonomy_level || 'medium';
      const sessionId = context.session_id || 'default';
      
      // Check for session override
      const overrideMode = getSessionAutonomyMode(sessionId);
      const config = overrideMode
        ? { ...baseConfig, modes: { ...baseConfig.modes, default: overrideMode } }
        : baseConfig;
      
      // Check if tool execution requires approval
      if (requiresApproval(autonomyLevel, config) && !context.approved) {
        return {
          modified: true,
          data: {
            blocked: true,
            reason: `Tool '${toolCall.name}' requires approval at ${autonomyLevel} autonomy level (mode: ${config.modes.default})`,
            approval_type: 'explicit'
          }
        } as any;
      }
      
      // Allow execution
      return { modified: false } as any;
    },
    
    /**
     * Called when an agent completes
     * Reports autonomy decisions and tracks metrics
     */
    onAgentComplete: async (result: AgentResult): Promise<void> => {
      // Report autonomy decisions
      if (baseConfig.reporting.show_autonomy_level) {
        const mode = result.metadata?.autonomy_mode || baseConfig.modes.default;
        await input.ui.notify({
          type: 'info',
          message: `Executed at ${result.metadata?.autonomy_level || 'medium'} autonomy level (mode: ${mode})`
        });
      }
      
      // Track metrics
      await trackMetrics(result, baseConfig);
    }
  };
}

/**
 * Load autonomy configuration from config
 */
export function loadAutonomyConfig(config: any): AutonomyConfig {
  return {
    modes: {
      default: config?.modes?.default || 'balanced',
      permissive: config?.modes?.permissive || getPermissiveDefaults(),
      balanced: config?.modes?.balanced || getBalancedDefaults(),
      restrictive: config?.modes?.restrictive || getRestrictiveDefaults()
    },
    classification: {
      keywords: {
        high: config?.classification?.keywords?.high || ['explore', 'find', 'analyze', 'search', 'review', 'ultrawork', 'ulw', 'quick', 'fast'],
        medium: config?.classification?.keywords?.medium || ['implement', 'add', 'modify', 'create', 'update', 'refactor'],
        low: config?.classification?.keywords?.low || ['design', 'architect', 'breaking', 'API', 'structure', 'careful', 'verify', 'safe']
      },
      default_level: config?.classification?.default_level || 'medium',
      confidence_threshold: config?.classification?.confidence_threshold || 0.7
    },
    background_tasks: {
      enabled: config?.background_tasks?.enabled ?? true,
      max_concurrent: config?.background_tasks?.max_concurrent || 5
    },
    approval_gates: {
      high: {
        required: config?.approval_gates?.high?.required ?? false,
        timeout_ms: config?.approval_gates?.high?.timeout_ms || 0
      },
      medium: {
        required: config?.approval_gates?.medium?.required ?? false,
        timeout_ms: config?.approval_gates?.medium?.timeout_ms || 5000,
        implicit: config?.approval_gates?.medium?.implicit ?? true
      },
      low: {
        required: config?.approval_gates?.low?.required ?? true,
        timeout_ms: config?.approval_gates?.low?.timeout_ms || 0
      }
    },
    reporting: {
      show_autonomy_level: config?.reporting?.show_autonomy_level ?? true,
      show_background_tasks: config?.reporting?.show_background_tasks ?? true,
      verbose: config?.reporting?.verbose ?? false
    }
  };
}

/**
 * Classify a task based on keywords and context
 */
export async function classifyTask(
  task: Task,
  classificationConfig: AutonomyConfig['classification']
): Promise<TaskClassification> {
  const taskText = task.prompt?.toLowerCase() || '';
  const keywords = classificationConfig.keywords;
  
  // Count keyword matches
  const highMatches = keywords.high.filter(k => taskText.includes(k.toLowerCase()));
  const mediumMatches = keywords.medium.filter(k => taskText.includes(k.toLowerCase()));
  const lowMatches = keywords.low.filter(k => taskText.includes(k.toLowerCase()));
  
  // Determine level based on matches
  let level: 'high' | 'medium' | 'low';
  let confidence = 0;
  let reasoning = '';
  
  if (highMatches.length > 0) {
    level = 'high';
    confidence = Math.min(0.5 + (highMatches.length * 0.15), 0.95);
    reasoning = `Matched high-autonomy keywords: ${highMatches.join(', ')}`;
  } else if (lowMatches.length > 0) {
    level = 'low';
    confidence = Math.min(0.5 + (lowMatches.length * 0.15), 0.95);
    reasoning = `Matched low-autonomy keywords: ${lowMatches.join(', ')}`;
  } else if (mediumMatches.length > 0) {
    level = 'medium';
    confidence = Math.min(0.5 + (mediumMatches.length * 0.15), 0.9);
    reasoning = `Matched medium-autonomy keywords: ${mediumMatches.join(', ')}`;
  } else {
    level = classificationConfig.default_level;
    confidence = 0.4;
    reasoning = 'No keywords matched, using default level';
  }
  
  return {
    level,
    confidence,
    matched_keywords: [...highMatches, ...mediumMatches, ...lowMatches],
    reasoning
  };
}

/**
 * Determine the autonomy level from classification
 */
export function determineAutonomyLevel(
  classification: TaskClassification,
  defaultLevel: AutonomyLevel
): AutonomyLevel {
  // If confidence is below threshold, use default level from config
  if (classification.confidence < 0.5) {
    return defaultLevel;
  }
  
  return classification.level;
}

/**
 * Check if a task can execute immediately based on autonomy level
 */
export function canExecuteImmediately(
  level: AutonomyLevel,
  config: AutonomyConfig
): boolean {
  const mode = config.modes[config.modes.default];
  if (!mode) return false;
  
  switch (level) {
    case 'high': return mode.high_autonomy.can_execute_immediately;
    case 'medium': return mode.medium_autonomy.can_execute_immediately;
    case 'low': return mode.low_autonomy.can_execute_immediately;
    default: return false;
  }
}

/**
 * Check if approval is required for the autonomy level
 */
export function requiresApproval(
  level: AutonomyLevel,
  config: AutonomyConfig
): boolean {
  const mode = config.modes[config.modes.default];
  if (mode) {
    const levelSettings = mode[`${level}_autonomy` as keyof AutonomyModeSettings] as AutonomyLevelSettings;
    if (levelSettings && levelSettings.approval_required !== undefined) {
      return levelSettings.approval_required;
    }
  }

  const approvalConfig = config.approval_gates[level];
  return approvalConfig?.required ?? true;
}

/**
 * Get background task candidates for a task based on autonomy level
 */
export function getBackgroundCandidates(
  task: Task,
  level: 'high' | 'medium' | 'low'
): string[] {
  // Generate background task candidates based on task type
  const candidates: string[] = [];
  
  switch (level) {
    case 'high':
      candidates.push('contextscout', 'explore');
      break;
    case 'medium':
      candidates.push('contextscout');
      break;
    case 'low':
      // No background tasks for low autonomy
      break;
  }
  
  return candidates;
}

/**
 * Get autonomy mode settings for a level
 */
function getAutonomyMode(
  config: AutonomyConfig,
  level: 'high' | 'medium' | 'low'
): AutonomyModeSettings {
  const mode = config.modes[config.modes.default];
  
  switch (level) {
    case 'high': return mode.high_autonomy;
    case 'medium': return mode.medium_autonomy;
    case 'low': return mode.low_autonomy;
  }
}

/**
 * Track autonomy metrics
 */
async function trackMetrics(
  result: AgentResult,
  config: AutonomyConfig
): Promise<void> {
  // Store metrics for analytics
  const metrics = {
    autonomy_level: result.metadata?.autonomy_level || 'medium',
    timestamp: new Date().toISOString(),
    duration_ms: result.duration_ms,
    success: result.success
  };
  
  // In production, send to metrics service
  console.log('[Autonomy] Metrics:', JSON.stringify(metrics));
}

/**
 * Get permissive mode defaults (like Sisyphus)
 */
function getPermissiveDefaults(): AutonomyModeSettings {
  return {
    high_autonomy: { can_execute_immediately: true, max_background_tasks: 10, approval_required: false, tool_approval_required: false },
    medium_autonomy: { can_execute_immediately: true, max_background_tasks: 5, approval_required: false, implicit_approval: false, tool_approval_required: false },
    low_autonomy: { can_execute_immediately: false, max_background_tasks: 2, approval_required: false, step_by_step: false, tool_approval_required: false }
  };
}

/**
 * Get balanced mode defaults (recommended)
 */
function getBalancedDefaults(): AutonomyModeSettings {
  return {
    high_autonomy: { can_execute_immediately: true, max_background_tasks: 5, approval_required: false, tool_approval_required: false },
    medium_autonomy: { can_execute_immediately: false, max_background_tasks: 3, approval_required: false, implicit_approval: true, implicit_timeout_ms: 5000, tool_approval_required: true },
    low_autonomy: { can_execute_immediately: false, max_background_tasks: 0, approval_required: true, step_by_step: true, tool_approval_required: true }
  };
}

/**
 * Get restrictive defaults (like OpenAgent)
 */
function getRestrictiveDefaults(): AutonomyModeSettings {
  return {
    high_autonomy: { can_execute_immediately: false, max_background_tasks: 2, approval_required: true, tool_approval_required: true },
    medium_autonomy: { can_execute_immediately: false, max_background_tasks: 1, approval_required: true, implicit_approval: false, implicit_timeout_ms: 0, tool_approval_required: true },
    low_autonomy: { can_execute_immediately: false, max_background_tasks: 0, approval_required: true, step_by_step: true, tool_approval_required: true }
  };
}
