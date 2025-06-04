# Kite MCP Server

A Model Context Protocol (MCP) server for integrating with Zerodha Kite API. This server provides Claude with tools to interact with your Kite trading account.

## Features

- **Portfolio Management**: Get positions, holdings, and orders
- **Market Data**: Real-time quotes, LTP, and instrument data
- **Order Management**: Place, modify, and cancel orders
- **Account Info**: Profile, margins, and authentication status
- **Secure Authentication**: OAuth 2.0 flow with token persistence

## Prerequisites

1. **Zerodha Kite Connect App**: Create an app at [Kite Connect](https://kite.trade/)
2. **API Credentials**: Get your API Key and Secret
3. **Bun**: Latest version of Bun runtime

## Installation

1. Clone and install dependencies:

```bash
bun install
```

2. Set up environment variables:

```bash
# Edit .env with your API credentials
```

3. Configure your Kite Connect app with redirect URL:

```
http://localhost:50000/zerodha/auth/redirect
```

## Quick Start

### 1. Authenticate with Kite API

```bash
bun run auth
```

This will:

- Start a local OAuth server
- Open your browser to Kite login
- Save your access token securely

### 2. Start the MCP Server

```bash
bun start
```

### 3. Configure Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "kite": {
      "command": "bun",
      "args": ["run", "/path/to/kite-mcp/src/index.ts"]
    }
  }
}
```

## Available Tools

### Portfolio Tools

- `get_profile` - Get user profile information
- `get_positions` - Get current trading positions
- `get_holdings` - Get long-term holdings
- `get_margins` - Get account margins and funds

### Order Tools

- `get_orders` - Get today's orders
- `place_order` - Place a new trading order
- `cancel_order` - Cancel an existing order

### Market Data Tools

- `get_ltp` - Get Last Traded Price for instruments
- `get_quote` - Get detailed market quotes
- `get_instruments` - Get tradable instruments list

### Utility Tools

- `get_auth_status` - Check authentication status

## Project Structure

```
src/
├── config/
│   └── environment.ts          # Configuration management
├── auth/
│   ├── token-manager.ts        # Token storage and validation
│   └── oauth-server.ts         # OAuth flow handling
├── api/
│   └── kite-client.ts          # Kite API wrapper
├── mcp/
│   ├── server.ts               # MCP server implementation
│   └── tools/
│       └── index.ts            # MCP tools definitions
├── auth.ts                     # Authentication entry point
└── index.ts                    # MCP server entry point
```

## Development

### Build (Optional)

```bash
bun run build
```

### Development Mode

```bash
bun run dev          # Watch mode for MCP server
bun run dev:auth     # Watch mode for auth server
```

### Architecture

The project follows the Single Responsibility Principle:

- **ConfigManager**: Environment and configuration handling
- **TokenManager**: Token persistence and validation
- **OAuthServer**: OAuth 2.0 authentication flow
- **KiteClient**: Kite API wrapper with error handling
- **KiteMCPServer**: MCP protocol implementation
- **Tools**: Individual MCP tool implementations

## Environment Variables

```bash
API_KEY=your_kite_api_key        # Required: Kite Connect API Key
API_SECRET=your_kite_api_secret  # Required: Kite Connect API Secret
OAUTH_PORT=50000                 # Optional: OAuth server port (default: 50000)
```

## Security

- Tokens are stored locally in `access_token.json`
- OAuth flow uses secure redirect handling
- API credentials are never logged or exposed
- Tokens auto-expire for security

## Troubleshooting

### Authentication Issues

1. Verify API credentials in `.env`
2. Check redirect URL in Kite Connect app settings
3. Ensure OAuth port (50000) is available

### Token Expiry

- Kite tokens expire every ~6 hours
- Re-run `bun run auth` when expired
- Server will notify you of authentication status

### MCP Connection Issues

1. Verify Claude Desktop configuration
2. Check server is running: `bun start`
3. Look for errors in Claude Desktop logs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the existing code structure and patterns
4. Add appropriate error handling
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Disclaimer

This is an unofficial integration with Zerodha Kite API. Use at your own risk. Always verify trades and orders before execution.
