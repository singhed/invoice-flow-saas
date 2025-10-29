'use client';

import { useState } from 'react';
import FileUpload from '@/components/ai-invoice/FileUpload';
import InvoicePreview from '@/components/ai-invoice/InvoicePreview';
import { GeneratedInvoice, AiInvoiceResponse } from '@/types/ai-invoice';

export default function AiInvoicePage() {
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [generatedInvoice, setGeneratedInvoice] = useState<GeneratedInvoice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const aiServiceUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:3009';
      
      let response: Response;

      if (inputMode === 'file' && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        response = await fetch(`${aiServiceUrl}/ai/generate-invoice`, {
          method: 'POST',
          body: formData,
        });
      } else if (inputMode === 'text' && inputText.trim()) {
        response = await fetch(`${aiServiceUrl}/ai/generate-invoice`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ input: inputText }),
        });
      } else {
        throw new Error('Please provide either text input or upload a file');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate invoice');
      }

      const data = await response.json();
      const invoiceData: AiInvoiceResponse = data.data;

      setGeneratedInvoice({
        ...invoiceData,
        isEditing: false,
      });
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      console.error('Invoice generation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveInvoice = async () => {
    if (!generatedInvoice) return;

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Integrate with existing invoice service to save the invoice
      // For now, we'll just show a success message
      alert('Invoice saved successfully! (Integration with invoice service pending)');
      
      // Reset form
      setInputText('');
      setSelectedFile(null);
      setGeneratedInvoice(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save invoice');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI-Powered Invoice Generator
          </h1>
          <p className="text-gray-600">
            Generate professional invoices from natural language or upload documents for automatic
            extraction.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Input Mode Selector */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => setInputMode('text')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    inputMode === 'text'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Text Input
                </button>
                <button
                  onClick={() => setInputMode('file')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    inputMode === 'file'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  File Upload
                </button>
              </div>

              {inputMode === 'text' ? (
                <div>
                  <label htmlFor="invoice-input" className="block text-sm font-medium text-gray-700 mb-2">
                    Describe your invoice
                  </label>
                  <textarea
                    id="invoice-input"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={isLoading}
                    className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Example: Invoice Acme Corp for 5 hours of web development at $150/hr plus $200 for monthly hosting. Add 8.5% tax. Due in 30 days."
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Tip: Include customer details, items/services, quantities, prices, and payment terms.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload invoice document
                  </label>
                  <FileUpload onFileSelect={setSelectedFile} disabled={isLoading} />
                  <p className="mt-2 text-sm text-gray-500">
                    Upload a PDF invoice, receipt, or image for automatic data extraction.
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleGenerate}
                disabled={isLoading || (inputMode === 'text' ? !inputText.trim() : !selectedFile)}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Generating...
                  </span>
                ) : (
                  'Generate Invoice'
                )}
              </button>

              {generatedInvoice && (
                <button
                  onClick={handleSaveInvoice}
                  disabled={isLoading}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Save & Create Invoice
                </button>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="mt-1 text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Example */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Example Input</h3>
              <p className="text-sm text-blue-800 italic">
                "Invoice Acme Corp (billing@acme.com) for 5 hours of website development at $150/hr
                and 1 month of hosting at $100. Customer is at 123 Main St, NYC, NY 10001. Add 8.5%
                tax. Due in 30 days. Note: 50% deposit already paid."
              </p>
            </div>
          </div>

          {/* Preview Section */}
          <div>
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Invoice Preview</h2>
              <InvoicePreview invoice={generatedInvoice} onUpdate={setGeneratedInvoice} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
