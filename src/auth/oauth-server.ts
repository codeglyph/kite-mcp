import { KiteConnect } from 'kiteconnect';
import { ConfigManager } from '../config/environment.js';
import { TokenManager, type TokenData } from './token-manager.js';

export class OAuthServer {
  private readonly kiteConnect: any;
  private readonly config: ConfigManager;
  private readonly tokenManager: TokenManager;
  private server: any = null;

  constructor(config: ConfigManager, tokenManager: TokenManager) {
    this.config = config;
    this.tokenManager = tokenManager;
    this.kiteConnect = new KiteConnect({ api_key: this.config.getApiKey() });
  }

  /**
   * Get the Kite login URL for OAuth flow
   */
  getLoginUrl(): string {
    return this.kiteConnect.getLoginURL();
  }

  /**
   * Start the OAuth server and return a promise that resolves when authentication is complete
   */
  async startAuthFlow(): Promise<TokenData> {
    return new Promise<TokenData>((resolve, reject) => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const cleanupAndResolve = (value: TokenData) => {
        if (timeoutId) clearTimeout(timeoutId);
        resolve(value);
      };

      const cleanupAndReject = (reason: any) => {
        if (timeoutId) clearTimeout(timeoutId);
        reject(reason);
      };

      this.server = Bun.serve({
        port: this.config.getOAuthPort(),
        fetch: async (req) => {
          const url = new URL(req.url);

          if (url.pathname === '/zerodha/auth/redirect') {
            try {
              const tokenData = await this.handleOAuthCallback(url);
              cleanupAndResolve(tokenData);

              // Auto-shutdown server after successful auth
              setTimeout(() => {
                if (this.server) {
                  this.server.stop();
                  this.server = null;
                }
              }, 1000);

              return new Response('✅ Authentication successful! Token saved. You can close this window.', {
                headers: { 'Content-Type': 'text/plain' }
              });
            } catch (error) {
              cleanupAndReject(error);

              setTimeout(() => {
                if (this.server) {
                  this.server.stop();
                  this.server = null;
                }
              }, 1000);

              return new Response(`❌ Authentication failed: ${error}`, {
                status: 500,
                headers: { 'Content-Type': 'text/plain' }
              });
            }
          }

          return new Response('Kite OAuth Server - Waiting for callback...', {
            headers: { 'Content-Type': 'text/plain' }
          });
        }
      });

      // Set timeout for auth flow
      timeoutId = setTimeout(() => {
        if (this.server) {
          this.server.stop();
          this.server = null;
        }
        cleanupAndReject(new Error('Authentication timeout - no callback received within 5 minutes'));
      }, 5 * 60 * 1000); // 5 minutes
    });
  }

  /**
   * Handle the OAuth callback and generate session
   */
  private async handleOAuthCallback(url: URL): Promise<TokenData> {
    const requestToken = url.searchParams.get('request_token');
    const status = url.searchParams.get('status');

    if (status !== 'success' || !requestToken) {
      const error = url.searchParams.get('error_type') || 'OAuth callback failed';
      throw new Error(error);
    }

    try {
      const response = await this.kiteConnect.generateSession(requestToken, this.config.getApiSecret());

      const tokenData: TokenData = {
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        user_id: response.user_id,
        user_name: response.user_name,
        generated_at: new Date().toISOString()
      };

      this.tokenManager.saveToken(tokenData);

      return tokenData;
    } catch (error) {
      throw new Error(`Session generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stop the OAuth server if running
   */
  stop(): void {
    if (this.server) {
      this.server.stop();
      this.server = null;
    }
  }
}
