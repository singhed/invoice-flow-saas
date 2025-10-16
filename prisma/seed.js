const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  await prisma.user.deleteMany();
  await prisma.expenseCategory.deleteMany();

  console.log('Creating users...');
  const user1 = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin User',
      passwordHash: '$2a$10$X1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJ',
      role: 'ADMIN',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'john.doe@example.com',
      name: 'John Doe',
      passwordHash: '$2a$10$X1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJ',
      role: 'USER',
    },
  });

  console.log('Creating expense categories...');
  const travelCategory = await prisma.expenseCategory.create({
    data: {
      name: 'Travel',
      description: 'Business travel expenses',
    },
  });

  const officeCategory = await prisma.expenseCategory.create({
    data: {
      name: 'Office Supplies',
      description: 'Office equipment and supplies',
    },
  });

  const softwareCategory = await prisma.expenseCategory.create({
    data: {
      name: 'Software & Subscriptions',
      description: 'Software licenses and SaaS subscriptions',
    },
  });

  console.log('Creating clients...');
  const client1 = await prisma.client.create({
    data: {
      name: 'Acme Corporation',
      email: 'contact@acme.com',
      phone: '+1-555-0100',
      address: '123 Business St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'USA',
      taxId: '12-3456789',
      notes: 'Major client, priority support',
      status: 'ACTIVE',
      userId: user1.id,
    },
  });

  const client2 = await prisma.client.create({
    data: {
      name: 'TechStart Inc',
      email: 'hello@techstart.io',
      phone: '+1-555-0200',
      address: '456 Startup Ave',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      country: 'USA',
      status: 'ACTIVE',
      userId: user1.id,
    },
  });

  const client3 = await prisma.client.create({
    data: {
      name: 'Global Industries',
      email: 'info@globalind.com',
      phone: '+1-555-0300',
      address: '789 Enterprise Blvd',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
      status: 'ACTIVE',
      userId: user2.id,
    },
  });

  console.log('Creating projects...');
  const project1 = await prisma.project.create({
    data: {
      name: 'Website Redesign',
      description: 'Complete overhaul of company website',
      hourlyRate: 150.00,
      status: 'ACTIVE',
      startDate: new Date('2024-01-15'),
      clientId: client1.id,
      userId: user1.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Mobile App Development',
      description: 'iOS and Android app for customer portal',
      hourlyRate: 175.00,
      status: 'ACTIVE',
      startDate: new Date('2024-02-01'),
      clientId: client1.id,
      userId: user1.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: 'API Integration',
      description: 'Third-party API integrations',
      hourlyRate: 160.00,
      status: 'ACTIVE',
      startDate: new Date('2024-03-01'),
      clientId: client2.id,
      userId: user1.id,
    },
  });

  const project4 = await prisma.project.create({
    data: {
      name: 'Security Audit',
      description: 'Comprehensive security assessment',
      hourlyRate: 200.00,
      status: 'COMPLETED',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-02-28'),
      clientId: client3.id,
      userId: user2.id,
    },
  });

  console.log('Creating time entries...');
  const timeEntry1 = await prisma.timeEntry.create({
    data: {
      description: 'Initial design mockups and wireframes',
      startTime: new Date('2024-01-15T09:00:00'),
      endTime: new Date('2024-01-15T13:00:00'),
      duration: 240,
      isBillable: true,
      invoiced: false,
      projectId: project1.id,
      userId: user1.id,
    },
  });

  const timeEntry2 = await prisma.timeEntry.create({
    data: {
      description: 'Frontend development - homepage',
      startTime: new Date('2024-01-16T09:00:00'),
      endTime: new Date('2024-01-16T17:00:00'),
      duration: 480,
      isBillable: true,
      invoiced: false,
      projectId: project1.id,
      userId: user1.id,
    },
  });

  const timeEntry3 = await prisma.timeEntry.create({
    data: {
      description: 'Mobile app architecture planning',
      startTime: new Date('2024-02-01T10:00:00'),
      endTime: new Date('2024-02-01T15:00:00'),
      duration: 300,
      isBillable: true,
      invoiced: false,
      projectId: project2.id,
      userId: user1.id,
    },
  });

  const timeEntry4 = await prisma.timeEntry.create({
    data: {
      description: 'API endpoint development',
      startTime: new Date('2024-03-01T09:00:00'),
      endTime: new Date('2024-03-01T12:00:00'),
      duration: 180,
      isBillable: true,
      invoiced: false,
      projectId: project3.id,
      userId: user1.id,
    },
  });

  console.log('Creating invoices...');
  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2024-001',
      issueDate: new Date('2024-01-31'),
      dueDate: new Date('2024-02-29'),
      status: 'SENT',
      subtotal: 2520.00,
      taxRate: 8.5,
      taxAmount: 214.20,
      total: 2734.20,
      notes: 'Thank you for your business!',
      terms: 'Payment due within 30 days',
      clientId: client1.id,
      userId: user1.id,
    },
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2024-002',
      issueDate: new Date('2024-02-28'),
      dueDate: new Date('2024-03-29'),
      status: 'PAID',
      subtotal: 1200.00,
      taxRate: 8.5,
      taxAmount: 102.00,
      total: 1302.00,
      notes: 'Payment received - thank you!',
      terms: 'Payment due within 30 days',
      clientId: client3.id,
      userId: user2.id,
    },
  });

  const invoice3 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2024-003',
      issueDate: new Date('2024-03-15'),
      dueDate: new Date('2024-04-14'),
      status: 'DRAFT',
      subtotal: 875.00,
      taxRate: 8.5,
      taxAmount: 74.38,
      total: 949.38,
      notes: 'Draft invoice - not yet sent',
      terms: 'Payment due within 30 days',
      clientId: client2.id,
      userId: user1.id,
    },
  });

  console.log('Creating invoice line items...');
  const lineItem1 = await prisma.invoiceLineItem.create({
    data: {
      description: 'Website design and development',
      quantity: 12.0,
      unitPrice: 150.00,
      amount: 1800.00,
      invoiceId: invoice1.id,
      projectId: project1.id,
    },
  });

  const lineItem2 = await prisma.invoiceLineItem.create({
    data: {
      description: 'Mobile app planning and consultation',
      quantity: 5.0,
      unitPrice: 175.00,
      amount: 875.00,
      invoiceId: invoice1.id,
      projectId: project2.id,
    },
  });

  const lineItem3 = await prisma.invoiceLineItem.create({
    data: {
      description: 'Security audit services',
      quantity: 6.0,
      unitPrice: 200.00,
      amount: 1200.00,
      invoiceId: invoice2.id,
      projectId: project4.id,
    },
  });

  const lineItem4 = await prisma.invoiceLineItem.create({
    data: {
      description: 'API integration services',
      quantity: 3.0,
      unitPrice: 160.00,
      amount: 480.00,
      invoiceId: invoice3.id,
      projectId: project3.id,
    },
  });

  console.log('Creating payments...');
  await prisma.payment.create({
    data: {
      amount: 1302.00,
      paymentDate: new Date('2024-03-20'),
      paymentMethod: 'BANK_TRANSFER',
      transactionId: 'TXN-20240320-001',
      notes: 'Full payment received',
      invoiceId: invoice2.id,
    },
  });

  await prisma.payment.create({
    data: {
      amount: 1000.00,
      paymentDate: new Date('2024-02-15'),
      paymentMethod: 'CREDIT_CARD',
      transactionId: 'TXN-20240215-001',
      notes: 'Partial payment',
      invoiceId: invoice1.id,
    },
  });

  console.log('Creating expenses...');
  await prisma.expense.create({
    data: {
      description: 'Flight to client meeting',
      amount: 450.00,
      expenseDate: new Date('2024-01-20'),
      vendor: 'Airlines Inc',
      isBillable: true,
      invoiced: false,
      notes: 'Meeting with Acme Corporation',
      categoryId: travelCategory.id,
      userId: user1.id,
    },
  });

  await prisma.expense.create({
    data: {
      description: 'Office desk and chair',
      amount: 850.00,
      expenseDate: new Date('2024-02-01'),
      vendor: 'Office Depot',
      isBillable: false,
      invoiced: false,
      categoryId: officeCategory.id,
      userId: user1.id,
    },
  });

  await prisma.expense.create({
    data: {
      description: 'Adobe Creative Cloud subscription',
      amount: 54.99,
      expenseDate: new Date('2024-03-01'),
      vendor: 'Adobe',
      isBillable: false,
      invoiced: false,
      notes: 'Monthly subscription',
      categoryId: softwareCategory.id,
      userId: user1.id,
    },
  });

  await prisma.expense.create({
    data: {
      description: 'GitHub Team plan',
      amount: 44.00,
      expenseDate: new Date('2024-03-01'),
      vendor: 'GitHub',
      isBillable: false,
      invoiced: false,
      notes: 'Monthly subscription',
      categoryId: softwareCategory.id,
      userId: user2.id,
    },
  });

  console.log('Creating reminders...');
  await prisma.reminder.create({
    data: {
      reminderDate: new Date('2024-02-22'),
      reminderType: 'PAYMENT_DUE',
      message: 'Payment due in 7 days',
      sent: true,
      sentAt: new Date('2024-02-22T09:00:00'),
      invoiceId: invoice1.id,
      userId: user1.id,
    },
  });

  await prisma.reminder.create({
    data: {
      reminderDate: new Date('2024-04-07'),
      reminderType: 'PAYMENT_DUE',
      message: 'Payment due in 7 days',
      sent: false,
      invoiceId: invoice3.id,
      userId: user1.id,
    },
  });

  await prisma.reminder.create({
    data: {
      reminderDate: new Date('2024-03-01'),
      reminderType: 'INVOICE_SENT',
      message: 'Invoice sent to client',
      sent: true,
      sentAt: new Date('2024-02-28T14:30:00'),
      invoiceId: invoice1.id,
      userId: user1.id,
    },
  });

  console.log('Creating integrations...');
  await prisma.integration.create({
    data: {
      provider: 'STRIPE',
      providerAccountId: 'acct_1234567890',
      accessToken: 'sk_test_1234567890abcdef',
      status: 'ACTIVE',
      config: {
        webhookSecret: 'whsec_1234567890',
        publishableKey: 'pk_test_1234567890abcdef',
      },
      userId: user1.id,
    },
  });

  await prisma.integration.create({
    data: {
      provider: 'QUICKBOOKS',
      providerAccountId: 'qb_123456',
      accessToken: 'qb_access_token_example',
      refreshToken: 'qb_refresh_token_example',
      tokenExpiresAt: new Date('2024-12-31'),
      status: 'ACTIVE',
      config: {
        realmId: '123456789',
        environment: 'sandbox',
      },
      userId: user1.id,
    },
  });

  await prisma.integration.create({
    data: {
      provider: 'SLACK',
      providerAccountId: 'T1234567890',
      accessToken: 'xoxb-1234567890-abcdef',
      status: 'ACTIVE',
      config: {
        channelId: 'C1234567890',
        webhookUrl: 'https://hooks.slack.com/services/T00000000/B00000000/XXXX',
      },
      userId: user2.id,
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
