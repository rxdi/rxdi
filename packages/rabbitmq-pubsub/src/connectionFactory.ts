import { Channel, ChannelModel, connect } from 'amqplib';
import { Observable, defer, of, ReplaySubject, throwError, timer } from 'rxjs';
import {
  shareReplay,
  retry,
  tap,
  catchError,
  switchMap,
  retryWhen,
  delayWhen,
  take,
} from 'rxjs/operators';
import { createChildLogger, Logger } from './childLogger';

export interface IRabbitMqConnectionConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  vhost?: string;
}

/**
 * RxJS-based connection factory with automatic reconnection
 */
export class RxJsRabbitMqConnectionFactory {
  private connection$: Observable<ChannelModel>;
  private connectionUrl: string;
  private logger: Logger;
  private reconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(
    logger: Logger,
    config: IRabbitMqConnectionConfig | string,
    options?: {
      reconnectAttempts?: number;
      reconnectDelay?: number;
    },
  ) {
    this.logger = createChildLogger(logger, 'RxJsRabbitMqConnectionFactory');
    this.connectionUrl = this.buildConnectionUrl(config);
    this.reconnectAttempts = options?.reconnectAttempts ?? 5;
    this.reconnectDelay = options?.reconnectDelay ?? 1000;

    // Create a shared connection observable that reconnects on failure
    this.connection$ = this.createConnection$();
  }

  /**
   * Get connection as Observable
   */
  public getConnection$(): Observable<ChannelModel> {
    return this.connection$;
  }

  /**
   * Get connection as Promise (for backward compatibility)
   */
  public create(): Promise<ChannelModel> {
    return this.connection$.pipe(take(1)).toPromise();
  }

  /**
   * Creates an observable that maintains a single connection with auto-reconnect
   */
  private createConnection$(): Observable<ChannelModel> {
    return defer(() => {
      this.logger.debug('creating connection to %s', this.connectionUrl);
      return of(connect(this.connectionUrl));
    }).pipe(
      switchMap((connectionPromise) => connectionPromise),
      tap((connection) => {
        this.logger.debug('connection established to %s', this.connectionUrl);
        
        // Handle connection errors
        connection.on('error', (err) => {
          this.logger.error(err, 'connection error on %s', this.connectionUrl);
        });

        connection.on('close', () => {
          this.logger.debug('connection closed to %s', this.connectionUrl);
        });
      }),
      retryWhen((errors) =>
        errors.pipe(
          tap((err) => {
            this.logger.error(err, 'connection failed to %s, retrying...', this.connectionUrl);
          }),
          delayWhen((_, index) => {
            const delay = Math.min(
              this.reconnectDelay * Math.pow(2, index),
              30000, // Max 30 seconds
            );
            this.logger.debug(
              'retrying connection in %dms (attempt %d/%d)',
              delay,
              index + 1,
              this.reconnectAttempts,
            );
            return timer(delay);
          }),
          take(this.reconnectAttempts),
        ),
      ),
      catchError((err) => {
        this.logger.error(
          err,
          'failed to establish connection after %d attempts',
          this.reconnectAttempts,
        );
        return throwError(() => new Error('Connection failed after max retry attempts'));
      }),
      // Share the connection among all subscribers
      shareReplay({
        bufferSize: 1,
        refCount: true,
      }),
    );
  }

  /**
   * Build connection URL from config
   */
  private buildConnectionUrl(config: IRabbitMqConnectionConfig | string): string {
    if (typeof config === 'string') {
      return config;
    }

    const { host, port, username, password, vhost } = config;
    const auth = username && password ? `${username}:${password}@` : '';
    const vhostPath = vhost ? `/${vhost}` : '';
    
    return `amqp://${auth}${host}:${port}${vhostPath}`;
  }
}

/**
 * Channel pool for better resource management
 */
export class RxJsChannelPool {
  private channels$ = new ReplaySubject<Channel>(10);
  private logger: Logger;

  constructor(
    logger: Logger,
    private connectionFactory: RxJsRabbitMqConnectionFactory,
    private poolSize: number = 10,
  ) {
    this.logger = createChildLogger(logger, 'RxJsChannelPool');
    this.initializePool();
  }

  /**
   * Get a channel from the pool
   */
  public getChannel$(): Observable<Channel> {
    return this.channels$.pipe(take(1));
  }

  /**
   * Return a channel to the pool
   */
  public returnChannel(channel: Channel): void {
    // Check if channel is still usable
    if (channel && !channel.connection['closing']) {
      this.channels$.next(channel);
    } else {
      // Create a new channel if the old one is unusable
      this.createChannel$().subscribe({
        next: (newChannel) => this.channels$.next(newChannel),
        error: (err) => this.logger.error(err, 'failed to create replacement channel'),
      });
    }
  }

  /**
   * Initialize the channel pool
   */
  private initializePool(): void {
    for (let i = 0; i < this.poolSize; i++) {
      this.createChannel$().subscribe({
        next: (channel) => {
          this.channels$.next(channel);
          this.logger.trace('channel %d added to pool', i + 1);
        },
        error: (err) => {
          this.logger.error(err, 'failed to create channel for pool');
        },
      });
    }
  }

  /**
   * Create a new channel
   */
  private createChannel$(): Observable<Channel> {
    return this.connectionFactory.getConnection$().pipe(
      switchMap((connection) => connection.createChannel()),
      tap((channel) => {
        channel.on('error', (err) => {
          this.logger.error(err, 'channel error');
        });

        channel.on('close', () => {
          this.logger.trace('channel closed');
        });
      }),
    );
  }

  /**
   * Close all channels in the pool
   */
  public async closeAll(): Promise<void> {
    this.channels$.complete();
    this.logger.debug('channel pool closed');
  }
}