/**
 * TLVR Core - Type-Level Primitives
 * 
 * Foundational type utilities for the Type-Level Verified Runtime.
 * These primitives enable phantom types, branding, and compile-time invariants.
 */

/**
 * Phantom Type Marker
 * 
 * Creates a unique nominal type that exists only at compile time.
 * Used to attach compile-time metadata to values without runtime overhead.
 * 
 * @example
 * type OpenState = Phantom<'Open'>;
 * type ClosedState = Phantom<'Closed'>;
 */
export type Phantom<T extends string | symbol> = {
  readonly __phantom: T;
};

/**
 * Branded Type
 * 
 * Attaches a unique brand to a base type, preventing accidental mixing.
 * The brand exists only at compile time and has zero runtime cost.
 * 
 * @example
 * type UserId = Brand<number, 'UserId'>;
 * type ProductId = Brand<number, 'ProductId'>;
 * // UserId and ProductId are incompatible despite both being numbers
 */
export type Brand<Base, BrandName extends string | symbol> = Base & {
  readonly __brand: BrandName;
};

/**
 * Create a branded value
 * 
 * SAFETY: This function performs an unchecked cast.
 * Use only at system boundaries where invariants are verified.
 */
export function brand<Base, BrandName extends string | symbol>(
  value: Base
): Brand<Base, BrandName> {
  return value as Brand<Base, BrandName>;
}

/**
 * Extract the underlying value from a branded type
 */
export function unbrand<Base, BrandName extends string | symbol>(
  value: Brand<Base, BrandName>
): Base {
  return value as Base;
}

/**
 * Nominal Type Constructor
 * 
 * Creates a type that is structurally identical to Base but nominally distinct.
 * More explicit than branding for representing domain concepts.
 */
export type Nominal<Base, Name extends string> = Base & {
  readonly __nominal: Name;
};

/**
 * Impossible Type
 * 
 * Represents a type that should never be inhabited.
 * Used in exhaustiveness checking and proof-carrying types.
 */
export type Never = never;

/**
 * Refinement Type Helper
 * 
 * Attaches a compile-time predicate to a type.
 * The predicate is not checked at runtime - it's a promise.
 */
export type Refined<T, Predicate extends string> = T & {
  readonly __refinement: Predicate;
};

/**
 * Const Assertion Helper
 * 
 * Forces a value to be treated as a literal type.
 */
export type Const<T> = T extends infer U ? U : never;

/**
 * Mutable to Readonly (Deep)
 * 
 * Makes all properties readonly recursively.
 */
export type DeepReadonly<T> = T extends Primitive
  ? T
  : T extends (infer U)[]
  ? ReadonlyArray<DeepReadonly<U>>
  : T extends Map<infer K, infer V>
  ? ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>>
  : T extends Set<infer U>
  ? ReadonlySet<DeepReadonly<U>>
  : { readonly [K in keyof T]: DeepReadonly<T[K]> };

type Primitive = string | number | boolean | symbol | bigint | null | undefined;

/**
 * Proof Carrier
 * 
 * A type that carries a compile-time proof of some property.
 * The proof is erased at runtime.
 */
export type Proof<Property extends string> = {
  readonly __proof: Property;
};

/**
 * Singleton Type
 * 
 * Represents a type inhabited by exactly one value.
 */
export type Singleton<T extends string | number | symbol> = {
  readonly __singleton: T;
};

/**
 * Type-Level Equality
 */
export type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <
  T
>() => T extends Y ? 1 : 2
  ? true
  : false;

/**
 * Type-Level Assert
 * 
 * Fails compilation if the condition is not true.
 */
export type Assert<T extends true> = T;

/**
 * Compile-Time Check
 */
export type Check<T extends boolean> = T extends true ? true : never;

/**
 * Invariant Marker
 * 
 * Documents an invariant that must hold for soundness.
 * Violations are programmer errors.
 */
export type Invariant<Description extends string> = {
  readonly __invariant: Description;
};
