import { KiteConnect } from 'kiteconnect';
import { ConfigManager } from '../config/environment.js';
import { TokenManager } from '../auth/token-manager.js';

export interface OrderParams {
  exchange: string;
  tradingsymbol: string;
  transaction_type: 'BUY' | 'SELL';
  order_type: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
  quantity: number;
  price?: number;
  trigger_price?: number;
  product: 'NRML' | 'MIS' | 'CNC';
  validity?: 'DAY' | 'IOC';
}

export class KiteClient {
  private readonly kiteConnect: any;
  private readonly tokenManager: TokenManager;
  private isAuthenticated: boolean = false;

  constructor(config: ConfigManager, tokenManager: TokenManager) {
    this.kiteConnect = new KiteConnect({ api_key: config.getApiKey() });
    this.tokenManager = tokenManager;
    this.initializeAuthentication();
  }

  /**
   * Initialize authentication with stored token
   */
  private initializeAuthentication(): void {
    const token = this.tokenManager.getValidToken();
    if (token) {
      this.kiteConnect.setAccessToken(token);
      this.isAuthenticated = true;
    }
  }

  /**
   * Check if client is authenticated and ready
   */
  isReady(): boolean {
    return this.isAuthenticated && this.tokenManager.isTokenValid();
  }

  /**
   * Ensure authentication before API calls
   */
  private ensureAuthenticated(): void {
    if (!this.isReady()) {
      throw new Error('Not authenticated. Please run authentication first.');
    }
  }

  /**
   * Get user profile
   */
  async getProfile(): Promise<any> {
    this.ensureAuthenticated();
    try {
      return await this.kiteConnect.getProfile();
    } catch (error) {
      throw this.handleApiError(error, 'getProfile');
    }
  }

  /**
   * Get positions
   */
  async getPositions(): Promise<any> {
    this.ensureAuthenticated();
    try {
      return await this.kiteConnect.getPositions();
    } catch (error) {
      throw this.handleApiError(error, 'getPositions');
    }
  }

  /**
   * Get holdings
   */
  async getHoldings(): Promise<any> {
    this.ensureAuthenticated();
    try {
      return await this.kiteConnect.getHoldings();
    } catch (error) {
      throw this.handleApiError(error, 'getHoldings');
    }
  }

  /**
   * Get orders
   */
  async getOrders(): Promise<any> {
    this.ensureAuthenticated();
    try {
      return await this.kiteConnect.getOrders();
    } catch (error) {
      throw this.handleApiError(error, 'getOrders');
    }
  }

  /**
   * Get order history for a specific order
   */
  async getOrderHistory(orderId: string): Promise<any> {
    this.ensureAuthenticated();
    try {
      return await this.kiteConnect.getOrderHistory(orderId);
    } catch (error) {
      throw this.handleApiError(error, 'getOrderHistory');
    }
  }

  /**
   * Get instruments for an exchange
   */
  async getInstruments(exchange?: string): Promise<any> {
    this.ensureAuthenticated();
    try {
      return await this.kiteConnect.getInstruments(exchange);
    } catch (error) {
      throw this.handleApiError(error, 'getInstruments');
    }
  }

  /**
   * Get Last Traded Price (LTP) for instruments
   */
  async getLTP(instruments: string[]): Promise<any> {
    this.ensureAuthenticated();
    try {
      return await this.kiteConnect.getLTP(instruments);
    } catch (error) {
      throw this.handleApiError(error, 'getLTP');
    }
  }

  /**
   * Get OHLC data for instruments
   */
  async getOHLC(instruments: string[]): Promise<any> {
    this.ensureAuthenticated();
    try {
      return await this.kiteConnect.getOHLC(instruments);
    } catch (error) {
      throw this.handleApiError(error, 'getOHLC');
    }
  }

  /**
   * Get market quote for instruments
   */
  async getQuote(instruments: string[]): Promise<any> {
    this.ensureAuthenticated();
    try {
      return await this.kiteConnect.getQuote(instruments);
    } catch (error) {
      throw this.handleApiError(error, 'getQuote');
    }
  }

  /**
   * Place a new order
   */
  async placeOrder(orderParams: OrderParams): Promise<any> {
    this.ensureAuthenticated();
    try {
      return await this.kiteConnect.placeOrder('regular', orderParams);
    } catch (error) {
      throw this.handleApiError(error, 'placeOrder');
    }
  }

  /**
   * Modify an existing order
   */
  async modifyOrder(orderId: string, orderParams: Partial<OrderParams>): Promise<any> {
    this.ensureAuthenticated();
    try {
      return await this.kiteConnect.modifyOrder('regular', orderId, orderParams);
    } catch (error) {
      throw this.handleApiError(error, 'modifyOrder');
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<any> {
    this.ensureAuthenticated();
    try {
      return await this.kiteConnect.cancelOrder('regular', orderId);
    } catch (error) {
      throw this.handleApiError(error, 'cancelOrder');
    }
  }

  /**
   * Get margins
   */
  async getMargins(): Promise<any> {
    this.ensureAuthenticated();
    try {
      return await this.kiteConnect.getMargins();
    } catch (error) {
      throw this.handleApiError(error, 'getMargins');
    }
  }

  /**
   * Handle API errors consistently
   */
  private handleApiError(error: any, operation: string): Error {
    if (error && typeof error === 'object') {
      // Handle specific Kite API errors
      if (error.status === 403) {
        this.isAuthenticated = false;
        return new Error(`Authentication failed during ${operation}. Token may be expired.`);
      }

      if (error.message) {
        return new Error(`${operation} failed: ${error.message}`);
      }
    }

    return new Error(`${operation} failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  /**
   * Get current authentication status
   */
  getAuthenticationStatus(): { authenticated: boolean; user?: string; tokenExpiry?: string } {
    const tokenData = this.tokenManager.getValidTokenData();

    return {
      authenticated: this.isReady(),
      user: tokenData?.user_name || tokenData?.user_id,
      tokenExpiry: tokenData?.generated_at
    };
  }
}
