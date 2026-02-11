# CLAUDE.md - mcp-local-llm

MCP server that delegates mechanical tasks to a local LLM (Ollama) for cost optimization.

## Tech Stack

- **Language:** TypeScript
- **Runtime:** Node.js (ES modules)
- **Protocol:** Model Context Protocol (MCP)
- **Build:** TypeScript compiler (tsc)
- **Dependencies:** `openai` (OpenAI-compatible client for Ollama)

## Architecture

```
src/
  index.ts          # All tools, handlers, and OpenAI client in single file
```

Single-file architecture. Uses OpenAI SDK pointed at local Ollama endpoint.

## Development Commands

```bash
npm run build       # tsc
npm run dev         # tsc --watch
npm start           # node dist/index.js
```

## Environment Variables

| Variable | Default | Required |
|----------|---------|----------|
| `LOCAL_LLM_BASE_URL` | `http://localhost:11434/v1` | No |
| `LOCAL_LLM_MODEL` | `qwen2.5-coder:7b` | No |
| `LOCAL_LLM_MAX_TOKENS` | `2048` | No |
| `LOCAL_LLM_TEMPERATURE` | `0.7` | No |

## Tools (7)

`local_summarize`, `local_draft`, `local_classify`, `local_extract`, `local_transform`, `local_complete`, `local_status`

## Key Patterns

- Uses `Server` class from MCP SDK (low-level API with `setRequestHandler`)
- OpenAI client with `apiKey: "not-needed"` for local inference
- Tool descriptions include `DELEGATION GUIDANCE` sections for Claude routing
- Requires Ollama running locally (or any OpenAI-compatible backend)
