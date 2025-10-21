package services

import (
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"time"
	
	"gorm.io/gorm"
	
	"github.com/example/next-go-monorepo/apps/api/internal/database"
	"github.com/example/next-go-monorepo/apps/api/internal/models"
)

type AttachmentService struct {
	db          *gorm.DB
	uploadsPath string
}

func NewAttachmentService() *AttachmentService {
	uploadsPath := "./uploads"
	// Create uploads directory if it doesn't exist
	os.MkdirAll(uploadsPath, 0755)
	
	return &AttachmentService{
		db:          database.GetDB(),
		uploadsPath: uploadsPath,
	}
}

// UploadAttachment handles file upload for an expense
func (s *AttachmentService) UploadAttachment(expenseID uint, file *multipart.FileHeader) (*models.Attachment, error) {
	// Verify expense exists
	var expense models.Expense
	if err := s.db.First(&expense, expenseID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("expense not found")
		}
		return nil, err
	}
	
	// Generate unique filename
	timestamp := time.Now().Unix()
	filename := fmt.Sprintf("%d_%s", timestamp, file.Filename)
	filePath := filepath.Join(s.uploadsPath, filename)
	
	// Open uploaded file
	src, err := file.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open uploaded file: %w", err)
	}
	defer src.Close()
	
	// Create destination file
	dst, err := os.Create(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to create file: %w", err)
	}
	defer dst.Close()
	
	// Copy file contents
	if _, err = io.Copy(dst, src); err != nil {
		return nil, fmt.Errorf("failed to save file: %w", err)
	}
	
	// Create attachment record
	attachment := &models.Attachment{
		ExpenseID:   expenseID,
		Filename:    file.Filename,
		FilePath:    filePath,
		ContentType: file.Header.Get("Content-Type"),
		FileSize:    file.Size,
		UploadedAt:  time.Now(),
	}
	
	if err := s.db.Create(attachment).Error; err != nil {
		// Clean up file if database operation fails
		os.Remove(filePath)
		return nil, err
	}
	
	return attachment, nil
}

// GetAttachment retrieves an attachment by ID
func (s *AttachmentService) GetAttachment(expenseID, attachmentID uint) (*models.Attachment, error) {
	var attachment models.Attachment
	
	if err := s.db.Where("expense_id = ? AND id = ?", expenseID, attachmentID).First(&attachment).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("attachment not found")
		}
		return nil, err
	}
	
	return &attachment, nil
}

// DeleteAttachment deletes an attachment and its file
func (s *AttachmentService) DeleteAttachment(expenseID, attachmentID uint) error {
	var attachment models.Attachment
	
	if err := s.db.Where("expense_id = ? AND id = ?", expenseID, attachmentID).First(&attachment).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("attachment not found")
		}
		return err
	}
	
	// Delete from database
	if err := s.db.Delete(&attachment).Error; err != nil {
		return err
	}
	
	// Delete file from filesystem
	if err := os.Remove(attachment.FilePath); err != nil {
		// Log error but don't fail the operation
		// The attachment record has been deleted
	}
	
	return nil
}

// GetAttachmentFile returns the file path for an attachment
func (s *AttachmentService) GetAttachmentFile(expenseID, attachmentID uint) (string, string, error) {
	attachment, err := s.GetAttachment(expenseID, attachmentID)
	if err != nil {
		return "", "", err
	}
	
	// Check if file exists
	if _, err := os.Stat(attachment.FilePath); os.IsNotExist(err) {
		return "", "", errors.New("file not found on filesystem")
	}
	
	return attachment.FilePath, attachment.ContentType, nil
}