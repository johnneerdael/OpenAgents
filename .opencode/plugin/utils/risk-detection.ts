/**
 * Risk detection utilities for Autonomy Control Plugin
 * 
 * Provides tool risk classification and destructive command detection
 * for permission enforcement.
 */

export type RiskLevel = "high" | "medium" | "low"

/**
 * Detect if a bash command contains destructive patterns
 * 
 * @param command - The bash command to analyze
 * @returns true if the command is potentially destructive
 */
export function isDestructiveCommand(command: string): boolean {
  if (!command || typeof command !== "string") {
    return false
  }
  
  // Destructive patterns to detect
  const destructivePatterns = [
    // Recursive deletion patterns
    /rm\s+-[a-zA-Z]*r[a-zA-Z]*f/,  // rm -rf, rm -fr, rm -r -f, etc.
    /rm\s+-[a-zA-Z]*f[a-zA-Z]*r/,  // rm -fr
    /rm\s+.*\*/,                    // rm with wildcards (rm *, rm ./*.txt, etc.)
    /rm\s+.*\.\*/,                  // rm with .* patterns
    /rm\s+-r(?!\w)/,                // rm -r (recursive)
    
    // Directory removal
    /rmdir\s+/,
    
    // Generic destructive keywords
    /\bdelete\b/i,
    /\btruncate\b/i,
    /\bdrop\s+(?:database|table|schema)\b/i,
    
    // File overwrite patterns
    />\s*\/[^\s]+/,                 // Redirect to system paths like > /etc/hosts
    
    // System modification
    /\bmkfs\b/,                      // Make filesystem
    /\bdd\s+if=/,                   // Disk dump
    /\bformat\b/i,
    
    // Dangerous sudo patterns
    /sudo\s+rm/,
    /sudo\s+.*\bdelete\b/i
  ]
  
  return destructivePatterns.some(pattern => pattern.test(command))
}

/**
 * Classify tool risk level for permission enforcement
 * 
 * @param tool - The tool name to classify
 * @returns Risk level: "high", "medium", or "low"
 */
export function getToolRiskLevel(tool: string): RiskLevel {
  if (!tool || typeof tool !== "string") {
    return "medium" // Default to medium risk for unknown tools
  }
  
  // High risk tools - destructive or system-modifying operations
  const highRiskTools = [
    "write",      // Write files
    "edit",       // Edit existing files
    "bash",       // Execute shell commands
    "delete",     // Delete files
    "execute",    // Execute arbitrary code
    "commit",     // Git commits (permanent)
    "patch"       // Apply patches (file modification)
  ]
  
  // Medium risk tools - create artifacts or manage state
  const mediumRiskTools = [
    "task",       // Create subtasks (resource usage)
    "fetch",      // Network requests
    "search",     // External search (potential API costs)
    "ask"         // User interaction (workflow interruption)
  ]
  
  // Low risk tools - read-only operations
  const readOnlyTools = [
    "read",       // Read files
    "list",       // List directory contents
    "grep",       // Search in files
    "glob",       // File pattern matching
    "search_files" // Search within project
  ]
  
  // Classify tool
  if (highRiskTools.includes(tool.toLowerCase())) {
    return "high"
  }
  
  if (mediumRiskTools.includes(tool.toLowerCase())) {
    return "medium"
  }
  
  if (readOnlyTools.includes(tool.toLowerCase())) {
    return "low"
  }
  
  // Default: unknown tools are medium risk
  return "medium"
}

/**
 * Check if a tool is read-only (safe in all modes)
 * 
 * @param tool - The tool name to check
 * @returns true if the tool is read-only
 */
export function isReadOnlyTool(tool: string): boolean {
  return getToolRiskLevel(tool) === "low"
}

/**
 * Check if a tool is high risk (requires approval in most modes)
 * 
 * @param tool - The tool name to check
 * @returns true if the tool is high risk
 */
export function isHighRiskTool(tool: string): boolean {
  return getToolRiskLevel(tool) === "high"
}

/**
 * Get a human-readable description of why a tool is risky
 * 
 * @param tool - The tool name
 * @param command - Optional command/args for context
 * @returns Description of the risk
 */
export function getRiskDescription(tool: string, command?: string): string {
  const riskLevel = getToolRiskLevel(tool)
  
  if (tool === "bash" && command && isDestructiveCommand(command)) {
    return "Destructive bash command detected (file deletion or system modification)"
  }
  
  switch (riskLevel) {
    case "high":
      return `High-risk operation: ${tool} can modify files or system state`
    case "medium":
      return `Medium-risk operation: ${tool} can create artifacts or manage state`
    case "low":
      return `Low-risk operation: ${tool} performs read-only operations`
    default:
      return "Unknown risk level"
  }
}
