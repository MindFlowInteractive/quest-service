import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HorizonTransactionResponse,
  HorizonOperationResponse,
  HorizonLedgerResponse,
  HorizonCollectionResponse,
} from '../interfaces/horizon-response.interface';

@Injectable()
export class HorizonApiService {
  private readonly logger = new Logger(HorizonApiService.name);
  private readonly baseUrl: string;
  private readonly requestTimeout: number;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>(
      'STELLAR_HORIZON_URL',
      'https://horizon-testnet.stellar.org'
    );
    this.requestTimeout = this.configService.get<number>(
      'HORIZON_REQUEST_TIMEOUT',
      30000
    );
  }

  /**
   * Fetch a single transaction by hash
   */
  async getTransaction(hash: string): Promise<HorizonTransactionResponse | null> {
    try {
      const url = `${this.baseUrl}/transactions/${hash}`;
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(this.requestTimeout),
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Horizon API error: ${response.status} ${response.statusText}`);
      }

      return await response.json() as HorizonTransactionResponse;
    } catch (error) {
      this.logger.error(`Error fetching transaction ${hash}:`, error);
      throw error;
    }
  }

  /**
   * Fetch transactions for an account
   */
  async getAccountTransactions(
    accountId: string,
    options: {
      cursor?: string;
      limit?: number;
      order?: 'asc' | 'desc';
      includeFailed?: boolean;
    } = {}
  ): Promise<HorizonCollectionResponse<HorizonTransactionResponse>> {
    const { cursor, limit = 20, order = 'desc', includeFailed = true } = options;
    
    const params = new URLSearchParams();
    params.set('limit', limit.toString());
    params.set('order', order);
    params.set('include_failed', includeFailed.toString());
    if (cursor) params.set('cursor', cursor);

    const url = `${this.baseUrl}/accounts/${accountId}/transactions?${params.toString()}`;
    
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(this.requestTimeout),
      });

      if (!response.ok) {
        throw new Error(`Horizon API error: ${response.status} ${response.statusText}`);
      }

      return await response.json() as HorizonCollectionResponse<HorizonTransactionResponse>;
    } catch (error) {
      this.logger.error(`Error fetching transactions for account ${accountId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch operations for a transaction
   */
  async getTransactionOperations(
    transactionHash: string
  ): Promise<HorizonCollectionResponse<HorizonOperationResponse>> {
    const url = `${this.baseUrl}/transactions/${transactionHash}/operations`;
    
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(this.requestTimeout),
      });

      if (!response.ok) {
        throw new Error(`Horizon API error: ${response.status} ${response.statusText}`);
      }

      return await response.json() as HorizonCollectionResponse<HorizonOperationResponse>;
    } catch (error) {
      this.logger.error(`Error fetching operations for transaction ${transactionHash}:`, error);
      throw error;
    }
  }

  /**
   * Fetch all transactions (paginated)
   */
  async getAllTransactions(
    options: {
      cursor?: string;
      limit?: number;
      order?: 'asc' | 'desc';
      includeFailed?: boolean;
    } = {}
  ): Promise<HorizonCollectionResponse<HorizonTransactionResponse>> {
    const { cursor, limit = 20, order = 'desc', includeFailed = true } = options;
    
    const params = new URLSearchParams();
    params.set('limit', limit.toString());
    params.set('order', order);
    params.set('include_failed', includeFailed.toString());
    if (cursor) params.set('cursor', cursor);

    const url = `${this.baseUrl}/transactions?${params.toString()}`;
    
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(this.requestTimeout),
      });

      if (!response.ok) {
        throw new Error(`Horizon API error: ${response.status} ${response.statusText}`);
      }

      return await response.json() as HorizonCollectionResponse<HorizonTransactionResponse>;
    } catch (error) {
      this.logger.error('Error fetching all transactions:', error);
      throw error;
    }
  }

  /**
   * Fetch latest ledger information
   */
  async getLatestLedger(): Promise<HorizonLedgerResponse> {
    const url = `${this.baseUrl}/ledgers?order=desc&limit=1`;
    
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(this.requestTimeout),
      });

      if (!response.ok) {
        throw new Error(`Horizon API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as HorizonCollectionResponse<HorizonLedgerResponse>;
      return data._embedded.records[0];
    } catch (error) {
      this.logger.error('Error fetching latest ledger:', error);
      throw error;
    }
  }

  /**
   * Stream transactions using SSE (Server-Sent Events)
   * Returns a callback-based interface for real-time transaction monitoring
   */
  streamTransactions(
    options: {
      cursor?: string;
      onTransaction: (tx: HorizonTransactionResponse) => void;
      onError?: (error: Error) => void;
    }
  ): { stop: () => void } {
    const { cursor, onTransaction, onError } = options;
    
    const params = new URLSearchParams();
    params.set('include_failed', 'true');
    if (cursor) params.set('cursor', cursor);

    const url = `${this.baseUrl}/transactions?${params.toString()}`;
    
    const abortController = new AbortController();
    
    // Start streaming in background
    this.startStreaming(url, onTransaction, onError || (() => {}), abortController);
    
    return {
      stop: () => abortController.abort(),
    };
  }

  /**
   * Start SSE streaming
   */
  private async startStreaming(
    url: string,
    onTransaction: (tx: HorizonTransactionResponse) => void,
    onError: (error: Error) => void,
    abortController: AbortController
  ): Promise<void> {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'text/event-stream',
        },
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`SSE connection failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body available for streaming');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data !== '"hello"' && data !== '"bye"') {
              try {
                const transaction = JSON.parse(data) as HorizonTransactionResponse;
                onTransaction(transaction);
              } catch (e) {
                this.logger.warn('Failed to parse SSE data:', data);
              }
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        this.logger.error('SSE streaming error:', error);
        onError(error as Error);
      }
    }
  }

  /**
   * Check if Horizon API is reachable
   */
  async healthCheck(): Promise<{ healthy: boolean; latency: number; version?: string }> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(this.baseUrl, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      });

      const latency = Date.now() - startTime;
      
      if (!response.ok) {
        return { healthy: false, latency };
      }

      const data = await response.json();
      return {
        healthy: true,
        latency,
        version: data.protocol_version?.toString(),
      };
    } catch (error) {
      return { healthy: false, latency: Date.now() - startTime };
    }
  }
}
