# TLVR: Type-Level Verified Runtime in TypeScript

> "If something can compile but fail at runtime, the system has failed." — TLVR Mission

TLVR is a research-grade TypeScript framework that encodes typestate, linear resource usage, protocol sequencing, and effect isolation at the type level. Illegal runtime states are unrepresentable: programs that violate invariants do not compile.

## 1. Mission and Laws

- **Mission**: Build a runtime where illegal states are unrepresentable; runtime errors arising from misuse are impossible to express in well-typed code.
- **Core Laws**:
  - **Compile-Time Supremacy**: Correctness is enforced before execution; runtime checks only at boundaries.
  - **State Machine Soundness**: Every runtime object has an explicit type-level state; transitions are explicit, verified, and irreversible unless encoded.
  - **Zero Runtime Overhead**: Type-level verification erases at runtime; no reflection or runtime tagging.

## 2. System Decomposition

```
/tlvr
 ├── core/        type-safe runtime kernel (phantoms, branding, handles)
 ├── typestate/   state machine encodings (Resource, File, builders)
 ├── linear/      linear & affine types (tokens, linear handles)
 ├── effects/     effect tracking and purity enforcement
 ├── protocols/   session-type-inspired protocols (client/server, tx)
 ├── visualize/   type-level math & units (Peano, dimensional safety)
 ├── verify/      soundness torture tests (compile-fail)
 └── examples/    end-to-end demonstrations
```

Each directory is logically isolated; no hidden runtime state beyond handles.

## 3. Type-Level Foundations

### 3.1 Typestate Encoding (Canonical)

```ts
class Resource<S extends State> {
  private constructor(private readonly handle: Handle) {}

  static create(): Resource<'Init'> { ... }
  open(this: Resource<'Init'>): Resource<'Open'> { ... }
  commit(this: Resource<'Open'>): Resource<'Committed'> { ... }
  close(this: Resource<'Committed'>): Resource<'Closed'> { ... }
}
```

Guarantees:
- Cannot `commit()` unless open
- Cannot `close()` unless committed
- Cannot double-close
- Cannot forget to close (with linear types)

### 3.2 Illegal State Elimination

`commit(this: Resource<'Init'>)` is a compile-time error; no runtime branch required.

## 4. Linear & Affine Types

- **Goal**: Resources are used exactly once (linear) or at most once (affine).
- **Encoding**: Phantom tokens (`Token<T>`), consumption marks (`Consumed<T>`), and linear wrappers (`Linear<T, TokenId>`).
- **Guarantees**: Double-free, use-after-free, and leaks are unrepresentable (modulo escape hatches like `any`).

## 5. Effect System

- **Effects**: `IO | Network | Disk | State | Random`
- **Types**: `Pure<T>` and `Effectful<E, T>`
- **Contexts**: `EffectContext<E>` runs only allowed effects; pure functions cannot call effectful ones.
- **Guarantees**: Effect leakage is statically prevented; purity is enforced by types.

## 6. Protocol Verification (Session Types)

Client and server protocols are encoded as state-indexed classes. Examples: connect → authenticate → send; start → accept → handle → stop. Illegal orderings are unrepresentable.

## 7. Type-Level Math & Units

- Peano naturals (`Zero`, `Succ<N>`) with `Add`, `Mult`, `LessThan`.
- Bounded arrays and type-level bounds checking.
- Branded units (meters, seconds, velocity) for dimensional safety.

## 8. Soundness Argument (Progress + Preservation)

- **Invariant**: A TLVR object with type `T<S>` can only exist at runtime in a state consistent with `S`.
- **Progress**: Well-typed programs can always take a valid step; illegal calls are unrepresentable.
- **Preservation**: State transitions `f: T<S1> → T<S2>` maintain typing; no transition from invalid states exists.
- **Linear Safety**: Tokens are created once, consumed once, and cannot be reintroduced.
- **Effect Soundness**: Pure code cannot call effectful code; effects are explicit at the type level.

## 9. Soundness Torture Tests

Location: `verify/soundness-tests.ts` (all tests commented out by design).
- Typestate misuse (commit before open, double commit)
- File mode misuse (read vs write)
- Protocol skipping (send before auth)
- Transaction misuse (execute after commit)
- Linear misuse (use after move/close)
- Effect leakage (pure calls effectful)
- Dimensional errors (mixing units)
- Builder completeness (build before required fields)
- Server lifecycle errors

**How to run a torture test:**
1) Uncomment one test block
2) `npm run test`
3) Expect a **compile-time type error**
4) Re-comment after verification

## 10. Examples

Run all examples:

```bash
npm install
npm run build
node dist/examples/comprehensive.js
```

Examples cover: resource lifecycle, file modes, client/server protocol, transactions, linear files, effects, units, builder completeness, server lifecycle, and a combined end-to-end flow.

## 11. Mapping to Rust and Idris

- Typestate ↔ Rust typestate structs ↔ Idris indexed types
- Linear types ↔ Rust ownership/moves ↔ Idris linearity
- Effects ↔ Rust disciplined effects ↔ Idris `IO`
- Session types ↔ Rust session-type crates ↔ Idris dependent session types

## 12. Limitations

- TypeScript is not a proof assistant; escape hatches (`any`, `unknown as`) remain unsound.
- Some guarantees rely on discipline (no runtime tags; avoid casts at boundaries).

## 13. References

- Strom & Yemini, *Typestate: A Programming Language Concept for Enhancing Software Reliability*, IEEE TSE 1986
- Wadler, *Linear Types Can Change the World*, 1990
- Plotkin & Power, *Algebraic Effects and Handlers*, 2003
- Honda et al., *Session Types*, POPL 1998
- Pierce, *Types and Programming Languages*, MIT Press

## 14. How to Contribute

- Add new protocols/state machines in isolated modules.
- Extend effect sets conservatively; prove purity boundaries.
- Add compile-fail tests for every new invariant.
- No runtime tags or reflection; type-level evidence only.

---
TLVR treats the compiler as the first line of defense. If an illegal program compiles, it is a bug.
