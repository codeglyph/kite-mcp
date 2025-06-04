import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

export interface Config {
  apiKey: string;
  apiSecret: string;
  oauthPort: number;
  redirectUrl: string;
}

export class ConfigManager {
  private config: Config;

  constructor() {
    this.loadEnvironment();
    this.config = this.validateAndCreateConfig();
  }

  private loadEnvironment(): void {
    // Get the directory where the script is located
    const scriptDir = this.getScriptDirectory();

    // Try multiple locations for .env file
    const envPaths = [
      path.join(scriptDir, '.env'),
      path.join(scriptDir, '..', '.env'),  // If running from dist/
      path.join(process.cwd(), '.env'),
      path.join(scriptDir, '..', '..', '.env'),  // If deeply nested
    ];

    // Load .env file from the first location that exists
    for (const envPath of envPaths) {
      if (fs.existsSync(envPath)) {
        console.error(`Loading environment from: ${envPath}`);
        dotenv.config({ path: envPath });
        break;
      }
    }

    // Try .env.local files
    const localEnvPaths = envPaths.map(p => p.replace('.env', '.env.local'));
    for (const envPath of localEnvPaths) {
      if (fs.existsSync(envPath)) {
        console.error(`Loading local environment from: ${envPath}`);
        dotenv.config({ path: envPath, override: true });
        break;
      }
    }
  }

  private getScriptDirectory(): string {
    // Handle both ESM and CommonJS, and different execution contexts
    if (typeof __dirname !== 'undefined') {
      return __dirname;
    }

    // ESM fallback
    if (import.meta.url) {
      return path.dirname(new URL(import.meta.url).pathname);
    }

    // Last resort
    return process.cwd();
  }

  private validateAndCreateConfig(): Config {
    const apiKey = process.env.API_KEY;
    const apiSecret = process.env.API_SECRET;
    const oauthPort = parseInt(process.env.OAUTH_PORT || '50000');

    // Debug logging
    console.error('Environment check:');
    console.error(`  API_KEY: ${apiKey ? 'present' : 'missing'}`);
    console.error(`  API_SECRET: ${apiSecret ? 'present' : 'missing'}`);
    console.error(`  Working directory: ${process.cwd()}`);

    if (!apiKey || apiKey.trim() === '') {
      throw new Error(`API_KEY is required in environment variables. 
Please ensure you have a .env file with API_KEY=your_api_key
Current working directory: ${process.cwd()}
Checked paths: ${this.getCheckedPaths().join(', ')}`);
    }

    if (!apiSecret || apiSecret.trim() === '') {
      throw new Error(`API_SECRET is required in environment variables.
Please ensure you have a .env file with API_SECRET=your_api_secret
Current working directory: ${process.cwd()}
Checked paths: ${this.getCheckedPaths().join(', ')}`);
    }

    const redirectUrl = `http://localhost:${oauthPort}/zerodha/auth/redirect`;

    return {
      apiKey: apiKey.trim(),
      apiSecret: apiSecret.trim(),
      oauthPort,
      redirectUrl
    };
  }

  private getCheckedPaths(): string[] {
    const scriptDir = this.getScriptDirectory();
    return [
      path.join(scriptDir, '.env'),
      path.join(scriptDir, '..', '.env'),
      path.join(process.cwd(), '.env'),
      path.join(scriptDir, '..', '..', '.env'),
    ];
  }

  getConfig(): Config {
    return { ...this.config };
  }

  getApiKey(): string {
    return this.config.apiKey;
  }

  getApiSecret(): string {
    return this.config.apiSecret;
  }

  getOAuthPort(): number {
    return this.config.oauthPort;
  }

  getRedirectUrl(): string {
    return this.config.redirectUrl;
  }
}
