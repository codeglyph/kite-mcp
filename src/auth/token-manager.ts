import * as fs from 'fs';
import * as path from 'path';

export interface TokenData {
  access_token: string;
  refresh_token?: string;
  user_id: string;
  user_name?: string;
  generated_at: string;
  expires_at?: string;
}

export class TokenManager {
  private readonly tokenFile: string;

  constructor(tokenFilePath?: string) {
    if (tokenFilePath) {
      this.tokenFile = tokenFilePath;
    } else {
      // Use the same directory resolution logic as ConfigManager
      this.tokenFile = this.findTokenFile();
    }
  }

  private findTokenFile(): string {
    const scriptDir = this.getScriptDirectory();

    // Try multiple locations for access_token.json file
    const tokenPaths = [
      path.join(scriptDir, 'access_token.json'),
      path.join(scriptDir, '..', 'access_token.json'),  // If running from dist/
      path.join(process.cwd(), 'access_token.json'),
      path.join(scriptDir, '..', '..', 'access_token.json'),  // If deeply nested
    ];

    // Return the first location where the file exists, or default to the first path
    for (const tokenPath of tokenPaths) {
      if (fs.existsSync(tokenPath)) {
        console.error(`Found token file at: ${tokenPath}`);
        return tokenPath;
      }
    }

    // If no existing file found, use the script directory (where .env is likely located)
    const defaultPath = path.join(scriptDir, 'access_token.json');
    console.error(`Token file not found, will use: ${defaultPath}`);
    return defaultPath;
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

  /**
   * Save token data to file
   */
  saveToken(tokenData: Omit<TokenData, 'generated_at'> & { generated_at?: string }): void {
    try {
      const completeTokenData: TokenData = {
        ...tokenData,
        generated_at: tokenData.generated_at || new Date().toISOString()
      };

      // Ensure directory exists
      const tokenDir = path.dirname(this.tokenFile);
      if (!fs.existsSync(tokenDir)) {
        fs.mkdirSync(tokenDir, { recursive: true });
      }

      fs.writeFileSync(this.tokenFile, JSON.stringify(completeTokenData, null, 2));
      console.error(`Token saved to: ${this.tokenFile}`);
    } catch (error) {
      throw new Error(`Failed to save token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load token data from file
   */
  loadToken(): TokenData | null {
    try {
      if (!fs.existsSync(this.tokenFile)) {
        console.error(`Token file not found at: ${this.tokenFile}`);
        return null;
      }

      const data = fs.readFileSync(this.tokenFile, 'utf-8');
      const tokenData = JSON.parse(data) as TokenData;

      // Validate required fields
      if (!tokenData.access_token || !tokenData.user_id || !tokenData.generated_at) {
        throw new Error('Invalid token data structure');
      }

      console.error(`Token loaded from: ${this.tokenFile}`);
      return tokenData;
    } catch (error) {
      console.error(`Failed to load token from ${this.tokenFile}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Check if token exists and is valid
   */
  isTokenValid(): boolean {
    const tokenData = this.loadToken();

    if (!tokenData) {
      return false;
    }

    const isValid = this.validateTokenExpiry(tokenData);
    console.error(`Token validation: ${isValid ? 'valid' : 'expired'}`);
    return isValid;
  }

  /**
   * Get valid token or null
   */
  getValidToken(): string | null {
    if (!this.isTokenValid()) {
      return null;
    }

    const tokenData = this.loadToken();
    return tokenData?.access_token || null;
  }

  /**
   * Get token data if valid
   */
  getValidTokenData(): TokenData | null {
    if (!this.isTokenValid()) {
      return null;
    }

    return this.loadToken();
  }

  /**
   * Delete token file
   */
  clearToken(): void {
    try {
      if (fs.existsSync(this.tokenFile)) {
        fs.unlinkSync(this.tokenFile);
      }
    } catch (error) {
      throw new Error(`Failed to clear token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if token has expired based on generation time
   */
  private validateTokenExpiry(tokenData: TokenData): boolean {
    // If explicit expiry time is set, use it
    if (tokenData.expires_at) {
      const expiresAt = new Date(tokenData.expires_at);
      const now = new Date();
      return now < expiresAt;
    }

    // Otherwise, use generation time with 5-hour buffer (Kite tokens expire in ~6 hours)
    const generatedAt = new Date(tokenData.generated_at);
    const now = new Date();
    const diffHours = (now.getTime() - generatedAt.getTime()) / (1000 * 60 * 60);

    return diffHours < 5;
  }

  /**
   * Get token file path
   */
  getTokenFilePath(): string {
    return this.tokenFile;
  }
}
