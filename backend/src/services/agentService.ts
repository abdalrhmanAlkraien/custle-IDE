import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { readFile, writeFile, buildTree, createPath, deletePath, searchFiles } from './fileService';
import { getActiveConfigFull } from './modelService';
import axios from 'axios';

const execAsync = promisify(exec);

// Agent tool definitions
export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string }>;
}

export const AGENT_TOOLS: AgentTool[] = [
  {
    name: 'read_file',
    description: 'Read the contents of a file',
    parameters: {
      path: { type: 'string', description: 'Path to the file relative to workspace root' },
    },
  },
  {
    name: 'write_file',
    description: 'Write content to a file (creates if not exists)',
    parameters: {
      path: { type: 'string', description: 'Path to the file relative to workspace root' },
      content: { type: 'string', description: 'Content to write to the file' },
    },
  },
  {
    name: 'list_files',
    description: 'List files in a directory',
    parameters: {
      path: { type: 'string', description: 'Path to the directory relative to workspace root (empty string for root)' },
    },
  },
  {
    name: 'run_terminal',
    description: 'Run a shell command and return output',
    parameters: {
      command: { type: 'string', description: 'Shell command to execute' },
      cwd: { type: 'string', description: 'Working directory for command (relative to workspace root, empty for root)' },
    },
  },
  {
    name: 'search_files',
    description: 'Search for text across all files in workspace',
    parameters: {
      query: { type: 'string', description: 'Text to search for' },
    },
  },
  {
    name: 'create_file',
    description: 'Create a new file or folder',
    parameters: {
      path: { type: 'string', description: 'Path relative to workspace root' },
      type: { type: 'string', description: 'Either "file" or "folder"' },
    },
  },
  {
    name: 'delete_file',
    description: 'Delete a file or folder',
    parameters: {
      path: { type: 'string', description: 'Path relative to workspace root' },
    },
  },
];

// Tool execution results
export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
}

// Agent step (for frontend visualization)
export interface AgentStep {
  type: 'tool_call' | 'tool_result' | 'thinking' | 'final_response';
  toolName?: string;
  args?: Record<string, string>;
  result?: ToolResult;
  content?: string;
  timestamp: string;
}

/**
 * Execute a tool call
 */
export async function executeTool(
  toolName: string,
  args: Record<string, string>,
  workspaceRoot: string
): Promise<ToolResult> {
  try {
    switch (toolName) {
      case 'read_file': {
        const fileData = await readFile(args.path, workspaceRoot);
        return {
          success: true,
          output: `File content (${fileData.size} bytes, ${fileData.language}):\n${fileData.content}`,
        };
      }

      case 'write_file': {
        await writeFile(args.path, args.content, workspaceRoot);
        return {
          success: true,
          output: `File written successfully: ${args.path}`,
        };
      }

      case 'list_files': {
        const dirPath = args.path || '.';
        const tree = await buildTree(dirPath, workspaceRoot);

        const formatTree = (node: any, indent = 0): string => {
          const prefix = '  '.repeat(indent);
          let result = `${prefix}${node.type === 'folder' ? '📁' : '📄'} ${node.name}\n`;
          if (node.children) {
            for (const child of node.children) {
              result += formatTree(child, indent + 1);
            }
          }
          return result;
        };

        return {
          success: true,
          output: `Files in ${dirPath}:\n${formatTree(tree)}`,
        };
      }

      case 'run_terminal': {
        const cwd = args.cwd ? path.join(workspaceRoot, args.cwd) : workspaceRoot;
        const { stdout, stderr } = await execAsync(args.command, {
          cwd,
          timeout: 30000, // 30 second timeout
          maxBuffer: 1024 * 1024, // 1MB buffer
        });

        return {
          success: true,
          output: `$ ${args.command}\n${stdout}${stderr ? `\nstderr:\n${stderr}` : ''}`,
        };
      }

      case 'search_files': {
        const results = await searchFiles(args.query, '.', workspaceRoot);
        if (results.length === 0) {
          return {
            success: true,
            output: `No results found for "${args.query}"`,
          };
        }

        const allMatches: string[] = [];
        for (const fileResult of results) {
          for (const match of fileResult.matches) {
            allMatches.push(`${fileResult.relativePath}:${match.lineNumber}: ${match.line}`);
          }
        }

        const output = allMatches
          .slice(0, 50) // Limit to 50 results
          .join('\n');

        return {
          success: true,
          output: `Found ${allMatches.length} matches (showing first 50):\n${output}`,
        };
      }

      case 'create_file': {
        await createPath(args.path, args.type as 'file' | 'folder', workspaceRoot);
        return {
          success: true,
          output: `${args.type === 'folder' ? 'Folder' : 'File'} created: ${args.path}`,
        };
      }

      case 'delete_file': {
        await deletePath(args.path, workspaceRoot);
        return {
          success: true,
          output: `Deleted: ${args.path}`,
        };
      }

      default:
        return {
          success: false,
          error: `Unknown tool: ${toolName}`,
        };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Tool execution failed',
    };
  }
}

/**
 * Convert tool definitions to OpenAI function format
 */
function toolsToOpenAIFormat(): any[] {
  return AGENT_TOOLS.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: tool.parameters,
        required: Object.keys(tool.parameters),
      },
    },
  }));
}

/**
 * Convert tool definitions to Anthropic tool format
 */
function toolsToAnthropicFormat(): any[] {
  return AGENT_TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: {
      type: 'object',
      properties: tool.parameters,
      required: Object.keys(tool.parameters),
    },
  }));
}

// Agent message types
export interface AgentMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: { name: string; args: Record<string, string>; id: string }[];
  toolCallId?: string;
}

/**
 * Run agent loop with function calling
 * Yields steps for SSE streaming
 */
export async function* runAgentLoop(
  messages: AgentMessage[],
  workspaceRoot: string,
  maxIterations = 20
): AsyncGenerator<AgentStep> {
  const modelConfig = getActiveConfigFull();
  if (!modelConfig) {
    yield {
      type: 'final_response',
      content: 'Error: No active model configuration. Please configure a model first.',
      timestamp: new Date().toISOString(),
    };
    return;
  }

  let iteration = 0;
  let currentMessages = [...messages];

  while (iteration < maxIterations) {
    iteration++;

    // Call model with tools
    let response;
    try {
      if (modelConfig.provider === 'openai' || modelConfig.provider === 'openai-compatible') {
        response = await callOpenAI(currentMessages, modelConfig);
      } else if (modelConfig.provider === 'anthropic') {
        response = await callAnthropic(currentMessages, modelConfig);
      } else {
        throw new Error(`Unsupported provider: ${modelConfig.provider}`);
      }
    } catch (error: any) {
      yield {
        type: 'final_response',
        content: `Error calling model: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
      return;
    }

    // Check if model wants to call tools
    if (response.toolCalls && response.toolCalls.length > 0) {
      // Yield tool call steps
      for (const toolCall of response.toolCalls) {
        yield {
          type: 'tool_call',
          toolName: toolCall.name,
          args: toolCall.args,
          timestamp: new Date().toISOString(),
        };

        // Execute tool
        const result = await executeTool(toolCall.name, toolCall.args, workspaceRoot);

        // Yield tool result
        yield {
          type: 'tool_result',
          toolName: toolCall.name,
          result,
          timestamp: new Date().toISOString(),
        };

        // Add tool result to messages
        currentMessages.push({
          role: 'tool',
          content: result.success ? (result.output || '') : (result.error || 'Tool execution failed'),
          toolCallId: toolCall.id,
        });
      }

      // Add assistant message with tool calls
      currentMessages.push({
        role: 'assistant',
        content: response.content || '',
        toolCalls: response.toolCalls,
      });
    } else {
      // No tool calls, this is the final response
      yield {
        type: 'final_response',
        content: response.content,
        timestamp: new Date().toISOString(),
      };
      return;
    }
  }

  // Max iterations reached
  yield {
    type: 'final_response',
    content: `Agent stopped after ${maxIterations} iterations. Task may require manual intervention.`,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Call OpenAI/OpenAI-compatible API
 */
async function callOpenAI(messages: AgentMessage[], config: any): Promise<any> {
  const openaiMessages = messages
    .filter((m) => m.role !== 'tool')
    .map((m) => ({
      role: m.role,
      content: m.content,
      tool_calls: m.toolCalls?.map((tc) => ({
        id: tc.id,
        type: 'function',
        function: { name: tc.name, arguments: JSON.stringify(tc.args) },
      })),
    }));

  const toolResults = messages.filter((m) => m.role === 'tool');

  // Add tool results as separate messages
  for (const toolMsg of toolResults) {
    openaiMessages.push({
      role: 'tool',
      content: toolMsg.content,
      tool_call_id: toolMsg.toolCallId,
    } as any);
  }

  const response = await axios.post(
    `${config.baseUrl}/v1/chat/completions`,
    {
      model: config.model,
      messages: openaiMessages,
      tools: toolsToOpenAIFormat(),
      max_tokens: config.maxTokens,
      temperature: config.temperature,
    },
    {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    }
  );

  const choice = response.data.choices[0];
  const message = choice.message;

  if (message.tool_calls) {
    return {
      content: message.content || '',
      toolCalls: message.tool_calls.map((tc: any) => ({
        id: tc.id,
        name: tc.function.name,
        args: JSON.parse(tc.function.arguments),
      })),
    };
  }

  return {
    content: message.content || '',
    toolCalls: null,
  };
}

/**
 * Call Anthropic API
 */
async function callAnthropic(messages: AgentMessage[], config: any): Promise<any> {
  const systemMessage = messages.find((m) => m.role === 'system');
  const userMessages = messages.filter((m) => m.role !== 'system');

  const anthropicMessages = [];
  for (const msg of userMessages) {
    if (msg.role === 'tool') {
      anthropicMessages.push({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: msg.toolCallId,
            content: msg.content,
          },
        ],
      });
    } else if (msg.toolCalls) {
      anthropicMessages.push({
        role: 'assistant',
        content: msg.toolCalls.map((tc) => ({
          type: 'tool_use',
          id: tc.id,
          name: tc.name,
          input: tc.args,
        })),
      });
    } else {
      anthropicMessages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      });
    }
  }

  const response = await axios.post(
    `${config.baseUrl}/v1/messages`,
    {
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      system: systemMessage?.content || '',
      messages: anthropicMessages,
      tools: toolsToAnthropicFormat(),
    },
    {
      headers: {
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    }
  );

  const content = response.data.content;
  const toolUses = content.filter((c: any) => c.type === 'tool_use');

  if (toolUses.length > 0) {
    return {
      content: content.find((c: any) => c.type === 'text')?.text || '',
      toolCalls: toolUses.map((tu: any) => ({
        id: tu.id,
        name: tu.name,
        args: tu.input,
      })),
    };
  }

  return {
    content: content.find((c: any) => c.type === 'text')?.text || '',
    toolCalls: null,
  };
}

/**
 * Get agent system prompt
 */
export function getAgentSystemPrompt(workspaceRoot: string): string {
  return `You are NeuralIDE's autonomous coding agent. You have full access to the file system and terminal. Complete the user's task by using your tools.

Rules:
- Always read files before modifying them
- Run tests after making changes when possible
- Explain what you're doing at each step
- Ask for clarification only if truly ambiguous

Workspace root: ${workspaceRoot}

Available tools: ${AGENT_TOOLS.map((t) => t.name).join(', ')}`;
}

/**
 * Get chat system prompt
 */
export function getChatSystemPrompt(
  workspaceRoot: string,
  activeFilePath?: string,
  activeFileContent?: string
): string {
  let prompt = `You are NeuralIDE's AI coding assistant. You are precise, concise, and expert.
Format all code in markdown code blocks with language tags.

Current workspace: ${workspaceRoot}`;

  if (activeFilePath && activeFileContent) {
    const truncated = activeFileContent.slice(0, 3000);
    prompt += `\n\nActive file: ${activeFilePath}
Active file content (first 3000 chars):
\`\`\`
${truncated}
\`\`\``;
  }

  return prompt;
}
