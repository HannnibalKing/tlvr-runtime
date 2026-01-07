/**
 * TLVR Visualize - Type-Level Math and Units
 * 
 * Implements:
 * - Peano arithmetic for compile-time natural numbers
 * - Type-level comparison operators
 * - Branded units for dimensional safety
 */

/**
 * Peano Natural Numbers
 * 
 * Represents natural numbers at the type level.
 * Used for compile-time arithmetic and bounds checking.
 */
export type Nat = { readonly __nat: unique symbol };

/**
 * Zero
 */
export interface Zero extends Nat {
  readonly prev?: never;
}

/**
 * Successor
 * 
 * The successor of a natural number.
 */
export interface Succ<N extends Nat> extends Nat {
  readonly prev: N;
}

/**
 * Type-Level Numbers 0-10
 */
export type N0 = Zero;
export type N1 = Succ<N0>;
export type N2 = Succ<N1>;
export type N3 = Succ<N2>;
export type N4 = Succ<N3>;
export type N5 = Succ<N4>;
export type N6 = Succ<N5>;
export type N7 = Succ<N6>;
export type N8 = Succ<N7>;
export type N9 = Succ<N8>;
export type N10 = Succ<N9>;

/**
 * Addition
 * 
 * Add<A, B> = A + B
 */
export type Add<A extends Nat, B extends Nat> = A extends Zero
  ? B
  : A extends Succ<infer Prev>
  ? Succ<Add<Prev, B>>
  : never;

/**
 * Multiplication
 * 
 * Mult<A, B> = A × B
 */
export type Mult<A extends Nat, B extends Nat> = A extends Zero
  ? Zero
  : A extends Succ<infer Prev>
  ? Add<B, Mult<Prev, B>>
  : never;

/**
 * Less Than
 * 
 * LessThan<A, B> = A < B
 */
export type LessThan<A extends Nat, B extends Nat> = A extends Zero
  ? B extends Zero
    ? false
    : true
  : B extends Zero
  ? false
  : A extends Succ<infer PrevA>
  ? B extends Succ<infer PrevB>
    ? LessThan<PrevA, PrevB>
    : never
  : never;

/**
 * Less Than or Equal
 */
export type LessThanOrEqual<A extends Nat, B extends Nat> =
  | LessThan<A, B>
  | Equals<A, B>;

/**
 * Greater Than
 */
export type GreaterThan<A extends Nat, B extends Nat> = LessThan<B, A>;

/**
 * Type-Level Equality for Peano numbers
 */
type Equals<A extends Nat, B extends Nat> = A extends B
  ? B extends A
    ? true
    : false
  : false;

/**
 * Convert type-level number to value-level number
 */
export type ToNumber<N extends Nat> = N extends Zero
  ? 0
  : N extends Succ<infer Prev>
  ? ToNumber<Prev> extends infer P
    ? P extends number
      ? P extends 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
        ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10][P]
        : number
      : never
    : never
  : never;

/**
 * Bounded Array
 * 
 * An array with a maximum length enforced at the type level.
 */
export type BoundedArray<T, Max extends Nat, Length extends Nat = Zero> = {
  readonly __maxLength: Max;
  readonly __currentLength: Length;
  readonly items: T[];
};

/**
 * Create a bounded array.
 */
export function createBounded<T, Max extends Nat>(
  max: Max
): BoundedArray<T, Max, Zero> {
  return {
    __maxLength: max,
    __currentLength: 0 as unknown as Zero,
    items: [],
  };
}

/**
 * Push to bounded array (compile-time length check).
 */
export function pushBounded<T, Max extends Nat, Len extends Nat>(
  array: BoundedArray<T, Max, Len>,
  item: T
): LessThan<Succ<Len>, Max> extends true
  ? BoundedArray<T, Max, Succ<Len>>
  : never {
  return {
    __maxLength: array.__maxLength,
    __currentLength: undefined as unknown as Succ<Len>,
    items: [...array.items, item],
  } as LessThan<Succ<Len>, Max> extends true
    ? BoundedArray<T, Max, Succ<Len>>
    : never;
}

/**
 * Branded Units for Dimensional Safety
 * 
 * Prevents mixing incompatible units.
 */

/**
 * Base unit type
 */
export type Unit<Name extends string> = number & { readonly __unit: Name };

/**
 * Length units
 */
export type Meters = Unit<'m'>;
export type Kilometers = Unit<'km'>;
export type Feet = Unit<'ft'>;

/**
 * Time units
 */
export type Seconds = Unit<'s'>;
export type Minutes = Unit<'min'>;
export type Hours = Unit<'h'>;

/**
 * Derived units
 */
export type Velocity = Unit<'m/s'>;
export type Acceleration = Unit<'m/s²'>;

/**
 * Create a value with a unit.
 */
export function meters(value: number): Meters {
  return value as Meters;
}

export function kilometers(value: number): Kilometers {
  return value as Kilometers;
}

export function seconds(value: number): Seconds {
  return value as Seconds;
}

export function minutes(value: number): Minutes {
  return value as Minutes;
}

/**
 * Unit conversion (explicit)
 */
export function metersToKilometers(m: Meters): Kilometers {
  return (m / 1000) as Kilometers;
}

export function kilometersToMeters(km: Kilometers): Meters {
  return (km * 1000) as Meters;
}

export function minutesToSeconds(min: Minutes): Seconds {
  return (min * 60) as Seconds;
}

/**
 * Dimensional arithmetic
 * 
 * Velocity = Distance / Time
 */
export function velocity(distance: Meters, time: Seconds): Velocity {
  return (distance / time) as Velocity;
}

/**
 * This would be a compile error:
 * ```ts
 * const x: Meters = 100 as Meters;
 * const y: Seconds = 10 as Seconds;
 * const z: Meters = x + y; // ✗ Type error - cannot add meters and seconds
 * ```
 */

/**
 * Safe operations on same units
 */
export function addMeters(a: Meters, b: Meters): Meters {
  return (a + b) as Meters;
}

export function subtractMeters(a: Meters, b: Meters): Meters {
  return (a - b) as Meters;
}

/**
 * Refined Types with Constraints
 */

/**
 * Positive number
 */
export type Positive = number & { readonly __positive: true };

export function positive(n: number): Positive | never {
  if (n <= 0) {
    throw new Error('Number must be positive');
  }
  return n as Positive;
}

/**
 * Non-negative number
 */
export type NonNegative = number & { readonly __nonNegative: true };

export function nonNegative(n: number): NonNegative | never {
  if (n < 0) {
    throw new Error('Number must be non-negative');
  }
  return n as NonNegative;
}

/**
 * Range-bounded number
 */
export type InRange<Min extends number, Max extends number> = number & {
  readonly __min: Min;
  readonly __max: Max;
};

export function inRange<Min extends number, Max extends number>(
  n: number,
  min: Min,
  max: Max
): InRange<Min, Max> | never {
  if (n < min || n > max) {
    throw new Error(`Number must be between ${min} and ${max}`);
  }
  return n as InRange<Min, Max>;
}

/**
 * Non-empty string
 */
export type NonEmptyString = string & { readonly __nonEmpty: true };

export function nonEmptyString(s: string): NonEmptyString | never {
  if (s.length === 0) {
    throw new Error('String must not be empty');
  }
  return s as NonEmptyString;
}
