/**
 * TLVR Verification - Test Runner
 * 
 * This file provides instructions for running soundness tests.
 */

console.log(`
TLVR Soundness Verification
============================

These tests verify that illegal operations are IMPOSSIBLE to express.

How to test:
1. Open verify/soundness.ts
2. Find a test case (e.g., "Test 1a: Cannot commit before opening")
3. Uncomment the test code
4. Run: npm run test
5. Verify that you get a TYPE ERROR (not a runtime error)
6. Re-comment the test

Expected Results:
- All uncommented illegal operations should produce compile-time type errors
- No runtime errors should occur (because illegal code cannot compile)

Test Categories:
✓ State transitions
✓ Resource lifecycle
✓ Effect isolation
✓ Protocol ordering
✓ File mode checking
✓ Transaction semantics
✓ Unit safety
✓ Builder completeness

If you can compile illegal code, the type system has a soundness bug.
`);
