# agy-kit

> Headless skill executor for [agentskills.io](https://agentskills.io) — run `.agent/skills/` with `agy`, `claude`, `codex` from CLI, automation servers, or CI/CD pipelines.

## The Problem

Antigravity CLI (`agy`), Claude Code (`claude`), Codex and others support agent skills via slash commands in their IDE/interactive mode. But there is **no way to run these skills headlessly** — from a script, server, or CI pipeline.

`agy-kit` fills that gap.

## Install

```bash
npm install -g agy-kit
```

## Usage

```bash
# Run a skill
agy-kit run --skill ba-pipeline --note "Create Receipt list screen for SAL module"

# Use a specific agent
agy-kit run --skill ba-pipeline --note "..." --agent claude
agy-kit run --skill ba-pipeline --note "..." --agent agy

# List available skills in current project
agy-kit list

# Different working directory
agy-kit run --skill ba-pipeline --note "..." --dir /path/to/project
```

## How It Works

1. Reads `SKILL.md` from `.agent/skills/<name>/SKILL.md` (supports `.claude/skills/` and `.agents/skills/` too)
2. Builds a structured prompt with skill instructions + your requirement
3. Calls the agent (agy/claude/codex) in headless mode
4. Parses output and writes files to the correct locations
5. Falls back to scanning for modified files if agent writes directly

## Supported Agents

| Agent | Command | Notes |
|-------|---------|-------|
| `agy` | Antigravity CLI | Default |
| `claude` | Claude Code | Full skill support |
| `codex` | OpenAI Codex CLI | Experimental |

## Skill Directory Support

Automatically detects skills from:
- `.agent/skills/` (Antigravity / agentskills.io standard)
- `.claude/skills/` (Claude Code)
- `.agents/skills/` (Codex / generic)

## Use in Automation Server

```python
import subprocess

result = subprocess.run(
    ["agy-kit", "run", "--skill", "ba-pipeline", "--note", note, "--dir", work_dir],
    capture_output=True, text=True, timeout=600
)
```

## CI/CD

```yaml
- name: Run BA pipeline
  run: agy-kit run --skill ba-pipeline --note "${{ github.event.inputs.note }}"
```

## License

MIT
