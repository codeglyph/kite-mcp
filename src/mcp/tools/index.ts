import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { KiteClient } from '../../api/kite-client.js';

export interface ToolContext {
  kiteClient: KiteClient;
}

export abstract class BaseTool {
  abstract readonly name: string;
  abstract readonly description: string;

  abstract getDefinition(): Tool;
  abstract execute(args: any, context: ToolContext): Promise<any>;
}

// Profile Tools
export class GetProfileTool extends BaseTool {
  readonly name = 'get_profile';
  readonly description = 'Get user profile information from Kite';

  getDefinition(): Tool {
    return {
      name: this.name,
      description: this.description,
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    };
  }

  async execute(args: any, context: ToolContext): Promise<any> {
    return await context.kiteClient.getProfile();
  }
}

// Portfolio Tools
export class GetPositionsTool extends BaseTool {
  readonly name = 'get_positions';
  readonly description = 'Get current trading positions';

  getDefinition(): Tool {
    return {
      name: this.name,
      description: this.description,
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    };
  }

  async execute(args: any, context: ToolContext): Promise<any> {
    return await context.kiteClient.getPositions();
  }
}

export class GetHoldingsTool extends BaseTool {
  readonly name = 'get_holdings';
  readonly description = 'Get long-term stock holdings';

  getDefinition(): Tool {
    return {
      name: this.name,
      description: this.description,
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    };
  }

  async execute(args: any, context: ToolContext): Promise<any> {
    return await context.kiteClient.getHoldings();
  }
}

// Order Tools
export class GetOrdersTool extends BaseTool {
  readonly name = 'get_orders';
  readonly description = 'Get list of orders for the day';

  getDefinition(): Tool {
    return {
      name: this.name,
      description: this.description,
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    };
  }

  async execute(args: any, context: ToolContext): Promise<any> {
    return await context.kiteClient.getOrders();
  }
}

export class PlaceOrderTool extends BaseTool {
  readonly name = 'place_order';
  readonly description = 'Place a new trading order';

  getDefinition(): Tool {
    return {
      name: this.name,
      description: this.description,
      inputSchema: {
        type: 'object',
        properties: {
          exchange: {
            type: 'string',
            description: 'Exchange (NSE, BSE, etc.)',
            enum: ['NSE', 'BSE', 'NFO', 'BFO', 'CDS', 'MCX']
          },
          tradingsymbol: {
            type: 'string',
            description: 'Trading symbol (e.g., INFY, SBIN)'
          },
          transaction_type: {
            type: 'string',
            description: 'Transaction type',
            enum: ['BUY', 'SELL']
          },
          order_type: {
            type: 'string',
            description: 'Order type',
            enum: ['MARKET', 'LIMIT', 'SL', 'SL-M']
          },
          quantity: {
            type: 'number',
            description: 'Number of shares to trade'
          },
          price: {
            type: 'number',
            description: 'Price per share (required for LIMIT orders)'
          },
          trigger_price: {
            type: 'number',
            description: 'Trigger price (required for SL and SL-M orders)'
          },
          product: {
            type: 'string',
            description: 'Product type',
            enum: ['NRML', 'MIS', 'CNC']
          },
          validity: {
            type: 'string',
            description: 'Order validity',
            enum: ['DAY', 'IOC']
          }
        },
        required: ['exchange', 'tradingsymbol', 'transaction_type', 'order_type', 'quantity', 'product']
      }
    };
  }

  async execute(args: any, context: ToolContext): Promise<any> {
    return await context.kiteClient.placeOrder(args);
  }
}

export class CancelOrderTool extends BaseTool {
  readonly name = 'cancel_order';
  readonly description = 'Cancel an existing order';

  getDefinition(): Tool {
    return {
      name: this.name,
      description: this.description,
      inputSchema: {
        type: 'object',
        properties: {
          order_id: {
            type: 'string',
            description: 'Order ID to cancel'
          }
        },
        required: ['order_id']
      }
    };
  }

  async execute(args: any, context: ToolContext): Promise<any> {
    return await context.kiteClient.cancelOrder(args.order_id);
  }
}

// Market Data Tools
export class GetLTPTool extends BaseTool {
  readonly name = 'get_ltp';
  readonly description = 'Get Last Traded Price for instruments';

  getDefinition(): Tool {
    return {
      name: this.name,
      description: this.description,
      inputSchema: {
        type: 'object',
        properties: {
          instruments: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'List of instruments (e.g., ["NSE:INFY", "NSE:TCS"])'
          }
        },
        required: ['instruments']
      }
    };
  }

  async execute(args: any, context: ToolContext): Promise<any> {
    return await context.kiteClient.getLTP(args.instruments);
  }
}

export class GetQuoteTool extends BaseTool {
  readonly name = 'get_quote';
  readonly description = 'Get detailed market quote for instruments';

  getDefinition(): Tool {
    return {
      name: this.name,
      description: this.description,
      inputSchema: {
        type: 'object',
        properties: {
          instruments: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'List of instruments (e.g., ["NSE:INFY", "NSE:TCS"])'
          }
        },
        required: ['instruments']
      }
    };
  }

  async execute(args: any, context: ToolContext): Promise<any> {
    return await context.kiteClient.getQuote(args.instruments);
  }
}

export class GetInstrumentsTool extends BaseTool {
  readonly name = 'get_instruments';
  readonly description = 'Get list of tradable instruments for an exchange';

  getDefinition(): Tool {
    return {
      name: this.name,
      description: this.description,
      inputSchema: {
        type: 'object',
        properties: {
          exchange: {
            type: 'string',
            description: 'Exchange name (optional)',
            enum: ['NSE', 'BSE', 'NFO', 'BFO', 'CDS', 'MCX']
          }
        },
        required: []
      }
    };
  }

  async execute(args: any, context: ToolContext): Promise<any> {
    return await context.kiteClient.getInstruments(args.exchange);
  }
}

// Utility Tools
export class GetMarginsTool extends BaseTool {
  readonly name = 'get_margins';
  readonly description = 'Get account margins and available funds';

  getDefinition(): Tool {
    return {
      name: this.name,
      description: this.description,
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    };
  }

  async execute(args: any, context: ToolContext): Promise<any> {
    return await context.kiteClient.getMargins();
  }
}

export class GetAuthStatusTool extends BaseTool {
  readonly name = 'get_auth_status';
  readonly description = 'Get current authentication status';

  getDefinition(): Tool {
    return {
      name: this.name,
      description: this.description,
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    };
  }

  async execute(args: any, context: ToolContext): Promise<any> {
    return context.kiteClient.getAuthenticationStatus();
  }
}

// Export all tools
export const ALL_TOOLS = [
  new GetProfileTool(),
  new GetPositionsTool(),
  new GetHoldingsTool(),
  new GetOrdersTool(),
  new PlaceOrderTool(),
  new CancelOrderTool(),
  new GetLTPTool(),
  new GetQuoteTool(),
  new GetInstrumentsTool(),
  new GetMarginsTool(),
  new GetAuthStatusTool()
];
