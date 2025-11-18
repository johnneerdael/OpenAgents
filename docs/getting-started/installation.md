# Install Script - Collision Handling

## Overview

The install script now intelligently detects and handles file collisions when installing OpenCode components into an existing `.opencode/` directory.

## How It Works

### 1. Collision Detection

Before installing any files, the script:
- Scans all components you've selected to install
- Checks if any files already exist in your `.opencode/` directory
- Groups collisions by type (agents, subagents, commands, tools, etc.)
- Presents a clear report of what would be overwritten

### 2. Installation Strategies

When collisions are detected, you get **4 options**:

#### Option 1: Skip Existing (Recommended for Updates)
```
✅ Only install new files
✅ Keep ALL existing files unchanged
✅ Your customizations are preserved
✅ Safe for incremental updates
```

**Use when:**
- You've customized existing agents/commands
- You only want to add new components
- You're updating and want to keep your changes

**Example:**
```
Selected: 10 components
Existing: 5 files
Result: 5 new files installed, 5 existing files untouched
```

---

#### Option 2: Overwrite All (Use with Caution)
```
⚠️  Replace ALL existing files with new versions
⚠️  Your customizations will be LOST
⚠️  Requires confirmation (type 'yes')
```

**Use when:**
- You want the latest versions of everything
- You haven't made customizations
- You want to reset to defaults

**Example:**
```
Selected: 10 components
Existing: 5 files
Result: All 10 files installed (5 overwritten, 5 new)
```

---

#### Option 3: Backup & Overwrite (Safe Update)
```
✅ Backs up existing files to .opencode.backup.{timestamp}/
✅ Then installs new versions
✅ You can restore from backup if needed
✅ Best of both worlds
```

**Use when:**
- You want new versions but want to keep a backup
- You're not sure if you've customized files
- You want the ability to restore

**Example:**
```
Selected: 10 components
Existing: 5 files
Result: 
  - 5 files backed up to .opencode.backup.20251118-143022/
  - All 10 files installed (5 updated, 5 new)
```

**Restore from backup:**
```bash
# View backup
ls -la .opencode.backup.*/

# Restore specific file
cp .opencode.backup.20251118-143022/.opencode/agent/my-agent.md .opencode/agent/

# Restore all
rm -rf .opencode
mv .opencode.backup.20251118-143022/.opencode .opencode
```

---

#### Option 4: Cancel
```
❌ Exit without making any changes
```

**Use when:**
- You need to review what would be changed
- You want to manually backup first
- You're not ready to proceed

---

## Example Session

```bash
$ bash <(curl -fsSL https://raw.githubusercontent.com/darrenhinde/opencode-agents/main/install.sh) --developer

╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║           OpenCode Agents Installer v1.0.0                    ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

▶ Checking dependencies...
✓ All dependencies found

▶ Fetching component registry...
✓ Registry fetched successfully

▶ Installation Preview

Profile: developer

Components to install (22 total):

Agents (4): task-manager codebase-agent image-specialist workflow-orchestrator
Subagents (6): reviewer tester documentation coder-agent build-agent codebase-pattern-analyst
Commands (6): test commit context clean optimize prompt-enhancer
Tools (2): env gemini
Contexts (2): essential-patterns project-context
Config (2): env-example readme

Proceed with installation? [Y/n]: y

▶ Preparing installation...

▶ Checking for file collisions...

⚠ Found 8 file collision(s):

  Agents (2):
    .opencode/agent/task-manager.md
    .opencode/agent/codebase-agent.md
  Subagents (3):
    .opencode/agent/subagents/reviewer.md
    .opencode/agent/subagents/tester.md
    .opencode/agent/subagents/coder-agent.md
  Commands (2):
    .opencode/command/test.md
    .opencode/command/commit.md
  Context (1):
    .opencode/context/core/essential-patterns.md

How would you like to proceed?

  1) Skip existing - Only install new files, keep all existing files unchanged
  2) Overwrite all - Replace existing files with new versions (your changes will be lost)
  3) Backup & overwrite - Backup existing files, then install new versions
  4) Cancel - Exit without making changes

Enter your choice [1-4]: 1

▶ Installing components...

✓ Installed agent: image-specialist
✓ Installed agent: workflow-orchestrator
ℹ Skipped existing: agent:task-manager
ℹ Skipped existing: agent:codebase-agent
ℹ Skipped existing: subagent:reviewer
ℹ Skipped existing: subagent:tester
✓ Installed subagent: documentation
ℹ Skipped existing: subagent:coder-agent
✓ Installed subagent: build-agent
✓ Installed subagent: codebase-pattern-analyst
ℹ Skipped existing: command:test
ℹ Skipped existing: command:commit
✓ Installed command: context
✓ Installed command: clean
✓ Installed command: optimize
✓ Installed command: prompt-enhancer
✓ Installed tool: env
✓ Installed tool: gemini
ℹ Skipped existing: context:essential-patterns
✓ Installed context: project-context
✓ Installed config: env-example
✓ Installed config: readme

✓ Installation complete!
  Installed: 14
  Skipped: 8

▶ Next Steps

1. Review the installed components in .opencode/
2. Copy env.example to .env and configure:
   cp env.example .env
3. Start using OpenCode agents:
   opencode

ℹ Documentation: https://github.com/darrenhinde/opencode-agents
```

---

## Collision Report Details

The collision report groups files by type for easy review:

| Category | Location | Description |
|----------|----------|-------------|
| **Agents** | `.opencode/agent/*.md` | Main orchestrator agents |
| **Subagents** | `.opencode/agent/subagents/*.md` | Specialized worker agents |
| **Commands** | `.opencode/command/*.md` | Slash commands |
| **Tools** | `.opencode/tool/*/` | Tool implementations |
| **Plugins** | `.opencode/plugin/*.ts` | Plugin integrations |
| **Context** | `.opencode/context/**/*.md` | Context files |
| **Config** | Root level files | Configuration files |

---

## Best Practices

### For First-Time Installation
- No collisions will be detected
- All files install cleanly
- No strategy selection needed

### For Updates (Adding New Components)
- **Use Option 1 (Skip existing)** - Safest choice
- Only new components are added
- Your customizations are preserved

### For Full Refresh
- **Use Option 3 (Backup & overwrite)** - Safest for updates
- Get latest versions of everything
- Keep backup just in case

### For Clean Slate
- **Use Option 2 (Overwrite all)** - Only if you're sure
- Resets everything to defaults
- Requires explicit confirmation

---

## Technical Details

### What Gets Checked
- All files in the selected components list
- Paths are resolved from `registry.json`
- Only actual file existence is checked (not content)

### What Gets Backed Up (Option 3)
- Only files that would be overwritten
- Preserves directory structure
- Timestamped folder: `.opencode.backup.YYYYMMDD-HHMMSS/`

### What Gets Skipped (Option 1)
- Any file that already exists
- Reported in "Skipped" count
- Logged with component type and ID

---

## Troubleshooting

### "I chose skip but want to update one file"
```bash
# Delete the specific file first
rm .opencode/agent/task-manager.md

# Run installer again with skip mode
# Only the deleted file will be reinstalled
```

### "I chose overwrite by accident"
```bash
# If you chose Option 3 (backup), restore from backup:
cp .opencode.backup.*/path/to/file .opencode/path/to/file

# If you chose Option 2 (overwrite), check git history:
git checkout HEAD -- .opencode/
```

### "I want to see what changed"
```bash
# If you have a backup:
diff .opencode/agent/my-agent.md .opencode.backup.*/agent/my-agent.md

# If you have git:
git diff .opencode/
```

### "I want to merge changes manually"
```bash
# Use Option 3 to create backup
# Then manually merge:
vimdiff .opencode/agent/my-agent.md .opencode.backup.*/agent/my-agent.md
```

---

## Future Enhancements

Potential improvements for future versions:

- [ ] Per-file selection (interactive mode)
- [ ] Diff preview before overwriting
- [ ] Smart merge for specific file types
- [ ] Version detection and upgrade paths
- [ ] Rollback command
- [ ] Dry-run mode (show what would happen)

---

## Summary

The collision handling system provides:

✅ **Safety** - Never overwrites without asking  
✅ **Flexibility** - Multiple strategies for different needs  
✅ **Transparency** - Clear reporting of what will change  
✅ **Recoverability** - Backup option for peace of mind  
✅ **Simplicity** - Easy to understand and use  

Choose the strategy that fits your situation, and install with confidence!
