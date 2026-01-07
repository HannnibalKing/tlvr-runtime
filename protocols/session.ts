/**
 * TLVR Protocols - Session Types and Protocol Verification
 * 
 * Implements session types to verify communication protocols at compile time.
 * 
 * Key Invariant:
 * Protocol steps must be followed in order. Skipping steps or
 * performing operations in the wrong state is a compile error.
 */

import { Handle, createHandle, registry } from '../core/handle';

/**
 * Client States
 * 
 * Valid states for a client connection.
 */
export type ClientState = 'Disconnected' | 'Connected' | 'Authenticated' | 'Closed';

/**
 * Client Protocol
 * 
 * Type-safe client that enforces protocol ordering:
 * 1. Must connect before authenticating
 * 2. Must authenticate before sending messages
 * 3. Cannot send after closing
 * 
 * Example:
 * ```ts
 * const client = Client.create();
 * const connected = client.connect('server.com');
 * const authenticated = connected.authenticate('user', 'pass');
 * authenticated.send({ type: 'MESSAGE', data: 'Hello' });
 * authenticated.close();
 * 
 * // client.authenticate()  ✗ Type error - not connected
 * // connected.send()       ✗ Type error - not authenticated
 * // authenticated.connect() ✗ Type error - method doesn't exist
 * ```
 */
export class Client<S extends ClientState> {
  private constructor(
    private readonly handle: Handle<'Client'>,
    private readonly state: S
  ) {}

  /**
   * Create a disconnected client.
   */
  static create(): Client<'Disconnected'> {
    const handle = createHandle('Client');
    registry.set(handle, { state: 'Disconnected', server: null });
    return new Client(handle, 'Disconnected');
  }

  /**
   * Connect to a server.
   * 
   * Can only be called on a disconnected client.
   */
  connect(this: Client<'Disconnected'>, server: string): Client<'Connected'> {
    registry.set(this.handle, { state: 'Connected', server });
    return new Client(this.handle, 'Connected');
  }

  /**
   * Authenticate with the server.
   * 
   * Can only be called on a connected client.
   */
  authenticate(
    this: Client<'Connected'>,
    username: string,
    password: string
  ): Client<'Authenticated'> {
    const data = registry.get<{ state: ClientState; server: string | null }>(
      this.handle
    );
    if (!data || data.state !== 'Connected') {
      throw new Error('INVARIANT VIOLATION: Expected Connected state');
    }

    registry.set(this.handle, { state: 'Authenticated', server: data.server });
    return new Client(this.handle, 'Authenticated');
  }

  /**
   * Send a message.
   * 
   * Can only be called on an authenticated client.
   */
  send(this: Client<'Authenticated'>, message: Message): void {
    const data = registry.get<{ state: ClientState; server: string | null }>(
      this.handle
    );
    if (!data || data.state !== 'Authenticated') {
      throw new Error('INVARIANT VIOLATION: Expected Authenticated state');
    }

    console.log(`Sending message:`, message);
  }

  /**
   * Receive a message.
   * 
   * Can only be called on an authenticated client.
   */
  receive(this: Client<'Authenticated'>): Message {
    return { type: 'MESSAGE', data: 'received' };
  }

  /**
   * Close the connection.
   * 
   * Can be called from any state except Closed.
   */
  close(
    this: Client<'Connected'> | Client<'Authenticated'>
  ): Client<'Closed'> {
    registry.delete(this.handle);
    return new Client(this.handle, 'Closed');
  }
}

/**
 * Message Type
 */
export type Message = {
  type: 'MESSAGE' | 'COMMAND' | 'RESPONSE';
  data: string;
};

/**
 * Server States
 */
export type ServerState = 'Stopped' | 'Running' | 'Accepting' | 'Closed';

/**
 * Server Protocol
 * 
 * Enforces server lifecycle:
 * 1. Must start before accepting connections
 * 2. Must be accepting before handling clients
 * 3. Must stop gracefully
 */
export class Server<S extends ServerState> {
  private constructor(
    private readonly handle: Handle<'Server'>,
    private readonly state: S
  ) {}

  static create(): Server<'Stopped'> {
    const handle = createHandle('Server');
    registry.set(handle, { state: 'Stopped', port: null });
    return new Server(handle, 'Stopped');
  }

  start(this: Server<'Stopped'>, port: number): Server<'Running'> {
    registry.set(this.handle, { state: 'Running', port });
    return new Server(this.handle, 'Running');
  }

  acceptConnections(this: Server<'Running'>): Server<'Accepting'> {
    registry.set(this.handle, {
      state: 'Accepting',
      port: registry.get<{ state: ServerState; port: number | null }>(this.handle)?.port,
    });
    return new Server(this.handle, 'Accepting');
  }

  handleClient(this: Server<'Accepting'>, clientId: string): void {
    console.log(`Handling client: ${clientId}`);
  }

  stop(this: Server<'Running'> | Server<'Accepting'>): Server<'Stopped'> {
    registry.set(this.handle, { state: 'Stopped', port: null });
    return new Server(this.handle, 'Stopped');
  }

  close(this: Server<'Stopped'>): Server<'Closed'> {
    registry.delete(this.handle);
    return new Server(this.handle, 'Closed');
  }
}

/**
 * Transaction Protocol
 * 
 * Enforces transaction semantics:
 * 1. Begin transaction
 * 2. Perform operations
 * 3. Commit or rollback
 */
export type TxState = 'Idle' | 'Active' | 'Committed' | 'RolledBack';

export class Transaction<S extends TxState> {
  private constructor(
    private readonly handle: Handle<'Transaction'>,
    private readonly state: S
  ) {}

  static begin(): Transaction<'Active'> {
    const handle = createHandle('Transaction');
    registry.set(handle, { state: 'Active', operations: [] });
    return new Transaction(handle, 'Active');
  }

  execute(this: Transaction<'Active'>, operation: string): Transaction<'Active'> {
    const data = registry.get<{ state: TxState; operations: string[] }>(this.handle);
    if (!data) {
      throw new Error('INVARIANT VIOLATION: Transaction not found');
    }

    registry.set(this.handle, {
      state: 'Active',
      operations: [...data.operations, operation],
    });

    return this;
  }

  commit(this: Transaction<'Active'>): Transaction<'Committed'> {
    registry.set(this.handle, {
      state: 'Committed',
      operations: registry.get<{ state: TxState; operations: string[] }>(this.handle)?.operations,
    });
    return new Transaction(this.handle, 'Committed');
  }

  rollback(this: Transaction<'Active'>): Transaction<'RolledBack'> {
    registry.set(this.handle, {
      state: 'RolledBack',
      operations: [],
    });
    return new Transaction(this.handle, 'RolledBack');
  }
}

/**
 * Request-Response Protocol
 * 
 * Enforces request-response ordering.
 */
export type ReqRespState = 'Ready' | 'Sent' | 'Received';

export class RequestResponse<S extends ReqRespState> {
  private constructor(private readonly state: S) {}

  static create(): RequestResponse<'Ready'> {
    return new RequestResponse('Ready');
  }

  sendRequest(this: RequestResponse<'Ready'>, request: string): RequestResponse<'Sent'> {
    console.log(`Sending request: ${request}`);
    return new RequestResponse('Sent');
  }

  receiveResponse(this: RequestResponse<'Sent'>): [string, RequestResponse<'Received'>] {
    const response = 'Response data';
    return [response, new RequestResponse('Received')];
  }

  reset(this: RequestResponse<'Received'>): RequestResponse<'Ready'> {
    return new RequestResponse('Ready');
  }
}
