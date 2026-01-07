/**
 * TLVR Examples - Complete Usage Demonstrations
 * 
 * Real-world examples showing all TLVR features in action.
 */

import { Resource, File, PersonBuilder } from '../typestate';
import { Client, Server, Transaction } from '../protocols';
import { LinearFile } from '../linear';
import { readFile, writeFile, consoleLog, EffectContext } from '../effects';
import {
  meters,
  kilometers,
  seconds,
  velocity,
  addMeters,
  metersToKilometers,
} from '../visualize';

/**
 * Example 1: Resource Lifecycle Management
 * 
 * Demonstrates typestate-based resource management.
 */
export function example_resource_lifecycle() {
  console.log('=== Example 1: Resource Lifecycle ===\n');

  // Create a resource (in Init state)
  const resource = Resource.create();
  console.log('✓ Resource created');

  // Open the resource (transitions to Open state)
  const opened = resource.open();
  console.log('✓ Resource opened');

  // Write some data (remains in Open state)
  const written = opened.write('Important data');
  console.log('✓ Data written');

  // Read the data
  const data = written.read();
  console.log(`✓ Data read: ${data}`);

  // Commit changes (transitions to Committed state)
  const committed = written.commit();
  console.log('✓ Changes committed');

  // Close the resource (transitions to Closed state)
  const closed = committed.close();
  console.log('✓ Resource closed\n');

  // ✗ This would be a compile error:
  // closed.read(); // Property 'read' does not exist on type 'Resource<"Closed">'
}

/**
 * Example 2: File Operations with Type Safety
 * 
 * Demonstrates mode-based file access control.
 */
export function example_file_operations() {
  console.log('=== Example 2: File Operations ===\n');

  // Open file for reading
  const reader = File.open('input.txt', 'read');
  const content = reader.read();
  console.log(`✓ Read from file: ${content}`);
  reader.close();

  // Open file for writing
  const writer = File.open('output.txt', 'write');
  writer.write('Line 1\n');
  writer.write('Line 2\n');
  console.log('✓ Wrote to file');
  writer.close();

  // ✗ These would be compile errors:
  // writer.read(); // Property 'read' does not exist on type 'File<"OpenWrite">'
  // reader.write('data'); // Property 'write' does not exist on type 'File<"OpenRead">'

  console.log('✓ Files closed\n');
}

/**
 * Example 3: Client-Server Protocol
 * 
 * Demonstrates protocol verification with session types.
 */
export function example_client_protocol() {
  console.log('=== Example 3: Client Protocol ===\n');

  // Create disconnected client
  const client = Client.create();
  console.log('✓ Client created (disconnected)');

  // Connect to server
  const connected = client.connect('api.example.com');
  console.log('✓ Connected to server');

  // Authenticate
  const authenticated = connected.authenticate('alice', 'secret123');
  console.log('✓ Authenticated');

  // Send messages (only possible after authentication)
  authenticated.send({ type: 'MESSAGE', data: 'Hello, server!' });
  console.log('✓ Message sent');

  authenticated.send({ type: 'COMMAND', data: 'GET /users' });
  console.log('✓ Command sent');

  // Receive response
  const response = authenticated.receive();
  console.log(`✓ Response received: ${response.data}`);

  // Close connection
  const closed = authenticated.close();
  console.log('✓ Connection closed\n');

  // ✗ This would be a compile error:
  // connected.send({ type: 'MESSAGE', data: 'Invalid' }); // Not authenticated yet
}

/**
 * Example 4: Transaction Management
 * 
 * Demonstrates transaction state enforcement.
 */
export function example_transactions() {
  console.log('=== Example 4: Transactions ===\n');

  // Begin transaction
  const tx = Transaction.begin();
  console.log('✓ Transaction started');

  // Execute operations
  const tx2 = tx.execute('INSERT INTO users VALUES (1, "Alice")');
  const tx3 = tx2.execute('INSERT INTO users VALUES (2, "Bob")');
  const tx4 = tx3.execute('UPDATE users SET active = true');
  console.log('✓ Operations executed');

  // Commit transaction
  const committed = tx4.commit();
  console.log('✓ Transaction committed\n');

  // ✗ This would be a compile error:
  // committed.execute('DELETE FROM users'); // Cannot execute on committed transaction

  // Rollback example
  const tx5 = Transaction.begin();
  const tx6 = tx5.execute('DELETE FROM users WHERE id = 999');
  const rolledBack = tx6.rollback();
  console.log('✓ Transaction rolled back\n');
}

/**
 * Example 5: Linear Resource Management
 * 
 * Demonstrates linear types for resource safety.
 */
export function example_linear_resources() {
  console.log('=== Example 5: Linear Resources ===\n');

  // Open file with linear token
  const file = LinearFile.open('data.txt', Symbol('file1'));
  console.log('✓ File opened with linear token');

  // Read from file (returns new file handle)
  const [content1, file2] = file.read();
  console.log(`✓ Read: ${content1}`);

  // Write to file
  const file3 = file2.write('Updated content');
  console.log('✓ Written to file');

  // Read again
  const [content2, file4] = file3.read();
  console.log(`✓ Read again: ${content2}`);

  // Close file (consumes token)
  const closedToken = file4.close();
  console.log('✓ File closed, token consumed\n');

  // ✗ This would be a compile error:
  // file.read(); // Cannot use 'file' after it's been consumed by 'file.read()'
}

/**
 * Example 6: Effect Tracking
 * 
 * Demonstrates effect system for purity enforcement.
 */
export function example_effects() {
  console.log('=== Example 6: Effect Tracking ===\n');

  // Pure computation
  const pureValue = 42;
  console.log(`✓ Pure value: ${pureValue}`);

  // Effectful computation (Disk)
  const diskData = readFile('config.json');
  console.log(`✓ Disk effect: ${diskData.value}`);

  // Effectful computation (IO)
  const ioEffect = consoleLog('Hello from TLVR!');
  console.log('✓ IO effect executed');

  // Create effect context
  const diskContext = EffectContext.create('Disk');
  const result = diskContext.run(diskData);
  console.log(`✓ Effect executed in context: ${result}\n`);

  // ✗ This would be a compile error in a pure function:
  // function pure() {
  //   return readFile('data.txt'); // Disk effect not allowed in pure function
  // }
}

/**
 * Example 7: Dimensional Safety
 * 
 * Demonstrates branded units and type-safe arithmetic.
 */
export function example_units() {
  console.log('=== Example 7: Dimensional Safety ===\n');

  // Define distances
  const distance1 = meters(1000);
  const distance2 = meters(500);
  console.log(`✓ Distance 1: ${distance1}m`);
  console.log(`✓ Distance 2: ${distance2}m`);

  // Add distances (same units)
  const totalDistance = addMeters(distance1, distance2);
  console.log(`✓ Total distance: ${totalDistance}m`);

  // Convert units
  const distanceKm = metersToKilometers(totalDistance);
  console.log(`✓ Distance in km: ${distanceKm}km`);

  // Calculate velocity
  const time = seconds(10);
  const speed = velocity(distance1, time);
  console.log(`✓ Velocity: ${speed}m/s\n`);

  // ✗ This would be a compile error:
  // const invalid = addMeters(distance1, time); // Cannot add meters and seconds
}

/**
 * Example 8: Builder Pattern with Completeness
 * 
 * Demonstrates typestate-based builder.
 */
export function example_builder() {
  console.log('=== Example 8: Builder Pattern ===\n');

  // Build a complete person
  const person = PersonBuilder.create()
    .setName('Alice')
    .setAge(30)
    .setEmail('alice@example.com')
    .setPhone('+1234567890')
    .build();

  console.log(`✓ Person created: ${person.name}, ${person.age} years old`);
  console.log(`  Email: ${person.email}`);
  console.log(`  Phone: ${person.phone}\n`);

  // ✗ This would be a compile error:
  // PersonBuilder.create()
  //   .setName('Bob')
  //   .build(); // Error: age not set
}

/**
 * Example 9: Server Lifecycle
 * 
 * Demonstrates server state management.
 */
export function example_server() {
  console.log('=== Example 9: Server Lifecycle ===\n');

  // Create server
  const server = Server.create();
  console.log('✓ Server created (stopped)');

  // Start server
  const running = server.start(8080);
  console.log('✓ Server started on port 8080');

  // Accept connections
  const accepting = running.acceptConnections();
  console.log('✓ Server accepting connections');

  // Handle clients
  accepting.handleClient('client-1');
  accepting.handleClient('client-2');
  console.log('✓ Clients handled');

  // Stop server
  const stopped = accepting.stop();
  console.log('✓ Server stopped');

  // Close server
  const closed = stopped.close();
  console.log('✓ Server closed\n');
}

/**
 * Example 10: Complete Application Flow
 * 
 * Demonstrates combining all TLVR features.
 */
export function example_complete_application() {
  console.log('=== Example 10: Complete Application ===\n');

  // 1. Resource initialization
  const resource = Resource.create().open();
  console.log('1. ✓ Resource initialized');

  // 2. Client connection
  const client = Client.create()
    .connect('api.example.com')
    .authenticate('admin', 'password');
  console.log('2. ✓ Client authenticated');

  // 3. Transaction
  const tx = Transaction.begin()
    .execute('BEGIN')
    .execute('UPDATE config SET value = "new"')
    .commit();
  console.log('3. ✓ Transaction committed');

  // 4. File operations with effects
  const data = readFile('input.txt');
  writeFile('output.txt', data.value);
  console.log('4. ✓ Files processed');

  // 5. Calculations with units
  const dist = meters(5000);
  const distKm = metersToKilometers(dist);
  console.log(`5. ✓ Calculated: ${distKm}km`);

  // 6. Cleanup
  resource.commit().close();
  client.close();
  console.log('6. ✓ Resources cleaned up\n');

  console.log('✓ Application completed successfully!\n');
}

/**
 * Run all examples
 */
export function runAllExamples() {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║          TLVR - Type-Level Verified Runtime             ║');
  console.log('║              Comprehensive Examples                      ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('\n');

  example_resource_lifecycle();
  example_file_operations();
  example_client_protocol();
  example_transactions();
  example_linear_resources();
  example_effects();
  example_units();
  example_builder();
  example_server();
  example_complete_application();

  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║              All Examples Completed!                     ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('\n');
}

// Run if executed directly
if (require.main === module) {
  runAllExamples();
}
