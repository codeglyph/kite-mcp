import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import { ConfigManager } from '../config/environment.js';
import { TokenManager } from '../auth/token-manager.js';
import { KiteClient } from '../api/kite-client.js';
import { ALL_TOOLS, type ToolContext } from './tools/index.js';

export class KiteMCPServer {
  private readonly server: Server;
  private readonly config: ConfigManager;
  private readonly tokenManager: TokenManager;
  private readonly kiteClient: KiteClient;
  private readonly toolContext: ToolContext;

  constructor() {
    this.server = new Server(
      {
        name: 'kite-mcp-server',
        version: '1.0.0',
        description: 'MCP server for Zerodha Kite API integration'
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize dependencies
    this.config = new ConfigManager();
    this.tokenManager = new TokenManager();
    this.kiteClient = new KiteClient(this.config, this.tokenManager);
    this.toolContext = { kiteClient: this.kiteClient };

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Handle tool listing
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: ALL_TOOLS.map(tool => tool.getDefinition())
      };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      const tool = ALL_TOOLS.find(t => t.name === name);
      if (!tool) {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Tool ${name} not found`
        );
      }

      try {
        // Check authentication for all tools except auth status
        if (name !== 'get_auth_status' && !this.kiteClient.isReady()) {
          throw new McpError(
            ErrorCode.InternalError,
            'Not authenticated with Kite API. Please run authentication first.'
          );
        }

        const result = await tool.execute(args || {}, this.toolContext);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }

        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });

    // Error handling
    this.server.onerror = (error) => {
      console.error('[MCP Server Error]', error);
    };
  }

  /**
   * Connect to transport and start server
   */
  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.error('Kite MCP Server running on stdio');
  }

  /**
   * Get server instance for testing
   */
  getServer(): Server {
    return this.server;
  }

  /**
   * Check if ready to serve requests
   */
  isReady(): boolean {
    return this.kiteClient.isReady();
  }

  /**
   * Get authentication status
   */
  getAuthStatus(): any {
    return this.kiteClient.getAuthenticationStatus();
  }
}

export default KiteMCPServer;
