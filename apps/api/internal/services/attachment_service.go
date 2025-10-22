package services

import (
    "context"
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
    s3Service   *S3Service
    useS3       bool
}

func NewAttachmentService() *AttachmentService {
    uploadsPath := "./uploads"
    // Create uploads directory if it doesn't exist (fallback for local storage)
    os.MkdirAll(uploadsPath, 0755)
    
    service := &AttachmentService{
        db:          database.GetDB(),
        uploadsPath: uploadsPath,
        useS3:       IsS3Enabled(),
    }
    
    // Initialize S3 service if enabled
    if service.useS3 {
        s3Svc, err := NewS3Service()
        if err != nil {
            // Log error and fall back to local storage
            fmt.Printf("Failed to initialize S3 service: %v. Falling back to local storage.\n", err)
            service.useS3 = false
        } else {
            service.s3Service = s3Svc
            // Verify S3 bucket exists
            ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
            defer cancel()
            if err := s3Svc.CheckBucketExists(ctx); err != nil {
                fmt.Printf("S3 bucket not accessible: %v. Falling back to local storage.\n", err)
                service.useS3 = false
            }
        }
    }
    
    return service
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
    
    var filePath string
    var storageType string
    
    if s.useS3 {
        // Upload to S3
        ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
        defer cancel()
        
        s3Key := fmt.Sprintf("expense-%d/%s", expenseID, filename)
        key, err := s.s3Service.UploadFile(ctx, s3Key, file)
        if err != nil {
            return nil, fmt.Errorf("failed to upload to S3: %w", err)
        }
        
        filePath = key
        storageType = "s3"
    } else {
        // Upload to local filesystem
        localPath := filepath.Join(s.uploadsPath, filename)
        
        // Open uploaded file
        src, err := file.Open()
        if err != nil {
            return nil, fmt.Errorf("failed to open uploaded file: %w", err)
        }
        defer src.Close()
        
        // Create destination file
        dst, err := os.Create(localPath)
        if err != nil {
            return nil, fmt.Errorf("failed to create file: %w", err)
        }
        defer dst.Close()
        
        // Copy file contents
        if _, err = io.Copy(dst, src); err != nil {
            return nil, fmt.Errorf("failed to save file: %w", err)
        }
        
        filePath = localPath
        storageType = "local"
    }
    
    // Create attachment record
    attachment := &models.Attachment{
        ExpenseID:   expenseID,
        Filename:    file.Filename,
        FilePath:    filePath,
        ContentType: file.Header.Get("Content-Type"),
        FileSize:    file.Size,
        UploadedAt:  time.Now(),
        StorageType: storageType,
    }
    
    if err := s.db.Create(attachment).Error; err != nil {
        // Clean up file if database operation fails
        s.cleanupFile(filePath, storageType)
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
    
    // Delete file from storage
    s.cleanupFile(attachment.FilePath, attachment.StorageType)
    
    return nil
}

// GetAttachmentFile returns the file data for an attachment
func (s *AttachmentService) GetAttachmentFile(expenseID, attachmentID uint) (io.ReadCloser, string, int64, error) {
    attachment, err := s.GetAttachment(expenseID, attachmentID)
    if err != nil {
        return nil, "", 0, err
    }
    
    if attachment.StorageType == "s3" && s.s3Service != nil {
        // Download from S3
        ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
        defer cancel()
        
        reader, contentType, size, err := s.s3Service.DownloadFile(ctx, attachment.FilePath)
        if err != nil {
            return nil, "", 0, fmt.Errorf("failed to download from S3: %w", err)
        }
        
        return reader, contentType, size, nil
    } else {
        // Read from local filesystem
        if _, err := os.Stat(attachment.FilePath); os.IsNotExist(err) {
            return nil, "", 0, errors.New("file not found on filesystem")
        }
        
        file, err := os.Open(attachment.FilePath)
        if err != nil {
            return nil, "", 0, fmt.Errorf("failed to open file: %w", err)
        }
        
        // Get file info for size
        fileInfo, err := file.Stat()
        if err != nil {
            file.Close()
            return nil, "", 0, fmt.Errorf("failed to get file info: %w", err)
        }
        
        return file, attachment.ContentType, fileInfo.Size(), nil
    }
}

// GetAttachmentURL returns a URL for accessing the attachment
func (s *AttachmentService) GetAttachmentURL(expenseID, attachmentID uint, expiration time.Duration) (string, error) {
    attachment, err := s.GetAttachment(expenseID, attachmentID)
    if err != nil {
        return "", err
    }
    
    if attachment.StorageType == "s3" && s.s3Service != nil {
        // Generate signed URL for S3
        ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
        defer cancel()
        
        url, err := s.s3Service.GetSignedURL(ctx, attachment.FilePath, expiration)
        if err != nil {
            return "", fmt.Errorf("failed to generate signed URL: %w", err)
        }
        
        return url, nil
    }
    
    // For local files, return the attachment ID (to be handled by download endpoint)
    return fmt.Sprintf("/api/expenses/%d/attachments/%d", expenseID, attachmentID), nil
}

// cleanupFile removes a file based on storage type
func (s *AttachmentService) cleanupFile(filePath, storageType string) {
    if storageType == "s3" && s.s3Service != nil {
        ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
        defer cancel()
        
        if err := s.s3Service.DeleteFile(ctx, filePath); err != nil {
            fmt.Printf("Failed to delete S3 file %s: %v\n", filePath, err)
        }
    } else {
        if err := os.Remove(filePath); err != nil {
            fmt.Printf("Failed to delete local file %s: %v\n", filePath, err)
        }
    }
}

// GetStorageInfo returns information about the current storage configuration
func (s *AttachmentService) GetStorageInfo() map[string]interface{} {
    info := map[string]interface{}{
        "storage_type": "local",
        "s3_enabled":   s.useS3,
    }
    
    if s.useS3 {
        info["storage_type"] = "s3"
    }
    
    return info
}