# mcp-local-llm

MCP server for delegating tasks to local LLMs via Docker Model Runner. Enables Claude Code to orchestrate a local model for "grunt work" - saving API costs while maintaining quality through smart delegation.

## The Idea

```
┌─────────────────────────────────────────────────────────────┐
│                  Claude Code (Opus 4.5)                     │
│                 "The Orchestrator Brain"                    │
│  • Complex reasoning, planning, quality control             │
│  • Decides what to delegate vs. do itself                   │
└─────────────────────┬───────────────────────────────────────┘
                      │ MCP Tool Calls
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                     mcp-local-llm                           │
│  Tools: local_summarize, local_draft, local_classify...    │
└─────────────────────┬───────────────────────────────────────┘
                      │ OpenAI-compatible API
                      ▼
┌─────────────────────────────────────────────────────────────┐
│         Docker Model Runner (localhost:12434)               │
│              Local LLM on Apple Silicon                     │
└─────────────────────────────────────────────────────────────┘
```

## Requirements

- Docker Desktop with Model Runner enabled
- Apple Silicon Mac (M1/M2/M3/M4)
- Node.js 18+

## Setup

### 1. Enable Docker Model Runner with TCP access

```bash
docker desktop enable model-runner --tcp=12434
```

### 2. Pull a model

```bash
# Small, fast model (good for 8-16GB RAM)
docker model pull ai/gemma3:latest

# Or larger, more capable (needs 16GB+ RAM)
docker model pull ai/llama3.1:8b-instruct-q4_k_m
```

### 3. Install and build

```bash
cd ~/Dev/mcp-local-llm
npm install
npm run build
```

### 4. Add to Claude Code

```bash
claude mcp add local-llm -s user -- node /path/to/mcp-local-llm/dist/index.js
```

Or manually add to `~/.claude.json`:

```json
{
  "mcpServers": {
    "local-llm": {
      "command": "node",
      "args": ["/path/to/mcp-local-llm/dist/index.js"]
    }
  }
}
```

## Available Tools

### `local_summarize`
Summarize text using the local LLM.

**Parameters:**
- `text` (required): Text to summarize
- `style`: "brief" | "detailed" | "bullet_points" | "executive"
- `max_length`: Approximate max words (default: 150)
- `focus`: Specific aspect to emphasize

**Use for:** Bulk summarization, condensing research, meeting notes

### `local_draft`
Generate initial drafts for refinement.

**Parameters:**
- `task` (required): What to draft
- `context` (required): Context and requirements
- `format`: Output format (markdown, plain text, etc.)
- `tone`: Desired tone (professional, casual, technical)

**Use for:** Boilerplate, initial content, template-based generation

### `local_classify`
Classify text into categories.

**Parameters:**
- `text` (required): Text to classify
- `categories` (required): Array of possible categories
- `allow_multiple`: Allow multiple categories (default: false)
- `explain`: Include explanation (default: false)

**Use for:** Sorting, tagging, organizing content

### `local_extract`
Extract structured information from text.

**Parameters:**
- `text` (required): Text to extract from
- `fields` (required): Array of fields to extract
- `output_format`: "json" | "yaml" | "markdown_table"

**Use for:** Parsing documents, data extraction

### `local_transform`
Transform text according to instructions.

**Parameters:**
- `text` (required): Text to transform
- `instruction` (required): Transformation instructions

**Use for:** Formatting, style conversion, simple rewrites

### `local_complete`
Raw completion for maximum flexibility.

**Parameters:**
- `prompt` (required): The prompt
- `system`: System message
- `max_tokens`: Max tokens (default: 2048)
- `temperature`: Temperature (default: 0.7)

**Use for:** Custom tasks that don't fit other tools

### `local_status`
Check local LLM status and available models.

## Configuration

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `LOCAL_LLM_BASE_URL` | `http://localhost:12434/engines/v1` | Model Runner API endpoint |
| `LOCAL_LLM_MODEL` | `ai/gemma3:latest` | Default model to use |
| `LOCAL_LLM_MAX_TOKENS` | `2048` | Default max tokens |
| `LOCAL_LLM_TEMPERATURE` | `0.7` | Default temperature |

## Delegation Philosophy

| Claude Does | Local Model Does |
|-------------|------------------|
| Complex reasoning | Bulk summarization |
| Architecture decisions | Boilerplate generation |
| Quality review | Text extraction/formatting |
| Novel problem solving | Simple classification |
| Final editing | Initial draft generation |

The key insight: **Claude reviews, local model produces**. The local model handles volume, Claude handles quality control.

## License

MIT
