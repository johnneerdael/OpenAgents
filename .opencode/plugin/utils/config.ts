/**
 * Configuration loading utilities for Autonomy Control Plugin
 */

import { readFile } from "node:fs/promises"
import { join } from "node:path"
import type { AutonomyConfig, AutonomyMode, ModeConfig } from "../types/autonomy"

/**
 * Get default configuration for autonomy control
 */
export function getDefaultConfig(): AutonomyConfig {
  return {
    autonomy: {
      defaultLevel: "balanced",
      modes: {
        permissive: {
          emoji: "🚀",
          planningApproval: false,
          approvalGates: "Minimal",
          backgroundTasks: true,
          maxConcurrentTasks: 10,
          adaptiveTemperature: 1.2,
          description: "High autonomy for rapid prototyping and exploration"
        },
        balanced: {
          emoji: "⚖️",
          planningApproval: true,
          approvalGates: "Standard workflow",
          backgroundTasks: true,
          maxConcurrentTasks: 5,
          adaptiveTemperature: 1.0,
          description: "Balanced mode with planning approval and autonomous execution"
        },
        restrictive: {
          emoji: "🛡️",
          planningApproval: true,
          approvalGates: "Maximum (every action)",
          backgroundTasks: false,
          maxConcurrentTasks: 0,
          adaptiveTemperature: 0.8,
          description: "Maximum oversight for production and critical operations"
        }
      },
      keywords: {
        permissive: ["ultrawork", "ulw", "quick", "fast"],
        restrictive: ["careful", "verify", "safe", "production"]
      },
      toolRiskLevels: {
        high: ["write", "edit", "bash", "delete", "commit"],
        medium: ["task", "patch"],
        low: ["read", "list", "grep", "glob", "search"]
      }
    }
  }
}

/**
 * Load autonomy configuration from file or use defaults
 * Attempts to load from ~/.config/opencode/autonomy.json
 */
export async function loadAutonomyConfig(): Promise<AutonomyConfig> {
  const configPath = join(
    process.env.HOME || process.env.USERPROFILE || "/tmp",
    ".config/opencode/autonomy.json"
  )
  
  try {
    const data = await readFile(configPath, "utf-8")
    const config = JSON.parse(data) as AutonomyConfig
    
    // Validate configuration
    if (!config.autonomy || !config.autonomy.defaultLevel || !config.autonomy.modes) {
      console.warn("⚠️  Invalid autonomy.json structure, using defaults")
      return getDefaultConfig()
    }
    
    console.log(`✅ Autonomy config loaded from ${configPath}`)
    return config
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      console.log("⚠️  No autonomy.json found, using defaults")
    } else {
      console.error(`❌ Error loading autonomy.json: ${error}`)
    }
    return getDefaultConfig()
  }
}

/**
 * Get configuration for a specific mode
 */
export function getModeConfig(config: AutonomyConfig, mode: AutonomyMode): ModeConfig {
  return config.autonomy.modes[mode]
}

/**
 * Get the emoji for a specific mode
 */
export function getModeEmoji(config: AutonomyConfig, mode: AutonomyMode): string {
  return config.autonomy.modes[mode].emoji
}

/**
 * Get the description for a specific mode
 */
export function getModeDescription(config: AutonomyConfig, mode: AutonomyMode): string {
  return config.autonomy.modes[mode].description
}

/**
 * Get maximum concurrent tasks for a mode
 */
export function getMaxTasks(config: AutonomyConfig, mode: AutonomyMode): number {
  return config.autonomy.modes[mode].maxConcurrentTasks
}
