/**
 * TLVR Core - Handle System
 * 
 * Runtime handles that are wrapped by type-level state machines.
 * Handles represent actual runtime resources (files, connections, etc.)
 * but their safety is enforced at the type level.
 */

import { Brand } from './phantom';

/**
 * Opaque Handle
 * 
 * Represents a runtime resource handle.
 * The actual implementation is hidden; only type-safe wrappers can access it.
 */
export type Handle<ResourceType extends string> = Brand<
  symbol,
  `Handle<${ResourceType}>`
>;

/**
 * Create a new handle (internal use only)
 * 
 * SAFETY: Handles should only be created by verified constructors.
 */
export function createHandle<ResourceType extends string>(
  resourceType: ResourceType
): Handle<ResourceType> {
  return Symbol(`${resourceType}-handle`) as Handle<ResourceType>;
}

/**
 * Handle Registry
 * 
 * Maps handles to actual runtime resources.
 * This is the only place where runtime state lives.
 */
class HandleRegistry {
  private readonly resources = new Map<symbol, unknown>();

  set<T>(handle: Handle<string>, resource: T): void {
    this.resources.set(handle as symbol, resource);
  }

  get<T>(handle: Handle<string>): T | undefined {
    return this.resources.get(handle as symbol) as T | undefined;
  }

  delete(handle: Handle<string>): boolean {
    return this.resources.delete(handle as symbol);
  }

  has(handle: Handle<string>): boolean {
    return this.resources.has(handle as symbol);
  }
}

/**
 * Global handle registry
 * 
 * In a real system, this would be managed per-context or per-thread.
 */
export const registry = new HandleRegistry();

/**
 * Resource Finalizer
 * 
 * Cleanup function for a resource.
 */
export type Finalizer = () => void;

/**
 * Finalization Registry
 * 
 * Tracks cleanup functions for resources.
 */
class FinalizerRegistry {
  private readonly finalizers = new Map<symbol, Finalizer>();

  register(handle: Handle<string>, finalizer: Finalizer): void {
    this.finalizers.set(handle as symbol, finalizer);
  }

  finalize(handle: Handle<string>): void {
    const finalizer = this.finalizers.get(handle as symbol);
    if (finalizer) {
      finalizer();
      this.finalizers.delete(handle as symbol);
    }
  }

  has(handle: Handle<string>): boolean {
    return this.finalizers.has(handle as symbol);
  }
}

export const finalizers = new FinalizerRegistry();
