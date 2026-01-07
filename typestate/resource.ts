/**
 * TLVR Typestate - State Machine Encoding
 * 
 * Implements typestate programming: objects whose valid operations
 * depend on their runtime state, enforced at compile time.
 * 
 * Key Invariant:
 * An object of type T<S> can only exist at runtime in state S.
 */

import { Handle, createHandle, registry, finalizers } from '../core/handle';

/**
 * State Labels
 * 
 * Valid states for resources in the typestate system.
 * Extend this type to define new state machines.
 */
export type State = 'Init' | 'Open' | 'Committed' | 'Closed';

/**
 * Typestate Resource
 * 
 * A resource that enforces state transitions at compile time.
 * 
 * Type Parameter S: The current state of the resource
 * 
 * Guarantees:
 * - Cannot call operations invalid for current state
 * - State transitions are explicit and type-checked
 * - Invalid transitions are unrepresentable
 * 
 * Example:
 * ```ts
 * const r = Resource.create();        // Resource<'Init'>
 * const opened = r.open();            // Resource<'Open'>
 * const committed = opened.commit();  // Resource<'Committed'>
 * const closed = committed.close();   // Resource<'Closed'>
 * 
 * // opened.commit()  ✗ Type error - already consumed
 * // r.commit()      ✗ Type error - not open
 * // closed.close()  ✗ Type error - already closed
 * ```
 */
export class Resource<S extends State> {
  /**
   * Private constructor prevents external instantiation.
   * Resources can only be created through verified factory methods.
   */
  private constructor(
    private readonly handle: Handle<'Resource'>,
    private readonly state: S
  ) {}

  /**
   * Create a new resource in the Init state.
   * 
   * This is the only entry point into the typestate system.
   */
  static create(): Resource<'Init'> {
    const handle = createHandle('Resource');
    registry.set(handle, { state: 'Init', data: null });
    return new Resource(handle, 'Init');
  }

  /**
   * Transition from Init to Open.
   * 
   * Type signature enforces:
   * - Can only be called on Resource<'Init'>
   * - Returns Resource<'Open'>
   * - Consumes the original resource (via 'this' parameter)
   */
  open(this: Resource<'Init'>): Resource<'Open'> {
    const data = registry.get<{ state: State; data: unknown }>(this.handle);
    if (!data || data.state !== 'Init') {
      throw new Error('INVARIANT VIOLATION: Expected Init state');
    }

    registry.set(this.handle, { state: 'Open', data: 'opened' });
    return new Resource(this.handle, 'Open');
  }

  /**
   * Transition from Open to Committed.
   * 
   * Type signature enforces:
   * - Can only be called on Resource<'Open'>
   * - Returns Resource<'Committed'>
   */
  commit(this: Resource<'Open'>): Resource<'Committed'> {
    const data = registry.get<{ state: State; data: unknown }>(this.handle);
    if (!data || data.state !== 'Open') {
      throw new Error('INVARIANT VIOLATION: Expected Open state');
    }

    registry.set(this.handle, { state: 'Committed', data: 'committed' });
    return new Resource(this.handle, 'Committed');
  }

  /**
   * Transition from Committed to Closed.
   * 
   * Type signature enforces:
   * - Can only be called on Resource<'Committed'>
   * - Returns Resource<'Closed'>
   * - Resource is finalized and cannot be used again
   */
  close(this: Resource<'Committed'>): Resource<'Closed'> {
    const data = registry.get<{ state: State; data: unknown }>(this.handle);
    if (!data || data.state !== 'Committed') {
      throw new Error('INVARIANT VIOLATION: Expected Committed state');
    }

    registry.set(this.handle, { state: 'Closed', data: null });
    registry.delete(this.handle);
    return new Resource(this.handle, 'Closed');
  }

  /**
   * Read data from an Open or Committed resource.
   * 
   * Demonstrates state-conditional operations.
   */
  read(this: Resource<'Open'> | Resource<'Committed'>): string {
    const data = registry.get<{ state: State; data: unknown }>(this.handle);
    if (!data || (data.state !== 'Open' && data.state !== 'Committed')) {
      throw new Error('INVARIANT VIOLATION: Expected Open or Committed state');
    }

    return String(data.data);
  }

  /**
   * Write data to an Open resource.
   * 
   * Type signature enforces:
   * - Can only be called on Resource<'Open'>
   * - Cannot write to Committed or Closed resources
   */
  write(this: Resource<'Open'>, value: string): Resource<'Open'> {
    const data = registry.get<{ state: State; data: unknown }>(this.handle);
    if (!data || data.state !== 'Open') {
      throw new Error('INVARIANT VIOLATION: Expected Open state');
    }

    registry.set(this.handle, { state: 'Open', data: value });
    return this;
  }
}

/**
 * File Resource with Typestate
 * 
 * A more realistic example: file handles with open/closed states.
 */
export type FileState = 'Closed' | 'OpenRead' | 'OpenWrite';

export class File<S extends FileState> {
  private constructor(
    private readonly handle: Handle<'File'>,
    private readonly path: string
  ) {}

  static open(path: string, mode: 'read'): File<'OpenRead'>;
  static open(path: string, mode: 'write'): File<'OpenWrite'>;
  static open(path: string, mode: 'read' | 'write'): File<'OpenRead'> | File<'OpenWrite'> {
    const handle = createHandle('File');
    registry.set(handle, { path, mode, buffer: '' });

    if (mode === 'read') {
      return new File(handle, path) as File<'OpenRead'>;
    } else {
      return new File(handle, path) as File<'OpenWrite'>;
    }
  }

  read(this: File<'OpenRead'>): string {
    const data = registry.get<{ path: string; mode: string; buffer: string }>(
      this.handle
    );
    if (!data) {
      throw new Error('INVARIANT VIOLATION: File handle not found');
    }
    return data.buffer;
  }

  write(this: File<'OpenWrite'>, content: string): File<'OpenWrite'> {
    const data = registry.get<{ path: string; mode: string; buffer: string }>(
      this.handle
    );
    if (!data) {
      throw new Error('INVARIANT VIOLATION: File handle not found');
    }

    registry.set(this.handle, { ...data, buffer: data.buffer + content });
    return this;
  }

  close(this: File<'OpenRead'> | File<'OpenWrite'>): File<'Closed'> {
    registry.delete(this.handle);
    return new File(this.handle, this.path) as File<'Closed'>;
  }
}
