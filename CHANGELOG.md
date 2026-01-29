# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [1.0.1] - 2026-01-26

### Changed
- Default backend switched from Docker Model Runner to Ollama (localhost:11434)
- Default model changed from ai/gemma3:latest to qwen2.5-coder:7b
- Status error hint now references Ollama setup instead of Docker Model Runner

## [1.0.0] - 2025-12-15

### Added
- Initial release
- Core MCP server with OpenAI-compatible client
- `local_summarize` tool for text summarization
- `local_draft` tool for initial draft generation
- `local_classify` tool for text classification
- `local_extract` tool for structured data extraction
- `local_transform` tool for text transformation
- `local_complete` tool for raw completions
- `local_status` tool for checking model status
- Environment variable configuration
- Docker Model Runner integration via TCP
