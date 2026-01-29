# mcp-local-llm

MCP server that lets Claude Code delegate mechanical tasks to a local LLM. Claude does the thinking; your local model handles the grunt work — summarization, classification, extraction, drafting.

This is **not** a replacement for Claude. It's a cost-optimization layer. Claude stays in control, decides what to delegate, and reviews the output. The local model just does volume work that doesn't need frontier reasoning.

## Architecture

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
│              Ollama (localhost:11434)                        │
│           or any OpenAI-compatible backend                  │
└─────────────────────────────────────────────────────────────┘
```

## Requirements

- [Ollama](https://ollama.com/) installed and running
- Node.js 18+
- Claude Code (or any MCP-compatible client)

## Setup

### 1. Install Ollama and pull a model

```bash
# Install Ollama (macOS)
brew install ollama

# Start the Ollama service
ollama serve

# Pull the default model
ollama pull qwen2.5-coder:7b
```

### 2. Clone and build

```bash
git clone https://github.com/aplaceforallmystuff/mcp-local-llm.git
cd mcp-local-llm
npm install
npm run build
```

### 3. Add to Claude Code

```bash
claude mcp add local-llm -s user -- node /path/to/mcp-local-llm/dist/index.js
```

Or add manually to `~/.claude.json`:

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

### 4. Verify

In Claude Code, the `local_status` tool should show your Ollama connection and available models.

## Available Tools

### `local_summarize`
Summarize text using the local LLM.

**Parameters:**
- `text` (required): Text to summarize
- `style`: `"brief"` | `"detailed"` | `"bullet_points"` | `"executive"`
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
- `output_format`: `"json"` | `"yaml"` | `"markdown_table"`

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
Check local LLM connection status and available models.

## Configuration

Environment variables (all optional — defaults work with a standard Ollama install):

| Variable | Default | Description |
|----------|---------|-------------|
| `LOCAL_LLM_BASE_URL` | `http://localhost:11434/v1` | Ollama API endpoint |
| `LOCAL_LLM_MODEL` | `qwen2.5-coder:7b` | Model to use |
| `LOCAL_LLM_MAX_TOKENS` | `2048` | Default max tokens |
| `LOCAL_LLM_TEMPERATURE` | `0.7` | Default temperature |

### Alternative: Docker Model Runner

If you prefer Docker Model Runner over Ollama:

```bash
# Enable Model Runner with TCP access
docker desktop enable model-runner --tcp=12434

# Pull a model
docker model pull ai/gemma3:latest
```

Then set the environment variables:

```bash
export LOCAL_LLM_BASE_URL="http://localhost:12434/engines/v1"
export LOCAL_LLM_MODEL="ai/gemma3:latest"
```

Any backend that exposes an OpenAI-compatible API will work.

## Delegation Philosophy

| Claude Does | Local Model Does |
|-------------|------------------|
| Complex reasoning | Bulk summarization |
| Architecture decisions | Boilerplate generation |
| Quality review | Text extraction/formatting |
| Novel problem solving | Simple classification |
| Final editing | Initial draft generation |

Claude reviews, local model produces. The local model handles volume; Claude handles quality control.

## Troubleshooting

**"Connection refused" or status shows error**
- Check Ollama is running: `ollama list`
- Start it if needed: `ollama serve`
- Verify the port: `curl http://localhost:11434/v1/models`

**"Model not found"**
- Pull the model: `ollama pull qwen2.5-coder:7b`
- Or set a different model via `LOCAL_LLM_MODEL`

**Using a different backend**
- Set `LOCAL_LLM_BASE_URL` to your backend's OpenAI-compatible endpoint
- Set `LOCAL_LLM_MODEL` to a model your backend supports

**Tools not appearing in Claude Code**
- Verify the MCP server is configured: `claude mcp list`
- Check the path to `dist/index.js` is correct
- Rebuild if needed: `npm run build`

## License

MIT
