package handlers

import (
    "io"
    "net/http"
    "strconv"
    
    "github.com/gorilla/mux"
    
    "github.com/example/next-go-monorepo/apps/api/internal/services"
)

type AttachmentHandler struct {
    attachmentService *services.AttachmentService
}

func NewAttachmentHandler() *AttachmentHandler {
    return &AttachmentHandler{
        attachmentService: services.NewAttachmentService(),
    }
}

// UploadAttachment handles POST /api/expenses/{expense_id}/attachments
func (h *AttachmentHandler) UploadAttachment(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    expenseID, err := strconv.ParseUint(vars["expense_id"], 10, 32)
    if err != nil {
        writeError(w, http.StatusBadRequest, "Invalid expense ID")
        return
    }
    
    // Parse multipart form
    if err := r.ParseMultipartForm(10 << 20); err != nil { // 10 MB max
        writeError(w, http.StatusBadRequest, "Failed to parse form data")
        return
    }
    
    file, header, err := r.FormFile("file")
    if err != nil {
        writeError(w, http.StatusBadRequest, "No file provided")
        return
    }
    defer file.Close()
    
    // Check file size (10MB max)
    if header.Size > 10<<20 {
        writeError(w, http.StatusBadRequest, "File too large (max 10MB)")
        return
    }
    
    attachment, err := h.attachmentService.UploadAttachment(uint(expenseID), header)
    if err != nil {
        if err.Error() == "expense not found" {
            writeError(w, http.StatusNotFound, "Expense not found")
        } else {
            writeError(w, http.StatusInternalServerError, "Failed to upload file")
        }
        return
    }
    
    writeJSON(w, http.StatusOK, attachment)
}

// GetAttachment handles GET /api/expenses/{expense_id}/attachments/{attachment_id}
func (h *AttachmentHandler) GetAttachment(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    
    expenseID, err := strconv.ParseUint(vars["expense_id"], 10, 32)
    if err != nil {
        writeError(w, http.StatusBadRequest, "Invalid expense ID")
        return
    }
    
    attachmentID, err := strconv.ParseUint(vars["attachment_id"], 10, 32)
    if err != nil {
        writeError(w, http.StatusBadRequest, "Invalid attachment ID")
        return
    }
    
    reader, contentType, size, err := h.attachmentService.GetAttachmentFile(uint(expenseID), uint(attachmentID))
    if err != nil {
        switch {
        case err.Error() == "attachment not found":
            writeError(w, http.StatusNotFound, "Attachment not found")
        case err.Error() == "file not found on filesystem":
            writeError(w, http.StatusNotFound, "File not found")
        default:
            writeError(w, http.StatusInternalServerError, "Failed to retrieve file")
        }
        return
    }
    defer reader.Close()
    
    // Set headers
    w.Header().Set("Content-Type", contentType)
    if size > 0 {
        w.Header().Set("Content-Length", strconv.FormatInt(size, 10))
    }
    
    // Stream the file content
    _, err = io.Copy(w, reader)
    if err != nil {
        // Log error but response may already be started
    }
}

// DeleteAttachment handles DELETE /api/expenses/{expense_id}/attachments/{attachment_id}
func (h *AttachmentHandler) DeleteAttachment(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    
    expenseID, err := strconv.ParseUint(vars["expense_id"], 10, 32)
    if err != nil {
        writeError(w, http.StatusBadRequest, "Invalid expense ID")
        return
    }
    
    attachmentID, err := strconv.ParseUint(vars["attachment_id"], 10, 32)
    if err != nil {
        writeError(w, http.StatusBadRequest, "Invalid attachment ID")
        return
    }
    
    err = h.attachmentService.DeleteAttachment(uint(expenseID), uint(attachmentID))
    if err != nil {
        if err.Error() == "attachment not found" {
            writeError(w, http.StatusNotFound, "Attachment not found")
        } else {
            writeError(w, http.StatusInternalServerError, "Failed to delete attachment")
        }
        return
    }
    
    w.WriteHeader(http.StatusNoContent)
}