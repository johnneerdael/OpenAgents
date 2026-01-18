# OpenAgents Autonomy Configuration Schema

## Schema Definition

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://openagents.example.com/schemas/autonomy-config.json",
  "title": "OpenAgents Autonomy Configuration",
  "description": "Configuration for agent autonomy levels, approval gates, and background task behavior",
  "type": "object",
  "properties": {
    "version": {
      "type": "string",
      "enum": ["1.0.0"],
      "default": "1.0.0"
    },
    "modes": {
      "type": "object",
      "properties": {
        "default": {
          "type": "string",
          "enum": ["permissive", "balanced", "restrictive"],
          "default": "balanced"
        },
        "permissive": {
          "$ref": "#/$defs/autonomyMode"
        },
        "balanced": {
          "$ref": "#/$defs/autonomyMode"
        },
        "restrictive": {
          "$ref": "#/$defs/autonomyMode"
        }
      },
      "required": ["default"]
    },
    "classification": {
      "type": "object",
      "properties": {
        "keywords": {
          "type": "object",
          "properties": {
            "high_autonomy": {
              "type": "array",
              "items": {"type": "string"},
              "default": [
                "explore", "find", "search", "locate",
                "analyze", "review", "examine",
                "get", "fetch", "list", "show",
                "check", "diagnose", "test", "verify",
                "quick", "fast", "quickly"
              ]
            },
            "medium_autonomy": {
              "type": "array",
              "items": {"type": "string"},
              "default": [
                "implement", "add", "create", "write",
                "modify", "update", "change",
                "refactor", "improve", "enhance",
                "test", "validate", "verify",
                "document", "comment", "explain"
              ]
            },
            "low_autonomy": {
              "type": "array",
              "items": {"type": "string"},
              "default": [
                "design", "architect", "structure",
                "create API", "define interface", "new endpoint",
                "refactor API", "change interface", "remove feature",
                "add feature", "create module", "new component"
              ]
            }
          },
          "required": ["high_autonomy", "medium_autonomy", "low_autonomy"]
        },
        "default_level": {
          "type": "string",
          "enum": ["high", "medium", "low"],
          "default": "medium"
        },
        "confidence_threshold": {
          "type": "number",
          "minimum": 0,
          "maximum": 1,
          "default": 0.7
        }
      },
      "required": ["keywords"]
    },
    "background_tasks": {
      "type": "object",
      "properties": {
        "enabled": {
          "type": "boolean",
          "default": true
        },
        "max_concurrent": {
          "type": "integer",
          "minimum": 1,
          "maximum": 20,
          "default": 5
        },
        "default_priority": {
          "type": "string",
          "enum": ["low", "medium", "high"],
          "default": "medium"
        },
        "notification": {
          "type": "object",
          "properties": {
            "on_complete": {
              "type": "boolean",
              "default": true
            },
            "on_failure": {
              "type": "boolean",
              "default": true
            },
            "batch_interval_ms": {
              "type": "integer",
              "minimum": 1000,
              "default": 5000
            }
          }
        },
        "timeout_ms": {
          "type": "integer",
          "minimum": 60000,
          "default": 300000
        }
      },
      "required": ["enabled", "max_concurrent"]
    },
    "approval_gates": {
      "type": "object",
      "properties": {
        "high_autonomy": {
          "type": "object",
          "properties": {
            "required": {
              "type": "boolean",
              "default": false
            },
            "timeout_ms": {
              "type": "integer",
              "default": 0
            }
          }
        },
        "medium_autonomy": {
          "type": "object",
          "properties": {
            "required": {
              "type": "boolean",
              "default": false
            },
            "timeout_ms": {
              "type": "integer",
              "default": 5000
            }
          }
        },
        "low_autonomy": {
          "type": "object",
          "properties": {
            "required": {
              "type": "boolean",
              "default": true
            },
            "timeout_ms": {
              "type": "integer",
              "default": 0
            }
          }
        },
        "implicit_approval_timeout_ms": {
          "type": "integer",
          "minimum": 0,
          "default": 5000
        }
      }
    },
    "user_override": {
      "type": "object",
      "properties": {
        "enabled": {
          "type": "boolean",
          "default": true
        },
        "keywords": {
          "type": "array",
          "items": {"type": "string"},
          "default": ["override", "manual", "I will handle"]
        },
        "respect_context_preference": {
          "type": "boolean",
          "default": true
        }
      },
      "required": ["enabled"]
    },
    "reporting": {
      "type": "object",
      "properties": {
        "show_autonomy_level": {
          "type": "boolean",
          "default": true
        },
        "show_background_tasks": {
          "type": "boolean",
          "default": true
        },
        "show_approval_status": {
          "type": "boolean",
          "default": true
        },
        "verbose": {
          "type": "boolean",
          "default": false
        }
      }
    }
  },
  "required": ["modes", "classification", "background_tasks", "approval_gates"],
  "additionalProperties": false,
  "$defs": {
    "autonomyMode": {
      "type": "object",
      "properties": {
        "high_autonomy": {
          "type": "object",
          "properties": {
            "can_execute_immediately": {
              "type": "boolean",
              "default": true
            },
            "max_background_tasks": {
              "type": "integer",
              "minimum": 0,
              "default": 10
            },
            "approval_required": {
              "type": "boolean",
              "default": false
            }
          }
        },
        "medium_autonomy": {
          "type": "object",
          "properties": {
            "can_execute_immediately": {
              "type": "boolean",
              "default": false
            },
            "max_background_tasks": {
              "type": "integer",
              "minimum": 0,
              "default": 5
            },
            "approval_required": {
              "type": "boolean",
              "default": false
            },
            "implicit_approval": {
              "type": "boolean",
              "default": true
            },
            "implicit_timeout_ms": {
              "type": "integer",
              "minimum": 0,
              "default": 5000
            }
          }
        },
        "low_autonomy": {
          "type": "object",
          "properties": {
            "can_execute_immediately": {
              "type": "boolean",
              "default": false
            },
            "max_background_tasks": {
              "type": "integer",
              "minimum": 0,
              "default": 0
            },
            "approval_required": {
              "type": "boolean",
              "default": true
            },
            "step_by_step": {
              "type": "boolean",
              "default": true
            }
          }
        }
      },
      "required": ["high_autonomy", "medium_autonomy", "low_autonomy"]
    }
  }
}
```

## Example Configurations

### Balanced Mode (Default)
```json
{
  "version": "1.0.0",
  "modes": {
    "default": "balanced"
  },
  "classification": {
    "keywords": {
      "high_autonomy": ["explore", "find", "analyze"],
      "medium_autonomy": ["implement", "add", "modify"],
      "low_autonomy": ["design", "architect", "breaking"]
    }
  },
  "background_tasks": {
    "enabled": true,
    "max_concurrent": 5
  },
  "approval_gates": {
    "high_autonomy": {"required": false},
    "medium_autonomy": {"required": false, "implicit_approval": true},
    "low_autonomy": {"required": true}
  }
}
```

### Permissive Mode (Sisyphus-like)
```json
{
  "version": "1.0.0",
  "modes": {
    "default": "permissive"
  },
  "classification": {
    "keywords": {
      "high_autonomy": ["*"],
      "medium_autonomy": ["implement", "add"],
      "low_autonomy": ["breaking"]
    },
    "default_level": "high"
  },
  "background_tasks": {
    "enabled": true,
    "max_concurrent": 10
  },
  "approval_gates": {
    "high_autonomy": {"required": false},
    "medium_autonomy": {"required": false},
    "low_autonomy": {"required": false}
  },
  "user_override": {
    "enabled": false
  }
}
```

### Restrictive Mode (OpenAgent-like)
```json
{
  "version": "1.0.0",
  "modes": {
    "default": "restrictive"
  },
  "classification": {
    "keywords": {
      "high_autonomy": [],
      "medium_autonomy": ["test", "verify"],
      "low_autonomy": ["*"]
    },
    "default_level": "low"
  },
  "background_tasks": {
    "enabled": false,
    "max_concurrent": 0
  },
  "approval_gates": {
    "high_autonomy": {"required": true},
    "medium_autonomy": {"required": true},
    "low_autonomy": {"required": true}
  }
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| OPENAGENTS_AUTONOMY_MODE | Override default mode | "balanced" |
| OPENAGENTS_MAX_BACKGROUND | Max background tasks | 5 |
| OPENAGENTS_APPROVAL_TIMEOUT | Default approval timeout (ms) | 5000 |
| OPENAGENTS_DEBUG_AUTONOMY | Enable debug logging | false |

## Integration Points

### With OpenCode Config
```json
{
  "plugin": ["oh-my-opencode"],
  "openagents": {
    "autonomy": { ... }
  }
}
```

### With Evaluation Framework
```yaml
autonomy_config:
  mode: balanced
  classification:
    keywords: ...
```

## Validation

```bash
# Validate autonomy config
jq . --schema autonomy-config.schema.json config.json

# Check mode consistency
node scripts/validate-autonomy-config.js
```
