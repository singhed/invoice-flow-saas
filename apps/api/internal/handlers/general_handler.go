package handlers

import (
    "net/http"
    "time"
    
    "github.com/example/next-go-monorepo/apps/api/internal/models"
    "github.com/example/next-go-monorepo/apps/api/internal/services"
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

// GetSystemInfo handles GET /api/system/info
func (h *GeneralHandler) GetSystemInfo(w http.ResponseWriter, r *http.Request) {
    attachmentService := services.NewAttachmentService()
    storageInfo := attachmentService.GetStorageInfo()
    
    response := map[string]interface{}{
        "api_version":    "1.0.0",
        "storage":        storageInfo,
        "rate_limiting":  map[string]interface{}{
            "enabled": true, // This could be made configurable
        },
        "features": []string{
            "expense_management",
            "file_attachments", 
            "ai_suggestions",
            "s3_storage",
            "rate_limiting",
        },
        "timestamp": time.Now().UTC(),
    }
    
    writeJSON(w, http.StatusOK, response)
}