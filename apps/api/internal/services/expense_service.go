package services

import (
    "errors"
    "strings"
    "time"
    
    "gorm.io/gorm"
    
    "github.com/example/next-go-monorepo/apps/api/internal/database"
    "github.com/example/next-go-monorepo/apps/api/internal/models"
)

type ExpenseService struct {
    db *gorm.DB
}

func NewExpenseService() *ExpenseService {
    return &ExpenseService{
        db: database.GetDB(),
    }
}

// CreateExpense creates a new expense
func (s *ExpenseService) CreateExpense(req models.CreateExpenseRequest) (*models.Expense, error) {
    expense := &models.Expense{
        Description: req.Description,
        Amount:      req.Amount,
        Date:        req.Date,
        Category:    req.Category,
        ClientNotes: req.ClientNotes,
        CreatedAt:   time.Now(),
        UpdatedAt:   time.Now(),
    }
    
    if expense.Date.IsZero() {
        expense.Date = time.Now()
    }
    
    if err := s.db.Create(expense).Error; err != nil {
        return nil, err
    }
    
    // Generate AI suggestions if requested
    if req.RequestAISuggestion {
        if err := s.generateAISuggestion(expense.ID, req.Description, req.Amount); err != nil {
            // Log error but don't fail the expense creation
            // TODO: Add proper logging
        }
    }
    
    // Reload expense with associations
    if err := s.db.Preload("Attachments").Preload("AISuggestions").First(expense, expense.ID).Error; err != nil {
        return nil, err
    }
    
    return expense, nil
}

// GetExpenses retrieves expenses with pagination
func (s *ExpenseService) GetExpenses(skip, limit int) ([]models.Expense, error) {
    var expenses []models.Expense
    
    query := s.db.Preload("Attachments").Preload("AISuggestions")
    
    if skip > 0 {
        query = query.Offset(skip)
    }
    
    if limit > 0 {
        query = query.Limit(limit)
    }
    
    if err := query.Order("created_at DESC").Find(&expenses).Error; err != nil {
        return nil, err
    }
    
    return expenses, nil
}

// GetExpenseByID retrieves a specific expense
func (s *ExpenseService) GetExpenseByID(id uint) (*models.Expense, error) {
    var expense models.Expense
    
    if err := s.db.Preload("Attachments").Preload("AISuggestions").First(&expense, id).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, errors.New("expense not found")
        }
        return nil, err
    }
    
    return &expense, nil
}

// UpdateExpense updates an existing expense
func (s *ExpenseService) UpdateExpense(id uint, req models.UpdateExpenseRequest) (*models.Expense, error) {
    var expense models.Expense
    
    if err := s.db.First(&expense, id).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, errors.New("expense not found")
        }
        return nil, err
    }
    
    // Update fields that are provided
    if req.Description != nil {
        expense.Description = *req.Description
    }
    if req.Amount != nil {
        expense.Amount = *req.Amount
    }
    if req.Date != nil {
        expense.Date = *req.Date
    }
    if req.Category != nil {
        expense.Category = *req.Category
    }
    if req.ClientNotes != nil {
        expense.ClientNotes = *req.ClientNotes
    }
    
    expense.UpdatedAt = time.Now()
    
    if err := s.db.Save(&expense).Error; err != nil {
        return nil, err
    }
    
    // Reload with associations
    if err := s.db.Preload("Attachments").Preload("AISuggestions").First(&expense, expense.ID).Error; err != nil {
        return nil, err
    }
    
    return &expense, nil
}

// DeleteExpense deletes an expense and its associated data
func (s *ExpenseService) DeleteExpense(id uint) error {
    var expense models.Expense
    
    if err := s.db.First(&expense, id).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return errors.New("expense not found")
        }
        return err
    }
    
    // Delete associated attachments and AI suggestions (cascade)
    if err := s.db.Select("Attachments", "AISuggestions").Delete(&expense).Error; err != nil {
        return err
    }
    
    return nil
}

// generateAISuggestion generates AI suggestions for an expense
func (s *ExpenseService) generateAISuggestion(expenseID uint, description string, amount float64) error {
    // Simple rule-based AI for now (could be replaced with actual AI service)
    category := s.categorizeExpense(description, amount)
    notes := s.generateNotes(description, amount, category)
    
    suggestion := &models.AISuggestion{
        ExpenseID:         expenseID,
        SuggestedCategory: category,
        SuggestedNotes:    notes,
        CreatedAt:         time.Now(),
        ModelUsed:         "rule-based-v1",
    }
    
    return s.db.Create(suggestion).Error
}

// categorizeExpense provides simple rule-based categorization
func (s *ExpenseService) categorizeExpense(description string, amount float64) string {
    desc := strings.ToLower(description)
    
    // Travel-related keywords
    if containsAny(desc, []string{"flight", "hotel", "taxi", "uber", "lyft", "airport", "travel", "trip"}) {
        return "Travel"
    }
    
    // Meals & Entertainment
    if containsAny(desc, []string{"lunch", "dinner", "breakfast", "coffee", "restaurant", "meal", "food", "client"}) {
        return "Meals & Entertainment"
    }
    
    // Office supplies
    if containsAny(desc, []string{"office", "supplies", "pen", "paper", "notebook", "stapler", "printer"}) {
        return "Office Supplies"
    }
    
    // Software & Subscriptions
    if containsAny(desc, []string{"software", "subscription", "saas", "license", "app", "service"}) {
        return "Software & Subscriptions"
    }
    
    // Fuel
    if containsAny(desc, []string{"gas", "fuel", "petrol", "gasoline"}) {
        return "Fuel"
    }
    
    // Equipment
    if containsAny(desc, []string{"laptop", "computer", "monitor", "keyboard", "mouse", "equipment"}) {
        return "Equipment"
    }
    
    // Default based on amount
    if amount > 500 {
        return "Equipment"
    } else if amount < 50 {
        return "Office Supplies"
    }
    
    return "Other"
}

// generateNotes creates contextual notes based on expense details
func (s *ExpenseService) generateNotes(description string, amount float64, category string) string {
    switch category {
    case "Travel":
        return "Business travel expense for work-related activities."
    case "Meals & Entertainment":
        if strings.Contains(strings.ToLower(description), "client") {
            return "Client relationship building meeting to discuss business opportunities."
        }
        return "Business meal expense related to work activities."
    case "Office Supplies":
        return "Office supplies purchased for daily business operations."
    case "Software & Subscriptions":
        return "Software or service subscription necessary for business operations."
    case "Fuel":
        return "Vehicle fuel expense for business-related travel."
    case "Equipment":
        return "Business equipment purchase to support work operations."
    default:
        return "Business expense for work-related activities."
    }
}

// containsAny checks if the text contains any of the given keywords
func containsAny(text string, keywords []string) bool {
    for _, keyword := range keywords {
        if strings.Contains(text, keyword) {
            return true
        }
    }
    return false
}