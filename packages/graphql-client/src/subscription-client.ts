import { SubscriptionClient } from 'subscriptions-transport-ws';

/** The private surface of SubscriptionClient that terminate() has to reach. */
interface SubscriptionClientInternals {
  client: unknown | null;
  reconnecting: boolean;
  closedByUser: boolean;
  unsentMessagesQueue: unknown[];
  clearTryReconnectTimeout(): void;
  clearMaxConnectTimeout(): void;
  clearCheckConnectionInterval(): void;
  clearInactivityTimeout(): void;
}

/**
 * subscriptions-transport-ws's SubscriptionClient plus the one operation it
 * lacks: a stop that works in EVERY state.
 *
 * `close(true, true)` only acts while a socket object exists. Between two
 * reconnect attempts the socket field is null, so it returns early and the
 * armed reconnect timer fires anyway — a consumer calling it straight from an
 * operation error (socket still there) is fine; one calling it a moment
 * later (from an effect, after a dispatch, on the next tick) is not, and the
 * dead session keeps re-handshaking. terminate() covers both states.
 *
 * It also settles the operations still pending at that moment. A forced
 * close drops them silently — their observers never hear anything again —
 * and the connection-level rejection reaches the client BEFORE the
 * per-operation errors, so a consumer reacting to the FIRST operation's
 * error would otherwise strand every other one. With a `reason` they error
 * with it; without one they complete, which is what "closed by the user"
 * means to an observer.
 */
export class ManagedSubscriptionClient extends SubscriptionClient {
  terminate(reason?: Error): void {
    const internals = this as unknown as SubscriptionClientInternals;
    // Detach the pending operations FIRST: close() → unsubscribeAll() would
    // delete them without a word.
    const pending = Object.values(this.operations);
    this.operations = {};

    // Live or connecting socket: the forced close does the whole job.
    this.close(true, true);
    // No socket (between reconnect attempts): close() returned early, so
    // disarm what it would have.
    internals.clearTryReconnectTimeout();
    internals.clearMaxConnectTimeout();
    internals.clearCheckConnectionInterval();
    internals.clearInactivityTimeout();
    internals.reconnecting = false;
    internals.closedByUser = true;
    // GQL_START messages queued for the next connect would revive them.
    internals.unsentMessagesQueue = [];

    // Settle after the teardown, so a handler that subscribes again right
    // away starts a fresh, lazy connect that this close cannot race.
    for (const { handler } of pending) {
      if (reason) {
        handler([reason], null);
      } else {
        handler(null, null);
      }
    }
  }
}
