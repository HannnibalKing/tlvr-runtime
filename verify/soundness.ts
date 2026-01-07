/**
 * TLVR Verification - Soundness Tests
 * 
 * These tests verify that illegal operations are impossible to express.
 * 
 * IMPORTANT: These are compile-time tests.
 * The code below should NOT compile if uncommented.
 * 
 * To verify soundness:
 * 1. Uncomment a test case
 * 2. Run `npm run test`
 * 3. Verify it produces a type error
 * 4. Re-comment the test
 */

import { Resource, File } from '../typestate';
import { Client, Transaction } from '../protocols';
import { LinearFile } from '../linear';
import { readFile, consoleLog } from '../effects';

/**
 * 🧨 Test 1: Impossible API Usage
 * 
 * Verify that state transitions cannot be bypassed.
 */
export function test_illegal_transitions() {
  const r = Resource.create();
  const opened = r.open();
  const committed = opened.commit();
  
  // ✓ This should work
  committed.close();

  // ✗ These should NOT compile (uncomment to test):
  
  // Test 1a: Cannot commit before opening
  // const r2 = Resource.create();
  // r2.commit(); // ✗ Type error: Property 'commit' does not exist on type 'Resource<"Init">'
  
  // Test 1b: Cannot commit twice
  // const r3 = Resource.create();
  // const o3 = r3.open();
  // const c3 = o3.commit();
  // c3.commit(); // ✗ Type error: Property 'commit' does not exist on type 'Resource<"Committed">'
  
  // Test 1c: Cannot close before committing
  // const r4 = Resource.create();
  // const o4 = r4.open();
  // o4.close(); // ✗ Type error: Property 'close' does not exist on type 'Resource<"Open">'
  
  // Test 1d: Cannot use after close
  // const r5 = Resource.create();
  // const o5 = r5.open();
  // const c5 = o5.commit();
  // const closed = c5.close();
  // closed.read(); // ✗ Type error: Property 'read' does not exist on type 'Resource<"Closed">'
}

/**
 * 🧨 Test 2: Forgotten Cleanup
 * 
 * Verify that resources must be properly closed.
 * 
 * Note: TypeScript cannot enforce this without linear types,
 * but linear types can detect it.
 */
export function test_forgotten_cleanup() {
  // ✗ This should be caught by linear type checking:
  
  // const file = LinearFile.open('data.txt', Symbol('token1'));
  // // Forgot to call file.close()!
  // // In a full linear type system, this would be a compile error
  
  // Correct usage:
  const file = LinearFile.open('data.txt', Symbol('token2'));
  const [content, file2] = file.read();
  const closed = file2.close();
  // ✓ Token is consumed, resource is freed
}

/**
 * 🧨 Test 3: Effect Leakage
 * 
 * Verify that pure functions cannot call effectful functions.
 */
export function test_effect_leakage() {
  // ✗ This should NOT compile (uncomment to test):
  
  // import { pure, runPure } from '../effects';
  
  // function supposedlyPure(): Pure<string> {
  //   const data = readFile('secret.txt'); // ✗ Type error: Disk effect not allowed
  //   return pure(data.value);
  // }
  
  // ✓ This is the correct way:
  // Pure functions can only call other pure functions
}

/**
 * 🧨 Test 4: Protocol Skipping
 * 
 * Verify that protocol steps cannot be skipped.
 */
export function test_protocol_violations() {
  const client = Client.create();
  const connected = client.connect('server.com');
  const authenticated = connected.authenticate('user', 'pass');
  
  // ✓ This should work
  authenticated.send({ type: 'MESSAGE', data: 'Hello' });

  // ✗ These should NOT compile (uncomment to test):
  
  // Test 4a: Cannot send before connecting
  // const c1 = Client.create();
  // c1.send({ type: 'MESSAGE', data: 'Hello' }); // ✗ Type error
  
  // Test 4b: Cannot send before authenticating
  // const c2 = Client.create();
  // const conn = c2.connect('server.com');
  // conn.send({ type: 'MESSAGE', data: 'Hello' }); // ✗ Type error
  
  // Test 4c: Cannot authenticate before connecting
  // const c3 = Client.create();
  // c3.authenticate('user', 'pass'); // ✗ Type error
  
  // Test 4d: Cannot connect twice
  // const c4 = Client.create();
  // const conn1 = c4.connect('server1.com');
  // conn1.connect('server2.com'); // ✗ Type error: Property 'connect' does not exist
}

/**
 * 🧨 Test 5: File Mode Violations
 * 
 * Verify that file operations match the open mode.
 */
export function test_file_mode_violations() {
  const readFile = File.open('data.txt', 'read');
  const writeFile = File.open('output.txt', 'write');
  
  // ✓ These should work
  readFile.read();
  writeFile.write('data');

  // ✗ These should NOT compile (uncomment to test):
  
  // Test 5a: Cannot write to read-only file
  // const rf = File.open('data.txt', 'read');
  // rf.write('data'); // ✗ Type error: Property 'write' does not exist on type 'File<"OpenRead">'
  
  // Test 5b: Cannot read from write-only file
  // const wf = File.open('output.txt', 'write');
  // wf.read(); // ✗ Type error: Property 'read' does not exist on type 'File<"OpenWrite">'
}

/**
 * 🧨 Test 6: Transaction Violations
 * 
 * Verify transaction state enforcement.
 */
export function test_transaction_violations() {
  const tx = Transaction.begin();
  const tx2 = tx.execute('INSERT INTO users VALUES (1)');
  const committed = tx2.commit();
  
  // ✗ These should NOT compile (uncomment to test):
  
  // Test 6a: Cannot execute on committed transaction
  // committed.execute('UPDATE users SET name = "Alice"'); // ✗ Type error
  
  // Test 6b: Cannot commit twice
  // const tx3 = Transaction.begin();
  // const c1 = tx3.commit();
  // c1.commit(); // ✗ Type error
  
  // Test 6c: Cannot commit after rollback
  // const tx4 = Transaction.begin();
  // const rb = tx4.rollback();
  // rb.commit(); // ✗ Type error
}

/**
 * 🧨 Test 7: Unit Mixing
 * 
 * Verify that incompatible units cannot be mixed.
 */
export function test_unit_mixing() {
  // ✗ These should NOT compile (uncomment to test):
  
  // import { meters, seconds, addMeters } from '../visualize';
  
  // const distance = meters(100);
  // const time = seconds(10);
  
  // Test 7a: Cannot add different units
  // const invalid = addMeters(distance, time); // ✗ Type error
  
  // Test 7b: Cannot assign different units
  // const m: Meters = time; // ✗ Type error
}

/**
 * 🧨 Test 8: Builder Incomplete
 * 
 * Verify that builders cannot build incomplete objects.
 */
export function test_incomplete_builder() {
  // ✗ These should NOT compile (uncomment to test):
  
  // import { PersonBuilder } from '../typestate';
  
  // Test 8a: Cannot build without required fields
  // const person1 = PersonBuilder.create()
  //   .setName('Alice')
  //   .build(); // ✗ Type error: age not set
  
  // Test 8b: Cannot build with only age
  // const person2 = PersonBuilder.create()
  //   .setAge(30)
  //   .build(); // ✗ Type error: name not set
  
  // ✓ This should work
  // const person3 = PersonBuilder.create()
  //   .setName('Bob')
  //   .setAge(25)
  //   .build(); // ✓ OK
}

/**
 * Soundness Summary
 * 
 * These tests demonstrate that TLVR enforces:
 * 
 * 1. ✓ State transitions must follow the prescribed order
 * 2. ✓ Resources must be properly initialized before use
 * 3. ✓ Effects cannot leak into pure contexts
 * 4. ✓ Protocols cannot skip steps
 * 5. ✓ File operations must match the open mode
 * 6. ✓ Transactions enforce commit/rollback semantics
 * 7. ✓ Units cannot be mixed inappropriately
 * 8. ✓ Builders enforce required fields
 * 
 * All illegal operations result in compile-time errors,
 * not runtime errors.
 */
