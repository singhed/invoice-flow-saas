package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"
	
	"github.com/gorilla/mux"
	
	"github.com/example/next-go-monorepo/apps/api/internal/models"
	"github.com/example/next-go-monorepo/apps/api/internal/services"
)

type ExpenseHandler struct {
	expenseService *services.ExpenseService
	aiService      *services.AIService
}

func NewExpenseHandler() *ExpenseHandler {
	return &ExpenseHandler{
		expenseService: services.NewExpenseService(),
		aiService:      services.NewAIService(),
	}
}

// CreateExpense handles POST /api/expenses
func (h *ExpenseHandler) CreateExpense(w http.ResponseWriter, r *http.Request) {
	var req models.CreateExpenseRequest
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	
	// Validate required fields
	if req.Description == "" {
		writeError(w, http.StatusBadRequest, "Description is required")
		return
	}
	
	if req.Amount <= 0 {
		writeError(w, http.StatusBadRequest, "Amount must be greater than 0")
		return
	}
	
	// Set default date if not provided
	if req.Date.IsZero() {
		req.Date = time.Now()
	}
	
	expense, err := h.expenseService.CreateExpense(req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create expense")
		return
	}
	
	writeJSON(w, http.StatusCreated, expense)
}

// GetExpenses handles GET /api/expenses
func (h *ExpenseHandler) GetExpenses(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	
	skip := 0
	if skipStr := query.Get("skip"); skipStr != "" {
		if s, err := strconv.Atoi(skipStr); err == nil && s >= 0 {
			skip = s
		}
	}
	
	limit := 100 // Default limit
	if limitStr := query.Get("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			if l > 1000 { // Max limit for safety
				l = 1000
			}
			limit = l
		}
	}
	
	expenses, err := h.expenseService.GetExpenses(skip, limit)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to retrieve expenses")
		return
	}
	
	writeJSON(w, http.StatusOK, expenses)
}

// GetExpenseByID handles GET /api/expenses/{expense_id}
func (h *ExpenseHandler) GetExpenseByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.ParseUint(vars["expense_id"], 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid expense ID")
		return
	}
	
	expense, err := h.expenseService.GetExpenseByID(uint(id))
	if err != nil {
		if err.Error() == "expense not found" {
			writeError(w, http.StatusNotFound, "Expense not found")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to retrieve expense")
		}
		return
	}
	
	writeJSON(w, http.StatusOK, expense)
}

// UpdateExpense handles PUT /api/expenses/{expense_id}
func (h *ExpenseHandler) UpdateExpense(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.ParseUint(vars["expense_id"], 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid expense ID")
		return
	}
	
	var req models.UpdateExpenseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	
	// Validate amount if provided
	if req.Amount != nil && *req.Amount <= 0 {
		writeError(w, http.StatusBadRequest, "Amount must be greater than 0")
		return
	}
	
	expense, err := h.expenseService.UpdateExpense(uint(id), req)
	if err != nil {
		if err.Error() == "expense not found" {
			writeError(w, http.StatusNotFound, "Expense not found")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to update expense")
		}
		return
	}
	
	writeJSON(w, http.StatusOK, expense)
}

// DeleteExpense handles DELETE /api/expenses/{expense_id}
func (h *ExpenseHandler) DeleteExpense(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.ParseUint(vars["expense_id"], 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid expense ID")
		return
	}
	
	err = h.expenseService.DeleteExpense(uint(id))
	if err != nil {
		if err.Error() == "expense not found" {
			writeError(w, http.StatusNotFound, "Expense not found")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to delete expense")
		}
		return
	}
	
	w.WriteHeader(http.StatusNoContent)
}

// GetAISuggestion handles POST /api/expenses/ai-suggest
func (h *ExpenseHandler) GetAISuggestion(w http.ResponseWriter, r *http.Request) {
	var req models.AISuggestRequest
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	
	if req.Description == "" {
		writeError(w, http.StatusBadRequest, "Description is required")
		return
	}
	
	if req.Amount <= 0 {
		writeError(w, http.StatusBadRequest, "Amount must be greater than 0")
		return
	}
	
	suggestion, err := h.aiService.GetAISuggestion(req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to generate AI suggestion")
		return
	}
	
	writeJSON(w, http.StatusOK, suggestion)
}

// ApproveSuggestion handles POST /api/expenses/{expense_id}/ai-suggestions/{suggestion_id}/approve
func (h *ExpenseHandler) ApproveSuggestion(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	expenseID, err := strconv.ParseUint(vars["expense_id"], 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid expense ID")
		return
	}
	
	var req models.ApproveSuggestionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	
	expense, err := h.aiService.ApproveSuggestion(uint(expenseID), req)
	if err != nil {
		switch err.Error() {
		case "expense not found", "suggestion not found":
			writeError(w, http.StatusNotFound, err.Error())
		case "suggestion does not belong to this expense":
			writeError(w, http.StatusBadRequest, err.Error())
		default:
			writeError(w, http.StatusInternalServerError, "Failed to approve suggestion")
		}
		return
	}
	
	writeJSON(w, http.StatusOK, expense)
}

// Helper functions
func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, models.ErrorResponse{Detail: message})
}