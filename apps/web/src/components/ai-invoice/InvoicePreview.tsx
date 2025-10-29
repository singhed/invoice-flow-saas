'use client';

import { GeneratedInvoice, LineItem } from '@/types/ai-invoice';
import { useState } from 'react';

interface InvoicePreviewProps {
  invoice: GeneratedInvoice | null;
  onUpdate: (invoice: GeneratedInvoice) => void;
}

export default function InvoicePreview({ invoice, onUpdate }: InvoicePreviewProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (!invoice) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-lg">No invoice generated yet</p>
          <p className="text-sm mt-2">Enter text or upload a file to generate an invoice</p>
        </div>
      </div>
    );
  }

  const handleLineItemChange = (index: number, field: keyof LineItem, value: string | number) => {
    const updatedLineItems = [...invoice.lineItems];
    updatedLineItems[index] = {
      ...updatedLineItems[index],
      [field]: typeof value === 'string' ? value : parseFloat(value.toString()) || 0,
    };

    if (field === 'quantity' || field === 'unitPrice') {
      updatedLineItems[index].total =
        updatedLineItems[index].quantity * updatedLineItems[index].unitPrice;
    }

    const subtotal = updatedLineItems.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = subtotal * invoice.invoice.taxRate;
    const total = subtotal + taxAmount;

    onUpdate({
      ...invoice,
      lineItems: updatedLineItems,
      invoice: {
        ...invoice.invoice,
        subtotal,
        taxAmount,
        total,
      },
    });
  };

  const addLineItem = () => {
    const newLineItem: LineItem = {
      description: 'New Item',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };

    onUpdate({
      ...invoice,
      lineItems: [...invoice.lineItems, newLineItem],
    });
  };

  const removeLineItem = (index: number) => {
    if (invoice.lineItems.length <= 1) {
      alert('Invoice must have at least one line item');
      return;
    }

    const updatedLineItems = invoice.lineItems.filter((_, i) => i !== index);
    const subtotal = updatedLineItems.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = subtotal * invoice.invoice.taxRate;
    const total = subtotal + taxAmount;

    onUpdate({
      ...invoice,
      lineItems: updatedLineItems,
      invoice: {
        ...invoice.invoice,
        subtotal,
        taxAmount,
        total,
      },
    });
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-8 max-h-[calc(100vh-12rem)] overflow-y-auto">
      {/* Confidence Indicator */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">AI Confidence:</span>
          <div className="flex items-center gap-1">
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  invoice.confidence >= 0.8
                    ? 'bg-green-500'
                    : invoice.confidence >= 0.6
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${invoice.confidence * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium">{(invoice.confidence * 100).toFixed(0)}%</span>
          </div>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {isEditing ? '✓ Done Editing' : '✎ Edit Invoice'}
        </button>
      </div>

      {/* Invoice Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">INVOICE</h1>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h2 className="text-sm font-semibold text-gray-600 mb-2">BILL TO:</h2>
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={invoice.customer.name}
                  onChange={(e) =>
                    onUpdate({
                      ...invoice,
                      customer: { ...invoice.customer, name: e.target.value },
                    })
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded"
                />
                <input
                  type="email"
                  value={invoice.customer.email}
                  onChange={(e) =>
                    onUpdate({
                      ...invoice,
                      customer: { ...invoice.customer, email: e.target.value },
                    })
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded"
                />
                <textarea
                  value={invoice.customer.address || ''}
                  onChange={(e) =>
                    onUpdate({
                      ...invoice,
                      customer: { ...invoice.customer, address: e.target.value },
                    })
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded"
                  rows={2}
                />
              </div>
            ) : (
              <>
                <p className="font-semibold text-gray-900">{invoice.customer.name}</p>
                <p className="text-gray-600">{invoice.customer.email}</p>
                {invoice.customer.address && (
                  <p className="text-gray-600 text-sm mt-1">{invoice.customer.address}</p>
                )}
              </>
            )}
          </div>
          <div className="text-right">
            <div className="mb-4">
              <p className="text-sm text-gray-600">Invoice #</p>
              {isEditing ? (
                <input
                  type="text"
                  value={invoice.invoice.number}
                  onChange={(e) =>
                    onUpdate({
                      ...invoice,
                      invoice: { ...invoice.invoice, number: e.target.value },
                    })
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-right"
                />
              ) : (
                <p className="font-semibold text-gray-900">{invoice.invoice.number}</p>
              )}
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600">Date</p>
              {isEditing ? (
                <input
                  type="date"
                  value={invoice.invoice.date}
                  onChange={(e) =>
                    onUpdate({
                      ...invoice,
                      invoice: { ...invoice.invoice, date: e.target.value },
                    })
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-right"
                />
              ) : (
                <p className="font-semibold text-gray-900">{invoice.invoice.date}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">Due Date</p>
              {isEditing ? (
                <input
                  type="date"
                  value={invoice.invoice.dueDate}
                  onChange={(e) =>
                    onUpdate({
                      ...invoice,
                      invoice: { ...invoice.invoice, dueDate: e.target.value },
                    })
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-right"
                />
              ) : (
                <p className="font-semibold text-gray-900">{invoice.invoice.dueDate}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-2 text-sm font-semibold text-gray-600">DESCRIPTION</th>
              <th className="text-right py-2 text-sm font-semibold text-gray-600">QTY</th>
              <th className="text-right py-2 text-sm font-semibold text-gray-600">UNIT PRICE</th>
              <th className="text-right py-2 text-sm font-semibold text-gray-600">TOTAL</th>
              {isEditing && <th className="w-10"></th>}
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-3">
                  {isEditing ? (
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  ) : (
                    <span className="text-gray-900">{item.description}</span>
                  )}
                </td>
                <td className="py-3 text-right">
                  {isEditing ? (
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handleLineItemChange(index, 'quantity', parseFloat(e.target.value))
                      }
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-right ml-auto"
                      min="0"
                      step="1"
                    />
                  ) : (
                    <span className="text-gray-900">{item.quantity}</span>
                  )}
                </td>
                <td className="py-3 text-right">
                  {isEditing ? (
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) =>
                        handleLineItemChange(index, 'unitPrice', parseFloat(e.target.value))
                      }
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-right ml-auto"
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    <span className="text-gray-900">
                      {invoice.invoice.currency} {item.unitPrice.toFixed(2)}
                    </span>
                  )}
                </td>
                <td className="py-3 text-right">
                  <span className="text-gray-900">
                    {invoice.invoice.currency} {item.total.toFixed(2)}
                  </span>
                </td>
                {isEditing && (
                  <td className="py-3 text-right">
                    <button
                      onClick={() => removeLineItem(index)}
                      className="text-red-600 hover:text-red-800"
                      title="Remove item"
                    >
                      ✕
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {isEditing && (
          <button
            onClick={addLineItem}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            + Add Line Item
          </button>
        )}
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-64">
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-semibold text-gray-900">
              {invoice.invoice.currency} {invoice.invoice.subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">
              Tax ({(invoice.invoice.taxRate * 100).toFixed(1)}%):
            </span>
            <span className="font-semibold text-gray-900">
              {invoice.invoice.currency} {invoice.invoice.taxAmount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between py-2 border-t-2 border-gray-300">
            <span className="text-lg font-bold text-gray-900">Total:</span>
            <span className="text-lg font-bold text-gray-900">
              {invoice.invoice.currency} {invoice.invoice.total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {(isEditing || invoice.invoice.notes) && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">NOTES:</h3>
          {isEditing ? (
            <textarea
              value={invoice.invoice.notes || ''}
              onChange={(e) =>
                onUpdate({
                  ...invoice,
                  invoice: { ...invoice.invoice, notes: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded"
              rows={3}
              placeholder="Additional notes or payment terms..."
            />
          ) : (
            <p className="text-gray-600 text-sm">{invoice.invoice.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}
