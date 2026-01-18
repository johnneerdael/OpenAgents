/**
 * Autonomy Controller Types
 */

export type AutonomyLevel = 'high' | 'medium' | 'low';

export interface AutonomyLevelSettings {
  can_execute_immediately: boolean;
  max_background_tasks: number;
  approval_required: boolean;
  tool_approval_required?: boolean;
  implicit_approval?: boolean;
  implicit_timeout_ms?: number;
  step_by_step?: boolean;
}

export interface AutonomyModeSettings {
  high_autonomy: AutonomyLevelSettings;
  medium_autonomy: AutonomyLevelSettings;
  low_autonomy: AutonomyLevelSettings;
}

export interface AutonomyConfig {
  modes: {
    default: string;
    permissive: AutonomyModeSettings;
    balanced: AutonomyModeSettings;
    restrictive: AutonomyModeSettings;
    [key: string]: any;
  };
  classification: {
    keywords: {
      high: string[];
      medium: string[];
      low: string[];
    };
    default_level: AutonomyLevel;
    confidence_threshold: number;
  };
  background_tasks: {
    enabled: boolean;
    max_concurrent: number;
  };
  approval_gates: {
    high: {
      required: boolean;
      timeout_ms: number;
    };
    medium: {
      required: boolean;
      timeout_ms: number;
      implicit: boolean;
    };
    low: {
      required: boolean;
      timeout_ms: number;
    };
  };
  reporting: {
    show_autonomy_level: boolean;
    show_background_tasks: boolean;
    verbose: boolean;
  };
}

export interface TaskClassification {
  level: AutonomyLevel;
  confidence: number;
  matched_keywords: string[];
  reasoning: string;
}

export interface Task {
  prompt?: string;
  [key: string]: any;
}

export interface ToolCall {
  name: string;
  arguments: any;
  [key: string]: any;
}

export interface AgentResult {
  success: boolean;
  duration_ms: number;
  metadata?: {
    autonomy_level?: AutonomyLevel;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface ExecutionContext {
  autonomy_level?: AutonomyLevel;
  approved?: boolean;
  [key: string]: any;
}
