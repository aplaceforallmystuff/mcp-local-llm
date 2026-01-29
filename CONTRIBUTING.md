# Contributing to mcp-local-llm

## Reporting Issues

Open an issue on GitHub with:

- What you expected to happen
- What actually happened
- Your setup: OS, Node.js version, Ollama version, model in use
- Any error messages (from Claude Code logs or the terminal)

## Development Setup

```bash
git clone https://github.com/aplaceforallmystuff/mcp-local-llm.git
cd mcp-local-llm
npm install
npm run dev    # TypeScript watch mode
```

You'll need Ollama running locally with at least one model pulled:

```bash
ollama serve
ollama pull qwen2.5-coder:7b
```

## Making Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes in `src/index.ts`
4. Build and test: `npm run build`
5. Commit using [conventional commits](https://www.conventionalcommits.org/): `feat: add new tool` or `fix: handle empty response`
6. Open a pull request

## Adding a New Tool

To add a new MCP tool:

1. Add the tool definition to the `tools` array (follow existing patterns)
2. Implement the handler function
3. Add the case to the `switch` statement in the `CallToolRequestSchema` handler
4. Update the README with the new tool's parameters and use cases

## Code Style

- TypeScript, single file (`src/index.ts`)
- Keep it simple — this is a thin delegation layer, not a framework
- Include `DELEGATION GUIDANCE` in tool descriptions so Claude knows when to use each tool
