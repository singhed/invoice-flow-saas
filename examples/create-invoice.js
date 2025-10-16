const http = require('http');

const invoiceData = JSON.stringify({
  client_name: 'John Doe',
  client_email: 'john.doe@example.com',
  amount: 100.00,
  currency: 'USD',
  description: 'Website Development Services - March 2024'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/invoices',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': invoiceData.length
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    const response = JSON.parse(data);
    console.log('\n=== Invoice Created Successfully ===\n');
    console.log('Invoice ID:', response.invoice.id);
    console.log('Client:', response.invoice.client_name);
    console.log('Amount:', response.invoice.currency, response.invoice.amount);
    console.log('Status:', response.invoice.status);
    console.log('\nPayment Portal URL:');
    console.log(response.portal_url);
    console.log('\nSecure Token:');
    console.log(response.token);
    console.log('\n');
  });
});

req.on('error', (error) => {
  console.error('Error creating invoice:', error);
});

req.write(invoiceData);
req.end();
