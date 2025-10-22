interface LineItemSummary {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface EmailContentInput {
  customerName: string;
  storeName: string;
  invoiceName: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  personalMessage?: string;
  supportEmail: string;
  orderUrl?: string;
  lineItems: LineItemSummary[];
}

const formatCurrency = (amount: number, currency: string): string => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch (error) {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const defaultGratitude = (customerName: string, storeName: string): string =>
  `We’re beyond grateful to celebrate each milestone with you, ${customerName}. Thank you for choosing ${storeName} and for allowing us to power your commerce journey.`;

const buildLineItemsHtml = (items: LineItemSummary[], currency: string): string =>
  items
    .map(
      (item) =>
        `<li><strong>${escapeHtml(item.name)}</strong> &times; ${item.quantity} — ${formatCurrency(
          item.lineTotal,
          currency
        )}</li>`
    )
    .join('');

const buildLineItemsText = (items: LineItemSummary[], currency: string): string =>
  items
    .map((item) => `• ${item.name} x${item.quantity} — ${formatCurrency(item.lineTotal, currency)}`)
    .join('\n');

export const buildGratefulEmailContent = (input: EmailContentInput) => {
  const {
    customerName,
    storeName,
    invoiceName,
    subtotal,
    taxAmount,
    totalAmount,
    currency,
    personalMessage,
    supportEmail,
    orderUrl,
    lineItems,
  } = input;

  const gratitudeCopy = personalMessage?.trim() || defaultGratitude(customerName, storeName);

  const subject = `Your ${storeName} invoice ${invoiceName}`;

  const htmlLines: string[] = [
    `<p style="font-size:16px;">Hi ${escapeHtml(customerName)},</p>`,
    `<p style="font-size:15px; line-height:1.6;">${escapeHtml(gratitudeCopy)}</p>`,
    '<p style="font-size:15px; margin-top:16px;">Here’s a quick summary of your invoice:</p>',
    '<ul style="font-size:15px; line-height:1.6; padding-left:20px;">',
    buildLineItemsHtml(lineItems, currency),
    '</ul>',
    `<p style="font-size:15px; line-height:1.6;">Subtotal: <strong>${formatCurrency(subtotal, currency)}</strong><br/>` +
      `Tax: <strong>${formatCurrency(taxAmount, currency)}</strong><br/>` +
      `Total: <strong>${formatCurrency(totalAmount, currency)}</strong></p>`,
  ];

  if (orderUrl) {
    htmlLines.push(
      `<p style="font-size:15px; line-height:1.6;">You can revisit the order at any time: <a href="${escapeHtml(orderUrl)}">View your order</a>.</p>`
    );
  }

  htmlLines.push(
    `<p style="font-size:15px; line-height:1.6;">If you have any questions, just reply to this email or contact us at <a href="mailto:${escapeHtml(
      supportEmail
    )}">${escapeHtml(supportEmail)}</a>.</p>`,
    '<p style="font-size:15px; line-height:1.6;">With gratitude,<br/>The Shopify Invoice Team</p>'
  );

  const textLines: string[] = [
    `Hi ${customerName},`,
    '',
    gratitudeCopy,
    '',
    'Here’s a quick summary of your invoice:',
    buildLineItemsText(lineItems, currency),
    '',
    `Subtotal: ${formatCurrency(subtotal, currency)}`,
    `Tax: ${formatCurrency(taxAmount, currency)}`,
    `Total: ${formatCurrency(totalAmount, currency)}`,
  ];

  if (orderUrl) {
    textLines.push('', `View your order: ${orderUrl}`);
  }

  textLines.push(
    '',
    `Questions? Reply to this email or write to ${supportEmail}.`,
    '',
    'With gratitude,',
    'The Shopify Invoice Team'
  );

  return {
    subject,
    htmlBody: htmlLines.join('\n'),
    textBody: textLines.join('\n'),
  };
};
