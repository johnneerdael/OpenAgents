# Autonomy Guidelines

## Autonomy Levels

Tasks are classified into three autonomy levels that determine how much independence the agent has:

### High Autonomy (Exploratory Tasks)
For tasks where you should act autonomously without waiting for approval:
- **Code exploration and analysis** - reading files, understanding structure, finding patterns
- **Background research** - searching docs, looking up APIs, investigating issues
- **Quick fixes** - obvious corrections that don't change behavior or architecture
- **Information gathering** - collecting facts, running diagnostics

**For these tasks**: Act independently. You don't need to ask for approval. Use background agents for parallel exploration.

### Medium Autonomy (Implementation Tasks)
For tasks that require implementation but have clear scope:
- **Feature implementation** - adding functionality within defined requirements
- **Refactoring** - improving code structure without changing behavior
- **Test creation** - adding tests for existing functionality
- **Documentation** - writing docs for existing features

**For these tasks**: Propose a brief plan, then execute. Use background agents for verification.

### Low Autonomy (Planning Tasks)
For tasks that require user input or approval:
- **Architectural decisions** - changing system structure
- **API design** - creating new interfaces
- **Scope changes** - modifying requirements or deliverables
- **Risky operations** - anything that could break functionality

**For these tasks**: Always present a clear plan and wait for approval before proceeding.

## Task Classification Quick Reference

| Task Type | Autonomy | Action |
|-----------|----------|--------|
| Explore codebase | High | Execute freely |
| Find patterns | High | Execute freely |
| Search documentation | High | Execute freely |
| Run diagnostics | High | Execute freely |
| Implement feature | Medium | Brief plan → Execute |
| Write tests | Medium | Brief plan → Execute |
| Refactor code | Medium | Brief plan → Execute |
| Design API | Low | Present plan → Wait approval |
| Change architecture | Low | Present plan → Wait approval |
| Modify scope | Low | Present plan → Wait approval |

## Background Agent Usage

For high and medium autonomy tasks, leverage background agents for:
- **Parallel exploration** - Multiple explore agents searching different areas
- **Verification tasks** - Background tests running while you continue
- **Research gathering** - Documentation search in background
- **Pattern analysis** - Codebase analysis without blocking main workflow

## Autonomy Override Keywords

The following user prompts trigger different autonomy modes:
- `ultrawork` / `ulw` → Maximum autonomy mode (act freely)
- `quick` / `fast` → High autonomy, skip formal planning
- `careful` / `review` → Lower autonomy, more verification
- `implement` → Medium autonomy, brief plan required

## Tool Usage Guidelines

### Autonomous Tools (High Autonomy)
These can be used freely:
- `Glob` - Find files
- `Grep` - Search code
- `Read` - Read files
- `LSP` - Analyze code structure
- `Bash` (read-only) - Run diagnostics

### Approval-Required Tools (Low Autonomy)
These require brief plan or approval:
- `Edit` - Modify files (brief plan for medium autonomy)
- `Write` - Create files (plan required)
- `Bash` (destructive) - Modify system (approval required)
- `Delete` - Remove files (approval required)

## Context Window Management

When context usage exceeds 70%:
- Pause and summarize progress
- Consider using background agents for remaining investigation
- Compact session if needed

## Workflow Summary

1. **Assess task type** → Classify autonomy level
2. **Use appropriate mode** → High/Medium/Low based on classification
3. **Leverage background agents** → Parallel execution when possible
4. **Present plans for low-autonomy tasks** → Wait for approval
5. **Execute autonomously for high/medium tasks** → Act with confidence
