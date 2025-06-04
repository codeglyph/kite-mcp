#!/usr/bin/env bun

import { KiteMCPServer } from './mcp/server.js';

async function main() {
  try {
    const server = new KiteMCPServer();

    // Check authentication status on startup
    const authStatus = server.getAuthStatus();
    if (!authStatus.authenticated) {
      console.error('Warning: Not authenticated with Kite API. Some tools may not work.');
      console.error('Run authentication with: bun run auth');
    } else {
      console.error(`Authenticated as: ${authStatus.user}`);
    }

    // Start the MCP server
    await server.run();
  } catch (error) {
    console.error('Failed to start Kite MCP Server:', error);
    process.exit(1);
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.error('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
