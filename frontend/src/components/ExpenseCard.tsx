import React, { useState } from 'react';
import { Expense } from '../types';
import { expenseAPI } from '../api';

interface ExpenseCardProps {
  expense: Expense;
  onUpdate: () => void;
  onDelete: (id: number) => void;
}

export const ExpenseCard: React.FC<ExpenseCardProps> = ({ expense, onUpdate, onDelete }) => {
  const [uploadingFile, setUploadingFile] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      await expenseAPI.uploadAttachment(expense.id, file);
      onUpdate();
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!window.confirm('Delete this attachment?')) return;

    try {
      await expenseAPI.deleteAttachment(expense.id, attachmentId);
      onUpdate();
    } catch (error) {
      console.error('Failed to delete attachment:', error);
      alert('Failed to delete attachment');
    }
  };

  const handleApproveAISuggestion = async (suggestionId: number) => {
    try {
      await expenseAPI.approveAISuggestion(
        expense.id,
        suggestionId,
        true,
        true
      );
      onUpdate();
    } catch (error) {
      console.error('Failed to approve AI suggestion:', error);
      alert('Failed to approve AI suggestion');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const latestSuggestion = expense.ai_suggestions[expense.ai_suggestions.length - 1];
  const hasUnapprovedSuggestion = latestSuggestion && !latestSuggestion.was_accepted;

  return (
    <div className="expense-card">
      <div className="expense-header">
        <div className="expense-info">
          <h3>{expense.description}</h3>
          <div className="expense-amount">{formatCurrency(expense.amount)}</div>
        </div>
      </div>

      <div className="expense-meta">
        <div>Date: {formatDate(expense.date)}</div>
        {expense.category && (
          <div>
            <span className="expense-category">{expense.category}</span>
          </div>
        )}
      </div>

      {expense.client_notes && (
        <div className="expense-notes">
          <strong>Client Notes:</strong> {expense.client_notes}
        </div>
      )}

      {expense.attachments.length > 0 && (
        <div className="attachments">
          <h4>📎 Attachments ({expense.attachments.length})</h4>
          <div className="attachment-list">
            {expense.attachments.map((attachment) => (
              <div key={attachment.id} className="attachment-item">
                <a
                  href={expenseAPI.getAttachmentUrl(expense.id, attachment.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {attachment.filename}
                </a>
                <button
                  className="btn btn-danger btn-small"
                  onClick={() => handleDeleteAttachment(attachment.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {expense.ai_suggestions.length > 0 && (
        <div className="ai-suggestions">
          <div className="ai-badge">🤖 AI SUGGESTIONS</div>
          {expense.ai_suggestions.map((suggestion) => (
            <div key={suggestion.id} className="ai-suggestion-item">
              <div className="ai-suggestion-content">
                <strong>Category:</strong> {suggestion.suggested_category || 'N/A'}
              </div>
              <div className="ai-suggestion-content">
                <strong>Notes:</strong> {suggestion.suggested_notes || 'N/A'}
              </div>
              <div className="ai-suggestion-content" style={{ fontSize: '11px', color: '#999' }}>
                Status: {suggestion.was_accepted ? '✓ Accepted' : '⏳ Pending'}
                {suggestion.user_modified && ' (Modified by user)'}
              </div>
              {hasUnapprovedSuggestion && suggestion.id === latestSuggestion.id && (
                <button
                  className="btn btn-success btn-small"
                  style={{ marginTop: '8px' }}
                  onClick={() => handleApproveAISuggestion(suggestion.id)}
                >
                  ✓ Accept AI Suggestions
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="expense-actions">
        <div className="file-input-wrapper">
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={uploadingFile}
            id={`file-${expense.id}`}
            style={{ display: 'none' }}
          />
          <label htmlFor={`file-${expense.id}`} className="btn btn-secondary btn-small">
            {uploadingFile ? 'Uploading...' : '📎 Add Attachment'}
          </label>
        </div>
        <button
          className="btn btn-danger btn-small"
          onClick={() => onDelete(expense.id)}
        >
          Delete
        </button>
      </div>

      <div style={{ fontSize: '12px', color: '#999', marginTop: '12px' }}>
        Created: {formatDate(expense.created_at)} | Updated: {formatDate(expense.updated_at)}
      </div>
    </div>
  );
};
