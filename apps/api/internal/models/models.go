package models

import (
    "time"
)

// Expense represents an expense record
type Expense struct {
    ID           uint                   `json:"id" gorm:"primaryKey"`
    Description  string                 `json:"description" gorm:"not null"`
    Amount       float64               `json:"amount" gorm:"not null"`
    Date         time.Time             `json:"date"`
    Category     string                `json:"category"`
    ClientNotes  string                `json:"client_notes" gorm:"type:text"`
    CreatedAt    time.Time             `json:"created_at"`
    UpdatedAt    time.Time             `json:"updated_at"`
    Attachments  []Attachment          `json:"attachments" gorm:"foreignKey:ExpenseID"`
    AISuggestions []AISuggestion       `json:"ai_suggestions" gorm:"foreignKey:ExpenseID"`
}

// Attachment represents a file attachment for an expense
type Attachment struct {
    ID          uint      `json:"id" gorm:"primaryKey"`
    ExpenseID   uint      `json:"expense_id" gorm:"not null"`
    Filename    string    `json:"filename" gorm:"not null"`
    FilePath    string    `json:"file_path" gorm:"not null"`
    ContentType string    `json:"content_type"`
    FileSize    int64     `json:"file_size"`
    UploadedAt  time.Time `json:"uploaded_at"`
}

// AISuggestion represents AI-generated suggestions for an expense
type AISuggestion struct {
    ID                uint      `json:"id" gorm:"primaryKey"`
    ExpenseID         uint      `json:"expense_id" gorm:"not null"`
    SuggestedCategory string    `json:"suggested_category"`
    SuggestedNotes    string    `json:"suggested_notes" gorm:"type:text"`
    WasAccepted       bool      `json:"was_accepted" gorm:"default:false"`
    UserModified      bool      `json:"user_modified" gorm:"default:false"`
    FinalCategory     string    `json:"final_category"`
    FinalNotes        string    `json:"final_notes" gorm:"type:text"`
    CreatedAt         time.Time `json:"created_at"`
    ModelUsed         string    `json:"model_used" gorm:"default:'gpt-3.5-turbo'"`
}

// CreateExpenseRequest represents the request payload for creating an expense
type CreateExpenseRequest struct {
    Description         string    `json:"description" binding:"required"`
    Amount              float64   `json:"amount" binding:"required,gt=0"`
    Date                time.Time `json:"date"`
    Category            string    `json:"category"`
    ClientNotes         string    `json:"client_notes"`
    RequestAISuggestion bool      `json:"request_ai_suggestion"`
}

// UpdateExpenseRequest represents the request payload for updating an expense
type UpdateExpenseRequest struct {
    Description *string  `json:"description"`
    Amount      *float64 `json:"amount"`
    Date        *time.Time `json:"date"`
    Category    *string  `json:"category"`
    ClientNotes *string  `json:"client_notes"`
}

// AISuggestRequest represents the request payload for AI suggestions
type AISuggestRequest struct {
    Description string  `json:"description" binding:"required"`
    Amount      float64 `json:"amount" binding:"required,gt=0"`
}

// AISuggestResponse represents the AI suggestion response
type AISuggestResponse struct {
    Category    string `json:"category"`
    ClientNotes string `json:"client_notes"`
}

// ApproveSuggestionRequest represents the request to approve/modify AI suggestions
type ApproveSuggestionRequest struct {
    SuggestionID    uint    `json:"suggestion_id" binding:"required"`
    AcceptCategory  bool    `json:"accept_category"`
    AcceptNotes     bool    `json:"accept_notes"`
    CustomCategory  *string `json:"custom_category"`
    CustomNotes     *string `json:"custom_notes"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
    Detail string `json:"detail"`
}

// CategoriesResponse represents the categories response
type CategoriesResponse struct {
    Categories []string `json:"categories"`
}

// DefaultCategories provides a list of default expense categories
var DefaultCategories = []string{
    "Travel",
    "Meals & Entertainment",
    "Office Supplies",
    "Software & Subscriptions",
    "Marketing",
    "Training & Education",
    "Utilities",
    "Equipment",
    "Professional Services",
    "Insurance",
    "Fuel",
    "Parking",
    "Accommodation",
    "Transportation",
    "Communication",
    "Other",
}