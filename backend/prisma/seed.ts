import { PrismaClient } from '@prisma/client';
import { addDays, subDays, subMonths } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create clients
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: 'Acme Corporation',
        email: 'contact@acme.com',
        company: 'Acme Corp',
        phone: '+1-555-0101',
        address: '123 Business St, NY, USA',
      },
    }),
    prisma.client.create({
      data: {
        name: 'TechStart Inc',
        email: 'hello@techstart.com',
        company: 'TechStart Inc',
        phone: '+1-555-0102',
        address: '456 Startup Ave, SF, USA',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Global Enterprises',
        email: 'info@global.com',
        company: 'Global Enterprises Ltd',
        phone: '+1-555-0103',
        address: '789 Corporate Blvd, LA, USA',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Local Business Co',
        email: 'admin@localbiz.com',
        company: 'Local Business Co',
        phone: '+1-555-0104',
        address: '321 Main St, Chicago, USA',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Digital Solutions',
        email: 'team@digitalsol.com',
        company: 'Digital Solutions LLC',
        phone: '+1-555-0105',
        address: '654 Tech Park, Austin, USA',
      },
    }),
  ]);

  console.log(`Created ${clients.length} clients`);

  // Create invoices for the past 6 months
  const invoiceData = [];
  let invoiceCounter = 1;

  for (const client of clients) {
    const numInvoices = Math.floor(Math.random() * 8) + 3; // 3-10 invoices per client
    
    for (let i = 0; i < numInvoices; i++) {
      const monthsAgo = Math.floor(Math.random() * 6);
      const issueDate = subMonths(new Date(), monthsAgo);
      const dueDate = addDays(issueDate, 30);
      const amount = Math.floor(Math.random() * 10000) + 1000; // $1000-$11000
      const taxRate = 0.1; // 10% tax
      const taxAmount = amount * taxRate;
      const totalAmount = amount + taxAmount;
      
      // Randomly assign status
      const statusOptions = ['PAID', 'PENDING', 'PARTIALLY_PAID', 'OVERDUE'];
      const weights = [0.6, 0.2, 0.1, 0.1]; // 60% paid, 20% pending, etc.
      const random = Math.random();
      let status = 'PENDING';
      let cumulative = 0;
      for (let j = 0; j < statusOptions.length; j++) {
        cumulative += weights[j];
        if (random <= cumulative) {
          status = statusOptions[j];
          break;
        }
      }

      const paidDate = status === 'PAID' ? addDays(issueDate, Math.floor(Math.random() * 30)) : null;

      invoiceData.push({
        invoiceNumber: `INV-${String(invoiceCounter).padStart(4, '0')}`,
        clientId: client.id,
        amount,
        taxAmount,
        totalAmount,
        status,
        issueDate,
        dueDate,
        paidDate,
        description: `Services rendered for ${client.name}`,
      });

      invoiceCounter++;
    }
  }

  const invoices = await Promise.all(
    invoiceData.map(data => prisma.invoice.create({ data }))
  );

  console.log(`Created ${invoices.length} invoices`);

  // Create payments for paid invoices
  let paymentCounter = 0;
  for (const invoice of invoices) {
    if (invoice.status === 'PAID') {
      await prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: invoice.totalAmount,
          paymentDate: invoice.paidDate!,
          method: ['Credit Card', 'Bank Transfer', 'Check'][Math.floor(Math.random() * 3)],
          notes: 'Full payment received',
        },
      });
      paymentCounter++;
    } else if (invoice.status === 'PARTIALLY_PAID') {
      const partialAmount = Number(invoice.totalAmount) * (Math.random() * 0.5 + 0.2); // 20-70%
      await prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: partialAmount,
          paymentDate: addDays(invoice.issueDate, Math.floor(Math.random() * 20)),
          method: ['Credit Card', 'Bank Transfer', 'Check'][Math.floor(Math.random() * 3)],
          notes: 'Partial payment received',
        },
      });
      paymentCounter++;
    }
  }

  console.log(`Created ${paymentCounter} payments`);
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
