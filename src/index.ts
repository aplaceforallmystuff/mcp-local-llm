#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import OpenAI from "openai";

// Configuration from environment
// Default to Ollama (11434) - change to 12434 for Docker Model Runner
const BASE_URL = process.env.LOCAL_LLM_BASE_URL || "http://localhost:11434/v1";
const DEFAULT_MODEL = process.env.LOCAL_LLM_MODEL || "qwen2.5-coder:7b";
const DEFAULT_MAX_TOKENS = parseInt(process.env.LOCAL_LLM_MAX_TOKENS || "2048");
const DEFAULT_TEMPERATURE = parseFloat(process.env.LOCAL_LLM_TEMPERATURE || "0.7");

// Initialize OpenAI client pointing to local Model Runner
const client = new OpenAI({
  baseURL: BASE_URL,
  apiKey: "not-needed", // Local model doesn't need auth
});

// Tool definitions
const tools: Tool[] = [
  {
    name: "local_summarize",
    description: `Summarize text using a local LLM. Use for long documents, research notes, or any content that needs condensing.

DELEGATION GUIDANCE: Use this when you need to summarize content that doesn't require your full reasoning - bulk file summarization, extracting key points from research, condensing meeting notes.`,
    inputSchema: {
      type: "object" as const,
      properties: {
        text: {
          type: "string",
          description: "The text to summarize",
        },
        style: {
          type: "string",
          enum: ["brief", "detailed", "bullet_points", "executive"],
          description: "Summary style (default: brief)",
        },
        max_length: {
          type: "number",
          description: "Approximate max words for summary (default: 150)",
        },
        focus: {
          type: "string",
          description: "Optional focus area - what aspects to emphasize",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "local_draft",
    description: `Generate an initial draft using a local LLM that you can then refine.

DELEGATION GUIDANCE: Use this for boilerplate content, initial drafts, template-based generation. You (Claude) should review and refine the output - the local model does the grunt work, you do the quality control.`,
    inputSchema: {
      type: "object" as const,
      properties: {
        task: {
          type: "string",
          description: "What to draft (e.g., 'email response', 'README section', 'function docstring')",
        },
        context: {
          type: "string",
          description: "Context and requirements for the draft",
        },
        format: {
          type: "string",
          description: "Desired format (e.g., 'markdown', 'plain text', 'code comment')",
        },
        tone: {
          type: "string",
          description: "Desired tone (e.g., 'professional', 'casual', 'technical')",
        },
      },
      required: ["task", "context"],
    },
  },
  {
    name: "local_classify",
    description: `Classify text into categories using a local LLM.

DELEGATION GUIDANCE: Use for sorting, tagging, organizing content. Good for batch classification tasks where the categories are clear-cut.`,
    inputSchema: {
      type: "object" as const,
      properties: {
        text: {
          type: "string",
          description: "The text to classify",
        },
        categories: {
          type: "array",
          items: { type: "string" },
          description: "List of possible categories",
        },
        allow_multiple: {
          type: "boolean",
          description: "Allow multiple category assignments (default: false)",
        },
        explain: {
          type: "boolean",
          description: "Include brief explanation for classification (default: false)",
        },
      },
      required: ["text", "categories"],
    },
  },
  {
    name: "local_extract",
    description: `Extract structured information from text using a local LLM.

DELEGATION GUIDANCE: Use for parsing documents, extracting specific fields, converting unstructured text to structured data.`,
    inputSchema: {
      type: "object" as const,
      properties: {
        text: {
          type: "string",
          description: "The text to extract from",
        },
        fields: {
          type: "array",
          items: { type: "string" },
          description: "Fields to extract (e.g., ['name', 'email', 'date', 'amount'])",
        },
        output_format: {
          type: "string",
          enum: ["json", "yaml", "markdown_table"],
          description: "Output format (default: json)",
        },
      },
      required: ["text", "fields"],
    },
  },
  {
    name: "local_transform",
    description: `Transform text according to instructions using a local LLM.

DELEGATION GUIDANCE: Use for formatting changes, style conversions, simple rewrites. Good for mechanical transformations that don't require deep reasoning.`,
    inputSchema: {
      type: "object" as const,
      properties: {
        text: {
          type: "string",
          description: "The text to transform",
        },
        instruction: {
          type: "string",
          description: "How to transform the text (e.g., 'convert to bullet points', 'make more concise', 'add markdown formatting')",
        },
      },
      required: ["text", "instruction"],
    },
  },
  {
    name: "local_complete",
    description: `Raw completion using local LLM for maximum flexibility.

DELEGATION GUIDANCE: Use when other tools don't fit. You control the prompt entirely. Good for custom tasks that don't match predefined patterns.`,
    inputSchema: {
      type: "object" as const,
      properties: {
        prompt: {
          type: "string",
          description: "The prompt for the local model",
        },
        system: {
          type: "string",
          description: "Optional system message to set context/behavior",
        },
        max_tokens: {
          type: "number",
          description: `Maximum tokens to generate (default: ${DEFAULT_MAX_TOKENS})`,
        },
        temperature: {
          type: "number",
          description: `Temperature for generation (default: ${DEFAULT_TEMPERATURE})`,
        },
      },
      required: ["prompt"],
    },
  },
  {
    name: "local_status",
    description: "Check the status of the local LLM and available models.",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];

// Tool implementations
async function summarize(
  text: string,
  style: string = "brief",
  maxLength: number = 150,
  focus?: string
): Promise<string> {
  const styleInstructions: Record<string, string> = {
    brief: `Provide a concise summary in approximately ${maxLength} words.`,
    detailed: `Provide a thorough summary covering all main points in approximately ${maxLength} words.`,
    bullet_points: `Summarize as bullet points (aim for ${Math.ceil(maxLength / 20)} key points).`,
    executive: `Provide an executive summary with key takeaways and action items in approximately ${maxLength} words.`,
  };

  const focusInstruction = focus ? `\nFocus especially on: ${focus}` : "";

  const response = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      {
        role: "system",
        content: `You are a precise summarization assistant. ${styleInstructions[style] || styleInstructions.brief}${focusInstruction}`,
      },
      {
        role: "user",
        content: `Summarize the following text:\n\n${text}`,
      },
    ],
    max_tokens: Math.min(maxLength * 2, DEFAULT_MAX_TOKENS),
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content || "Summary generation failed";
}

async function draft(
  task: string,
  context: string,
  format?: string,
  tone?: string
): Promise<string> {
  const formatInstruction = format ? `Format: ${format}` : "";
  const toneInstruction = tone ? `Tone: ${tone}` : "";

  const response = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      {
        role: "system",
        content: `You are a drafting assistant. Generate initial drafts that can be refined later. ${formatInstruction} ${toneInstruction}`.trim(),
      },
      {
        role: "user",
        content: `Task: ${task}\n\nContext:\n${context}\n\nGenerate a draft:`,
      },
    ],
    max_tokens: DEFAULT_MAX_TOKENS,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || "Draft generation failed";
}

async function classify(
  text: string,
  categories: string[],
  allowMultiple: boolean = false,
  explain: boolean = false
): Promise<string> {
  const multipleInstruction = allowMultiple
    ? "You may assign multiple categories if appropriate."
    : "Assign exactly one category.";

  const explainInstruction = explain
    ? "Provide a brief explanation for your classification."
    : "Only output the category name(s), nothing else.";

  const response = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      {
        role: "system",
        content: `You are a classification assistant. Classify text into one of these categories: ${categories.join(", ")}. ${multipleInstruction} ${explainInstruction}`,
      },
      {
        role: "user",
        content: `Classify this text:\n\n${text}`,
      },
    ],
    max_tokens: explain ? 200 : 50,
    temperature: 0.1,
  });

  return response.choices[0]?.message?.content || "Classification failed";
}

async function extract(
  text: string,
  fields: string[],
  outputFormat: string = "json"
): Promise<string> {
  const formatInstructions: Record<string, string> = {
    json: "Output as valid JSON object.",
    yaml: "Output as YAML.",
    markdown_table: "Output as a markdown table.",
  };

  const response = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      {
        role: "system",
        content: `You are a data extraction assistant. Extract the following fields from text: ${fields.join(", ")}. ${formatInstructions[outputFormat] || formatInstructions.json} If a field is not found, use null or "not found".`,
      },
      {
        role: "user",
        content: `Extract information from this text:\n\n${text}`,
      },
    ],
    max_tokens: DEFAULT_MAX_TOKENS,
    temperature: 0.1,
  });

  return response.choices[0]?.message?.content || "Extraction failed";
}

async function transform(text: string, instruction: string): Promise<string> {
  const response = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      {
        role: "system",
        content: "You are a text transformation assistant. Apply the requested transformation precisely.",
      },
      {
        role: "user",
        content: `Instruction: ${instruction}\n\nText to transform:\n${text}`,
      },
    ],
    max_tokens: DEFAULT_MAX_TOKENS,
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content || "Transformation failed";
}

async function complete(
  prompt: string,
  system?: string,
  maxTokens?: number,
  temperature?: number
): Promise<string> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

  if (system) {
    messages.push({ role: "system", content: system });
  }
  messages.push({ role: "user", content: prompt });

  const response = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    messages,
    max_tokens: maxTokens || DEFAULT_MAX_TOKENS,
    temperature: temperature ?? DEFAULT_TEMPERATURE,
  });

  return response.choices[0]?.message?.content || "Completion failed";
}

async function getStatus(): Promise<string> {
  try {
    const models = await client.models.list();
    const modelList = [];
    for await (const model of models) {
      modelList.push(model.id);
    }

    return JSON.stringify(
      {
        status: "connected",
        base_url: BASE_URL,
        default_model: DEFAULT_MODEL,
        available_models: modelList,
        config: {
          max_tokens: DEFAULT_MAX_TOKENS,
          temperature: DEFAULT_TEMPERATURE,
        },
      },
      null,
      2
    );
  } catch (error) {
    return JSON.stringify(
      {
        status: "error",
        base_url: BASE_URL,
        error: error instanceof Error ? error.message : "Unknown error",
        hint: "Ensure Ollama is running: ollama serve. If using Docker Model Runner, set LOCAL_LLM_BASE_URL to http://localhost:12434/engines/v1",
      },
      null,
      2
    );
  }
}

// Create and configure server
const server = new Server(
  {
    name: "mcp-local-llm",
    version: "1.0.1",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: string;

    switch (name) {
      case "local_summarize":
        result = await summarize(
          args?.text as string,
          args?.style as string,
          args?.max_length as number,
          args?.focus as string
        );
        break;

      case "local_draft":
        result = await draft(
          args?.task as string,
          args?.context as string,
          args?.format as string,
          args?.tone as string
        );
        break;

      case "local_classify":
        result = await classify(
          args?.text as string,
          args?.categories as string[],
          args?.allow_multiple as boolean,
          args?.explain as boolean
        );
        break;

      case "local_extract":
        result = await extract(
          args?.text as string,
          args?.fields as string[],
          args?.output_format as string
        );
        break;

      case "local_transform":
        result = await transform(
          args?.text as string,
          args?.instruction as string
        );
        break;

      case "local_complete":
        result = await complete(
          args?.prompt as string,
          args?.system as string,
          args?.max_tokens as number,
          args?.temperature as number
        );
        break;

      case "local_status":
        result = await getStatus();
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [{ type: "text", text: result }],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("mcp-local-llm server running");
}

main().catch(console.error);
