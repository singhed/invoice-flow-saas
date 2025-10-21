package handlers

import (
	"net/http"
	"time"
	
	"github.com/example/next-go-monorepo/apps/api/internal/models"
)

type GeneralHandler struct{}

func NewGeneralHandler() *GeneralHandler {
	return &GeneralHandler{}
}

// HealthCheck handles GET /
func (h *GeneralHandler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	response := map[string]interface{}{
		"message":   "Expense Management API",
		"version":   "1.0.0",
		"timestamp": time.Now().UTC(),
		"status":    "healthy",
	}
	writeJSON(w, http.StatusOK, response)
}

// GetCategories handles GET /api/categories
func (h *GeneralHandler) GetCategories(w http.ResponseWriter, r *http.Request) {
	response := models.CategoriesResponse{
		Categories: models.DefaultCategories,
	}
	writeJSON(w, http.StatusOK, response)
}