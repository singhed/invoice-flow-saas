console.log('Testing database and server setup...\n');

try {
  require('./src/models/database');
  console.log('✓ Database initialized successfully');
  
  const Invoice = require('./src/models/Invoice');
  const Payment = require('./src/models/Payment');
  const SecureToken = require('./src/models/SecureToken');
  console.log('✓ Models loaded successfully');
  
  const app = require('./src/app');
  console.log('✓ Express app loaded successfully');
  
  console.log('\nAll components loaded successfully!');
  console.log('You can now start the server with: npm start\n');
  
  process.exit(0);
} catch (error) {
  console.error('✗ Setup test failed:', error.message);
  console.error(error);
  process.exit(1);
}
