import {
  Observable,
  combineLatest,
  merge,
  interval,
  throwError,
  of,
} from 'rxjs';
import {
  map,
  filter,
  scan,
  bufferTime,
  debounceTime,
  throttleTime,
  distinctUntilChanged,
  switchMap,
  catchError,
  timeout,
  tap,
  share,
  shareReplay,
  take,
} from 'rxjs/operators';
import { AmqpPubSub } from './amqp-pubsub';

/**
 * Advanced RxJS patterns for PubSub
 */
export class AdvancedPubSubPatterns {
  constructor(private pubsub: AmqpPubSub) {}

  /**
   * Pattern 1: Event Sourcing - Replay all events from a channel
   */
  replayEvents$<T>(channel: string, bufferSize = 100): Observable<T> {
    return this.pubsub.subscribe<T>(channel).pipe(
      shareReplay({
        bufferSize,
        refCount: true,
      }),
    );
  }

  /**
   * Pattern 2: Request-Response over PubSub
   */
  requestResponse$<TRequest, TResponse>(
    requestChannel: string,
    responseChannel: string,
    request: TRequest,
    timeoutMs = 5000,
  ): Observable<TResponse> {
    const correlationId = Math.random().toString(36);

    // Listen for response first
    const response$ = this.pubsub
      .subscribe<TResponse & { correlationId: string }>(responseChannel)
      .pipe(
        filter((msg) => msg.correlationId === correlationId),
        map((msg) => {
          const { correlationId, ...response } = msg;
          return response as TResponse;
        }),
        timeout(timeoutMs),
        take(1),
      );

    // Send request
    this.pubsub
      .publish(requestChannel, { ...request, correlationId })
      .subscribe();

    return response$;
  }

  /**
   * Pattern 3: Message Batching - Batch messages by time or count
   */
  batchMessages$<T>(
    channel: string,
    windowTime: number,
    maxBatchSize?: number,
  ): Observable<T[]> {
    let buffer: T[] = [];

    return this.pubsub.subscribe<T>(channel).pipe(
      tap((msg) => buffer.push(msg)),
      bufferTime(windowTime),
      filter((batch) => batch.length > 0),
      map((batch) => {
        if (maxBatchSize && batch.length > maxBatchSize) {
          return batch.slice(0, maxBatchSize);
        }
        return batch;
      }),
    );
  }

  /**
   * Pattern 4: Backpressure - Throttle or debounce incoming messages
   */
  withBackpressure$<T>(
    channel: string,
    strategy: 'throttle' | 'debounce',
    timeMs: number,
  ): Observable<T> {
    const stream$ = this.pubsub.subscribe<T>(channel);

    return strategy === 'throttle'
      ? stream$.pipe(throttleTime(timeMs))
      : stream$.pipe(debounceTime(timeMs));
  }

  /**
   * Pattern 5: Dead Letter Queue Handler
   */
  handleDLQ$<T>(
    dlqChannel: string,
    retryChannel: string,
    maxRetries = 3,
  ): Observable<T> {
    return this.pubsub.subscribe<T & { retryCount?: number }>(dlqChannel).pipe(
      tap((msg) => {
        const retryCount = (msg.retryCount || 0) + 1;
        
        if (retryCount < maxRetries) {
          this.pubsub
            .publish(retryChannel, { ...msg, retryCount })
            .subscribe();
        } else {
          console.error('Max retries exceeded for message:', msg);
        }
      }),
    );
  }

  /**
   * Pattern 6: Fan-out/Fan-in - Distribute work and aggregate results
   */
  fanOutFanIn$<TInput, TOutput>(
    inputChannel: string,
    workerChannels: string[],
    resultChannel: string,
    aggregateFn: (results: TOutput[]) => TOutput,
  ): Observable<TOutput> {
    // Fan-out: Distribute to workers
    this.pubsub.subscribe<TInput>(inputChannel).subscribe((task) => {
      workerChannels.forEach((channel) => {
        this.pubsub.publish(channel, task).subscribe();
      });
    });

    // Fan-in: Aggregate results
    const workerResults$ = workerChannels.map((channel) =>
      this.pubsub.subscribe<TOutput>(resultChannel),
    );

    return combineLatest(workerResults$).pipe(map(aggregateFn));
  }

  /**
   * Pattern 7: Circuit Breaker
   */
  withCircuitBreaker$<T>(
    channel: string,
    failureThreshold = 5,
    resetTimeout = 60000,
  ): Observable<T> {
    let failures = 0;
    let circuitOpen = false;
    let resetTimer: any;

    return this.pubsub.subscribe<T>(channel).pipe(
      tap({
        next: () => {
          failures = 0;
          if (circuitOpen) {
            console.log('Circuit breaker reset');
            circuitOpen = false;
          }
        },
        error: () => {
          failures++;
          if (failures >= failureThreshold && !circuitOpen) {
            console.log('Circuit breaker opened');
            circuitOpen = true;

            resetTimer = setTimeout(() => {
              console.log('Circuit breaker attempting reset');
              failures = 0;
              circuitOpen = false;
            }, resetTimeout);
          }
        },
      }),
      filter(() => !circuitOpen),
    );
  }

  /**
   * Pattern 8: Message Deduplication
   */
  deduplicate$<T extends { id: string }>(
    channel: string,
    windowTime = 5000,
  ): Observable<T> {
    return this.pubsub.subscribe<T>(channel).pipe(
      distinctUntilChanged((prev, curr) => prev.id === curr.id),
      share(),
    );
  }

  /**
   * Pattern 9: Priority Queue
   */
  priorityQueue$<T extends { priority: number }>(
    channel: string,
  ): Observable<T> {
    const buffer: T[] = [];
    const processInterval = 100;

    return merge(
      this.pubsub.subscribe<T>(channel).pipe(
        tap((msg) => {
          buffer.push(msg);
          buffer.sort((a, b) => b.priority - a.priority);
        }),
      ),
      interval(processInterval).pipe(
        filter(() => buffer.length > 0),
        map(() => buffer.shift()!),
      ),
    ).pipe(filter((msg) => msg !== undefined));
  }

  /**
   * Pattern 10: Saga Pattern - Coordinate distributed transactions
   */
  saga$<T>(
    steps: Array<{
      channel: string;
      action: (data: T) => Observable<T>;
      compensate: (data: T) => Observable<void>;
    }>,
    initialData: T,
  ): Observable<T> {
    const executedSteps: number[] = [];

    const executeStep = (data: T, stepIndex: number): Observable<T> => {
      if (stepIndex >= steps.length) {
        return of(data);
      }

      const step = steps[stepIndex];

      return step.action(data).pipe(
        tap(() => executedSteps.push(stepIndex)),
        switchMap((result) => executeStep(result, stepIndex + 1)),
        catchError((error) => {
          console.error(`Step ${stepIndex} failed, compensating...`);
          return this.compensate(steps, executedSteps, data).pipe(
            switchMap(() => throwError(() => error)),
          );
        }),
      );
    };

    return executeStep(initialData, 0);
  }

  private compensate<T>(
    steps: Array<{
      compensate: (data: T) => Observable<void>;
    }>,
    executedSteps: number[],
    data: T,
  ): Observable<void> {
    const compensations = executedSteps
      .reverse()
      .map((stepIndex) => steps[stepIndex].compensate(data));

    return merge(...compensations).pipe(
      catchError((err) => {
        console.error('Compensation failed:', err);
        return of(void 0);
      }),
      take(executedSteps.length),
      tap(() => console.log('Compensation complete')),
      map(() => void 0),
    );
  }

  /**
   * Pattern 11: Real-time Analytics
   */
  analytics$<T extends { timestamp: number; value: number }>(
    channel: string,
    windowSize = 60000, // 1 minute
  ): Observable<{
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
  }> {
    return this.pubsub.subscribe<T>(channel).pipe(
      bufferTime(windowSize),
      filter((buffer) => buffer.length > 0),
      map((messages) => ({
        count: messages.length,
        sum: messages.reduce((acc, m) => acc + m.value, 0),
        avg:
          messages.reduce((acc, m) => acc + m.value, 0) / messages.length,
        min: Math.min(...messages.map((m) => m.value)),
        max: Math.max(...messages.map((m) => m.value)),
      })),
    );
  }

  /**
   * Pattern 12: Stream Merging with Priorities
   */
  mergePrioritized$<T>(
    channels: Array<{ name: string; priority: number }>,
  ): Observable<T> {
    const streams = channels.map((ch) =>
      this.pubsub.subscribe<T>(ch.name).pipe(
        map((msg) => ({ msg, priority: ch.priority })),
      ),
    );

    return merge(...streams).pipe(
      scan((acc: any[], curr) => {
        acc.push(curr);
        acc.sort((a, b) => b.priority - a.priority);
        return acc.slice(0, 100); // Keep buffer limited
      }, []),
      filter((buffer) => buffer.length > 0),
      map((buffer) => buffer[0].msg),
    );
  }
}

/**
 * Usage Examples:
 */
export class PubSubExamples {
  constructor(private patterns: AdvancedPubSubPatterns) {}

  // Example 1: Request-Response
  async requestResponseExample() {
    const response$ = this.patterns.requestResponse$(
      'user-requests',
      'user-responses',
      { userId: '123', action: 'fetch' },
      5000,
    );

    response$.subscribe({
      next: (res) => console.log('Response:', res),
      error: (err) => console.error('Timeout or error:', err),
    });
  }

  // Example 2: Batch Processing
  batchProcessingExample() {
    this.patterns
      .batchMessages$('events', 5000, 100)
      .subscribe((batch) => {
        console.log(`Processing batch of ${batch.length} messages`);
        // Process batch...
      });
  }

  // Example 3: Circuit Breaker
  circuitBreakerExample() {
    this.patterns
      .withCircuitBreaker$('flaky-service', 5, 60000)
      .subscribe({
        next: (msg) => console.log('Message:', msg),
        error: (err) => console.error('Service unavailable:', err),
      });
  }

  // Example 4: Analytics Dashboard
  analyticsExample() {
    this.patterns
      .analytics$('metrics', 60000)
      .subscribe((stats) => {
        console.log('Analytics:', stats);
        // Update dashboard...
      });
  }

  // Example 5: Saga Pattern for Distributed Transaction
  sagaExample() {
    const bookingFlow = [
      {
        channel: 'reserve-flight',
        action: (data: any) => of({ ...data, flightReserved: true }),
        compensate: (data: any) => {
          console.log('Cancelling flight reservation');
          return of(void 0);
        },
      },
      {
        channel: 'reserve-hotel',
        action: (data: any) => of({ ...data, hotelReserved: true }),
        compensate: (data: any) => {
          console.log('Cancelling hotel reservation');
          return of(void 0);
        },
      },
      {
        channel: 'charge-payment',
        action: (data: any) => of({ ...data, paymentCharged: true }),
        compensate: (data: any) => {
          console.log('Refunding payment');
          return of(void 0);
        },
      },
    ];

    this.patterns.saga$(bookingFlow, { userId: '123' }).subscribe({
      next: (result) => console.log('Booking complete:', result),
      error: (err) => console.error('Booking failed, compensated:', err),
    });
  }
}