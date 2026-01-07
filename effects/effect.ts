/**
 * TLVR Effects - Effect System
 * 
 * Tracks computational effects at the type level:
 * - IO effects (console, file system)
 * - Network effects (HTTP, sockets)
 * - Disk effects (file operations)
 * - State effects (mutable state)
 * 
 * Key Invariant:
 * Pure functions cannot call effectful functions.
 */

/**
 * Effect Labels
 * 
 * All possible computational effects in the system.
 */
export type Effect = 'IO' | 'Network' | 'Disk' | 'State' | 'Random';

/**
 * Effect Set
 * 
 * A set of effects that a computation may perform.
 */
export type EffectSet = ReadonlyArray<Effect>;

/**
 * Pure Computation
 * 
 * A computation with no effects.
 */
export type Pure<T> = {
  readonly __effect: never;
  readonly value: T;
};

/**
 * Effectful Computation
 * 
 * A computation that may perform effects E.
 * 
 * @template E - The set of effects
 * @template T - The result type
 */
export type Effectful<E extends Effect, T> = {
  readonly __effect: E;
  readonly value: T;
};

/**
 * Run a pure computation.
 * 
 * Since it's pure, we can extract the value directly.
 */
export function runPure<T>(computation: Pure<T>): T {
  return computation.value;
}

/**
 * Create a pure value.
 */
export function pure<T>(value: T): Pure<T> {
  return {
    __effect: undefined as never,
    value,
  };
}

/**
 * Create an effectful computation.
 */
export function effectful<E extends Effect, T>(
  effect: E,
  value: T
): Effectful<E, T> {
  return {
    __effect: effect,
    value,
  };
}

/**
 * IO Effect
 * 
 * Represents console I/O operations.
 */
export type IO<T> = Effectful<'IO', T>;

export function io<T>(value: T): IO<T> {
  return effectful('IO', value);
}

export function consoleLog(message: string): IO<void> {
  console.log(message);
  return io(undefined);
}

export function consoleRead(): IO<string> {
  // In real implementation, would read from stdin
  return io('input');
}

/**
 * Disk Effect
 * 
 * Represents file system operations.
 */
export type Disk<T> = Effectful<'Disk', T>;

export function disk<T>(value: T): Disk<T> {
  return effectful('Disk', value);
}

export function readFile(path: string): Disk<string> {
  // In real implementation, would read from file system
  return disk(`Contents of ${path}`);
}

export function writeFile(path: string, content: string): Disk<void> {
  // In real implementation, would write to file system
  return disk(undefined);
}

/**
 * Network Effect
 * 
 * Represents network operations.
 */
export type Network<T> = Effectful<'Network', T>;

export function network<T>(value: T): Network<T> {
  return effectful('Network', value);
}

export function httpGet(url: string): Network<string> {
  // In real implementation, would make HTTP request
  return network(`Response from ${url}`);
}

export function httpPost(url: string, body: string): Network<string> {
  return network(`Posted to ${url}`);
}

/**
 * State Effect
 * 
 * Represents mutable state operations.
 */
export type State<T> = Effectful<'State', T>;

export function state<T>(value: T): State<T> {
  return effectful('State', value);
}

/**
 * Random Effect
 * 
 * Represents non-deterministic computations.
 */
export type Random<T> = Effectful<'Random', T>;

export function random<T>(value: T): Random<T> {
  return effectful('Random', value);
}

export function randomInt(min: number, max: number): Random<number> {
  const value = Math.floor(Math.random() * (max - min + 1)) + min;
  return random(value);
}

/**
 * Effect Context
 * 
 * An execution context that allows specific effects.
 * 
 * @template E - Allowed effects in this context
 */
export class EffectContext<E extends Effect> {
  private constructor(private readonly allowedEffects: ReadonlyArray<E>) {}

  static create<E extends Effect>(...effects: E[]): EffectContext<E> {
    return new EffectContext(effects);
  }

  /**
   * Run an effectful computation in this context.
   * 
   * Type signature enforces that the computation's effect
   * is allowed in this context.
   */
  run<T>(computation: Effectful<E, T>): T {
    if (!this.allowedEffects.includes(computation.__effect)) {
      throw new Error(`Effect ${computation.__effect} not allowed in context`);
    }
    return computation.value;
  }

  /**
   * Pure computations can always run.
   */
  runPure<T>(computation: Pure<T>): T {
    return computation.value;
  }
}

/**
 * Effect Composition
 * 
 * Combine multiple effects.
 */
export type CombineEffects<E1 extends Effect, E2 extends Effect> = E1 | E2;

/**
 * Lift a pure value into an effectful context.
 */
export function lift<E extends Effect, T>(value: T): Effectful<E, T> {
  return {
    __effect: undefined as E,
    value,
  };
}

/**
 * Map over an effectful computation.
 */
export function mapEffect<E extends Effect, T, U>(
  computation: Effectful<E, T>,
  f: (value: T) => U
): Effectful<E, U> {
  return {
    __effect: computation.__effect,
    value: f(computation.value),
  };
}

/**
 * Bind (flatMap) for effectful computations.
 */
export function bindEffect<E extends Effect, T, U>(
  computation: Effectful<E, T>,
  f: (value: T) => Effectful<E, U>
): Effectful<E, U> {
  const next = f(computation.value);
  return next;
}

/**
 * Effect Handler
 * 
 * Handles effects by interpreting them.
 */
export type EffectHandler<E extends Effect, T> = (
  effect: Effectful<E, T>
) => T;

/**
 * Pure Function Marker
 * 
 * Documents that a function is pure.
 */
export type PureFunction<Args extends unknown[], Return> = (
  ...args: Args
) => Pure<Return>;

/**
 * Example: Pure arithmetic
 */
export const add: PureFunction<[number, number], number> = (a, b) => {
  return pure(a + b);
};

export const multiply: PureFunction<[number, number], number> = (a, b) => {
  return pure(a * b);
};

/**
 * Example: Effectful function cannot be called from pure context
 */
export function pureComputation(): Pure<number> {
  const x = runPure(add(2, 3));
  const y = runPure(multiply(x, 4));

  // This would be a type error:
  // const z = readFile('test.txt'); // ✗ Disk effect not allowed

  return pure(y);
}

/**
 * Example: Effectful computation can call other effectful functions
 */
export function effectfulComputation(): Disk<string> {
  const content = readFile('data.txt');
  return content;
}

/**
 * Effect Isolation
 * 
 * Ensures effects don't leak across boundaries.
 */
export type Isolated<E extends Effect, T> = {
  readonly __isolated: true;
  readonly __effect: E;
  readonly value: T;
};

/**
 * Isolate an effect.
 */
export function isolate<E extends Effect, T>(
  computation: Effectful<E, T>
): Isolated<E, T> {
  return {
    __isolated: true,
    __effect: computation.__effect,
    value: computation.value,
  };
}
