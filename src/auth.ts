#!/usr/bin/env bun

import { ConfigManager } from './config/environment.js';
import { TokenManager } from './auth/token-manager.js';
import { OAuthServer } from './auth/oauth-server.js';

async function authenticate() {
  console.log('🪁 Kite API Authentication');
  console.log('==========================');

  try {
    // Initialize dependencies
    const config = new ConfigManager();
    const tokenManager = new TokenManager();
    const oauthServer = new OAuthServer(config, tokenManager);

    // Check if already authenticated
    if (tokenManager.isTokenValid()) {
      const tokenData = tokenManager.getValidTokenData();
      console.log('✅ Already authenticated!');
      console.log(`👤 User: ${tokenData?.user_name || tokenData?.user_id}`);
      console.log(`📅 Token generated: ${tokenData?.generated_at}`);
      console.log('');
      console.log('If you want to re-authenticate, delete the access_token.json file first.');
      return;
    }

    // Start OAuth flow
    console.log(`🚀 Starting OAuth server on port ${config.getOAuthPort()}`);
    console.log('');

    const loginUrl = oauthServer.getLoginUrl();
    console.log('📋 Authentication Steps:');
    console.log('1. Open the following URL in your browser:');
    console.log('');
    console.log(`   ${loginUrl}`);
    console.log('');
    console.log('2. Complete authentication with your Zerodha credentials');
    console.log('3. You will be redirected back and the token will be saved automatically');
    console.log('');
    console.log('⏳ Waiting for authentication...');
    console.log('   (Press Ctrl+C to cancel)');

    // Wait for authentication
    const tokenData = await oauthServer.startAuthFlow();

    console.log('');
    console.log('✅ Authentication successful!');
    console.log(`👤 Welcome, ${tokenData.user_name || tokenData.user_id}!`);
    console.log(`💾 Token saved to: ${tokenManager.getTokenFilePath()}`);
    console.log('');
    console.log('🎉 You can now use the Kite MCP server!');
    console.log('   Start with: bun start');

  } catch (error) {
    console.error('');
    console.error('❌ Authentication failed:');
    console.error('  ', error instanceof Error ? error.message : String(error));
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('   - Check your API_KEY and API_SECRET in .env file');
    console.error('   - Make sure your redirect URL is correctly configured in Kite Connect app');
    console.error('   - Ensure you complete the authentication within 5 minutes');

    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Authentication cancelled by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Authentication terminated');
  process.exit(0);
});

// Run authentication
authenticate().catch((error) => {
  console.error('Unexpected error during authentication:', error);
  process.exit(1);
});
