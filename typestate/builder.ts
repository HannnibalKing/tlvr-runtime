/**
 * TLVR Typestate - Builder Pattern
 * 
 * Demonstrates typestate-based builder pattern where:
 * - Required fields must be set before building
 * - Optional fields can be set in any order
 * - Cannot build an incomplete object
 */

/**
 * Builder States
 * 
 * Tracks which required fields have been set.
 */
type BuilderState = {
  hasName: boolean;
  hasAge: boolean;
};

/**
 * Person Data
 */
type PersonData = {
  name: string;
  age: number;
  email?: string;
  phone?: string;
};

/**
 * Typestate Builder
 * 
 * Type parameter S encodes which fields have been set.
 * 
 * Example:
 * ```ts
 * const person = PersonBuilder.create()
 *   .setName('Alice')    // now has name
 *   .setAge(30)          // now has age
 *   .setEmail('a@b.c')   // optional
 *   .build();            // ✓ Can build - all required fields set
 * 
 * PersonBuilder.create()
 *   .setName('Bob')
 *   .build();            // ✗ Type error - age not set
 * ```
 */
export class PersonBuilder<S extends BuilderState> {
  private constructor(private readonly data: Partial<PersonData>) {}

  static create(): PersonBuilder<{ hasName: false; hasAge: false }> {
    return new PersonBuilder({});
  }

  setName(
    this: PersonBuilder<S>,
    name: string
  ): PersonBuilder<S & { hasName: true }> {
    return new PersonBuilder({ ...this.data, name }) as PersonBuilder<
      S & { hasName: true }
    >;
  }

  setAge(
    this: PersonBuilder<S>,
    age: number
  ): PersonBuilder<S & { hasAge: true }> {
    return new PersonBuilder({ ...this.data, age }) as PersonBuilder<
      S & { hasAge: true }
    >;
  }

  setEmail(this: PersonBuilder<S>, email: string): PersonBuilder<S> {
    return new PersonBuilder({ ...this.data, email }) as PersonBuilder<S>;
  }

  setPhone(this: PersonBuilder<S>, phone: string): PersonBuilder<S> {
    return new PersonBuilder({ ...this.data, phone }) as PersonBuilder<S>;
  }

  /**
   * Build can only be called when all required fields are set.
   * 
   * Type constraint enforces S extends { hasName: true; hasAge: true }
   */
  build(
    this: PersonBuilder<{ hasName: true; hasAge: true }>
  ): PersonData {
    return this.data as PersonData;
  }
}
