package services

import (
	"errors"
	"strings"
	"time"
	
	"gorm.io/gorm"
	
	"github.com/example/next-go-monorepo/apps/api/internal/database"
	"github.com/example/next-go-monorepo/apps/api/internal/models"
)

type AIService struct {
	db *gorm.DB
}

func NewAIService() *AIService {
	return &AIService{
		db: database.GetDB(),
	}
}

// GetAISuggestion generates AI suggestions for expense categorization
func (s *AIService) GetAISuggestion(req models.AISuggestRequest) (*models.AISuggestResponse, error) {
	// Simple rule-based AI implementation
	category := s.categorizeExpense(req.Description, req.Amount)
	notes := s.generateNotes(req.Description, req.Amount, category)
	
	return &models.AISuggestResponse{
		Category:    category,
		ClientNotes: notes,
	}, nil
}

// ApproveSuggestion handles approval or modification of AI suggestions
func (s *AIService) ApproveSuggestion(expenseID uint, req models.ApproveSuggestionRequest) (*models.Expense, error) {
	// Get the AI suggestion
	var suggestion models.AISuggestion
	if err := s.db.First(&suggestion, req.SuggestionID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("suggestion not found")
		}
		return nil, err
	}
	
	// Verify the suggestion belongs to the expense
	if suggestion.ExpenseID != expenseID {
		return nil, errors.New("suggestion does not belong to this expense")
	}
	
	// Get the expense
	var expense models.Expense
	if err := s.db.First(&expense, expenseID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("expense not found")
		}
		return nil, err
	}
	
	// Update the suggestion based on user's choice
	finalCategory := suggestion.SuggestedCategory
	finalNotes := suggestion.SuggestedNotes
	userModified := false
	
	if !req.AcceptCategory && req.CustomCategory != nil {
		finalCategory = *req.CustomCategory
		userModified = true
	}
	
	if !req.AcceptNotes && req.CustomNotes != nil {
		finalNotes = *req.CustomNotes
		userModified = true
	}
	
	// Update suggestion record
	suggestion.WasAccepted = req.AcceptCategory && req.AcceptNotes && req.CustomCategory == nil && req.CustomNotes == nil
	suggestion.UserModified = userModified
	suggestion.FinalCategory = finalCategory
	suggestion.FinalNotes = finalNotes
	
	if err := s.db.Save(&suggestion).Error; err != nil {
		return nil, err
	}
	
	// Update the expense with final values
	expense.Category = finalCategory
	expense.ClientNotes = finalNotes
	expense.UpdatedAt = time.Now()
	
	if err := s.db.Save(&expense).Error; err != nil {
		return nil, err
	}
	
	// Reload expense with associations
	if err := s.db.Preload("Attachments").Preload("AISuggestions").First(&expense, expense.ID).Error; err != nil {
		return nil, err
	}
	
	return &expense, nil
}

// categorizeExpense provides simple rule-based categorization
func (s *AIService) categorizeExpense(description string, amount float64) string {
	desc := strings.ToLower(description)
	
	// Travel-related keywords
	if s.containsAny(desc, []string{"flight", "hotel", "taxi", "uber", "lyft", "airport", "travel", "trip"}) {
		return "Travel"
	}
	
	// Meals & Entertainment
	if s.containsAny(desc, []string{"lunch", "dinner", "breakfast", "coffee", "restaurant", "meal", "food", "client"}) {
		return "Meals & Entertainment"
	}
	
	// Office supplies
	if s.containsAny(desc, []string{"office", "supplies", "pen", "paper", "notebook", "stapler", "printer"}) {
		return "Office Supplies"
	}
	
	// Software & Subscriptions
	if s.containsAny(desc, []string{"software", "subscription", "saas", "license", "app", "service"}) {
		return "Software & Subscriptions"
	}
	
	// Fuel
	if s.containsAny(desc, []string{"gas", "fuel", "petrol", "gasoline"}) {
		return "Fuel"
	}
	
	// Equipment
	if s.containsAny(desc, []string{"laptop", "computer", "monitor", "keyboard", "mouse", "equipment"}) {
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
func (s *AIService) generateNotes(description string, amount float64, category string) string {
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
func (s *AIService) containsAny(text string, keywords []string) bool {
	for _, keyword := range keywords {
		if strings.Contains(text, keyword) {
			return true
		}
	}
	return false
}