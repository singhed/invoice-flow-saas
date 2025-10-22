export interface ShopifyOrderCustomer {
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface ShopifyAddress {
  name?: string;
  company?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  zip?: string;
  country?: string;
}

export interface ShopifyLineItem {
  id: number;
  name: string;
  quantity: number;
  price: string;
  sku?: string;
}

export interface ShopifyOrder {
  id: number;
  name?: string;
  order_number?: number;
  email?: string;
  currency?: string;
  customer?: ShopifyOrderCustomer;
  line_items?: ShopifyLineItem[];
  current_total_price?: string;
  subtotal_price?: string;
  total_tax?: string;
  created_at?: string;
  billing_address?: ShopifyAddress;
  note?: string;
}

export interface InvoiceAttachment {
  fileName: string;
  content: Buffer;
  contentType: string;
}

export interface InvoiceEmailRequestBody {
  orderId: string;
  recipientEmail?: string;
  personalMessage?: string;
}
