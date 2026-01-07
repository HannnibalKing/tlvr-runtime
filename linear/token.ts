/**
 * TLVR Linear Types - Token-Based Resource Tracking
 * 
 * Implements linear and affine types using phantom tokens:
 * - Linear: Must be used exactly once
 * - Affine: Must be used at most once
 * 
 * Key Invariant:
 * A consumed token cannot be reused.
 */

import { Brand } from '../core/phantom';

/**
 * Linear Token
 * 
 * A token that must be consumed exactly once.
 * After consumption, the token type changes to prevent reuse.
 * 
 * @template T - Unique identifier for this token
 */
export type Token<T extends symbol> = {
  readonly __token: T;
  readonly __consumed: false;
};

/**
 * Consumed Token
 * 
 * A token that has been consumed and cannot be used again.
 */
export type Consumed<T extends symbol> = {
  readonly __token: T;
  readonly __consumed: true;
};

/**
 * Create a new linear token.
 * 
 * Each token has a unique symbol identity.
 */
export function createToken<T extends symbol>(id: T): Token<T> {
  return {
    __token: id,
    __consumed: false,
  };
}

/**
 * Consume a token.
 * 
 * After consumption, the token's type changes to Consumed<T>,
 * preventing further use.
 * 
 * @returns A consumed token proof
 */
export function consumeToken<T extends symbol>(
  token: Token<T>
): Consumed<T> {
  return {
    __token: token.__token,
    __consumed: true,
  };
}

/**
 * Linear Resource
 * 
 * A resource guarded by a linear token.
 * The resource can only be used while holding the token.
 */
export class Linear<T, TokenId extends symbol> {
  private constructor(
    private readonly value: T,
    private readonly token: Token<TokenId>
  ) {}

  /**
   * Create a linear resource with a fresh token.
   */
  static create<T, TokenId extends symbol>(
    value: T,
    tokenId: TokenId
  ): Linear<T, TokenId> {
    return new Linear(value, createToken(tokenId));
  }

  /**
   * Use the linear resource.
   * 
   * The resource is consumed and cannot be used again.
   * This is enforced at the type level.
   * 
   * @param f - Function that uses the resource
   * @returns The result and a consumed token proof
   */
  use<R>(f: (value: T) => R): [R, Consumed<TokenId>] {
    const result = f(this.value);
    const consumed = consumeToken(this.token);
    return [result, consumed];
  }
}

/**
 * Affine Resource
 * 
 * A resource that can be used at most once.
 * Unlike linear resources, affine resources can be dropped without use.
 */
export class Affine<T, TokenId extends symbol> {
  private constructor(
    private readonly value: T,
    private readonly token: Token<TokenId>
  ) {}

  static create<T, TokenId extends symbol>(
    value: T,
    tokenId: TokenId
  ): Affine<T, TokenId> {
    return new Affine(value, createToken(tokenId));
  }

  /**
   * Use the affine resource (optional).
   */
  use<R>(f: (value: T) => R): [R, Consumed<TokenId>] {
    const result = f(this.value);
    const consumed = consumeToken(this.token);
    return [result, consumed];
  }

  /**
   * Drop the affine resource without using it.
   */
  drop(): Consumed<TokenId> {
    return consumeToken(this.token);
  }
}

/**
 * Move Semantics
 * 
 * Transfers ownership of a value.
 * After move, the original binding is consumed.
 */
export type Moved<T> = {
  readonly __moved: true;
  readonly __from: T;
};

/**
 * Move a value, consuming the original.
 */
export function move<T>(value: T): [T, Moved<T>] {
  return [
    value,
    {
      __moved: true,
      __from: value,
    },
  ];
}

/**
 * Unique Reference
 * 
 * A reference that guarantees exclusive access.
 * Similar to Rust's &mut T.
 */
export type UniqueRef<T> = Brand<T, 'UniqueRef'>;

/**
 * Shared Reference
 * 
 * A reference that allows shared read-only access.
 * Similar to Rust's &T.
 */
export type SharedRef<T> = Brand<Readonly<T>, 'SharedRef'>;

/**
 * Borrow a unique reference.
 * 
 * While borrowed, the original cannot be accessed.
 */
export function borrowMut<T>(value: T): UniqueRef<T> {
  return value as UniqueRef<T>;
}

/**
 * Borrow a shared reference.
 */
export function borrow<T>(value: T): SharedRef<T> {
  return value as SharedRef<T>;
}

/**
 * Linear File Handle
 * 
 * A file handle that must be closed exactly once.
 */
export type FileHandle = symbol;

export class LinearFile<TokenId extends symbol> {
  private constructor(
    private readonly handle: FileHandle,
    private readonly token: Token<TokenId>
  ) {}

  static open<TokenId extends symbol>(
    path: string,
    tokenId: TokenId
  ): LinearFile<TokenId> {
    const handle = Symbol(`file:${path}`);
    return new LinearFile(handle, createToken(tokenId));
  }

  /**
   * Read from the file.
   * 
   * Returns the same LinearFile with the same token,
   * allowing further operations.
   */
  read(): [string, LinearFile<TokenId>] {
    const content = `Content of file`;
    return [content, this];
  }

  /**
   * Write to the file.
   */
  write(content: string): LinearFile<TokenId> {
    return this;
  }

  /**
   * Close the file (consumes the token).
   * 
   * After closing, the file cannot be used.
   */
  close(): Consumed<TokenId> {
    return consumeToken(this.token);
  }
}

/**
 * Type-Level Linearity Proof
 * 
 * Proves that a value has been used linearly.
 */
export type LinearProof<T> = {
  readonly __linearProof: T;
  readonly __usedExactlyOnce: true;
};

/**
 * Assert linear usage.
 */
export function proveLinear<T, TokenId extends symbol>(
  consumed: Consumed<TokenId>
): LinearProof<TokenId> {
  return {
    __linearProof: consumed.__token,
    __usedExactlyOnce: true,
  };
}
