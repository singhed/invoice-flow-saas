package services

import (
    "bytes"
    "context"
    "fmt"
    "io"
    "mime/multipart"
    "os"
    "strings"
    "time"

    "github.com/aws/aws-sdk-go-v2/aws"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/s3"
    "github.com/aws/aws-sdk-go-v2/service/s3/types"
)

// S3Config holds S3 configuration
type S3Config struct {
    Bucket    string
    Region    string
    Prefix    string
    Endpoint  string // For S3-compatible services like MinIO
    UseSSL    bool
    PublicURL string // Base URL for public access
}

// S3Service handles S3 operations
type S3Service struct {
    client *s3.Client
    config S3Config
}

// NewS3Service creates a new S3 service
func NewS3Service() (*S3Service, error) {
    s3Config := S3Config{
        Bucket:    getEnv("S3_BUCKET", ""),
        Region:    getEnv("AWS_REGION", "us-east-1"),
        Prefix:    getEnv("S3_PREFIX", "attachments"),
        Endpoint:  getEnv("S3_ENDPOINT", ""),
        UseSSL:    getEnv("S3_USE_SSL", "true") == "true",
        PublicURL: getEnv("S3_PUBLIC_URL", ""),
    }
    
    // Skip S3 setup if bucket is not configured
    if s3Config.Bucket == "" {
        return nil, fmt.Errorf("S3_BUCKET not configured")
    }
    
    // Load AWS config
    cfg, err := config.LoadDefaultConfig(context.Background(), config.WithRegion(s3Config.Region))
    if err != nil {
        return nil, fmt.Errorf("failed to load AWS config: %w", err)
    }
    
    // Create S3 client
    var client *s3.Client
    if s3Config.Endpoint != "" {
        // Custom endpoint (e.g., MinIO)
        customResolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
            return aws.Endpoint{
                URL:               s3Config.Endpoint,
                HostnameImmutable: true,
            }, nil
        })
        
        cfg.EndpointResolverWithOptions = customResolver
        client = s3.NewFromConfig(cfg, func(o *s3.Options) {
            o.UsePathStyle = true
        })
    } else {
        client = s3.NewFromConfig(cfg)
    }
    
    return &S3Service{
        client: client,
        config: s3Config,
    }, nil
}

// UploadFile uploads a file to S3
func (s *S3Service) UploadFile(ctx context.Context, key string, file *multipart.FileHeader) (string, error) {
    // Open the uploaded file
    src, err := file.Open()
    if err != nil {
        return "", fmt.Errorf("failed to open uploaded file: %w", err)
    }
    defer src.Close()
    
    // Read file content into memory (for files up to 10MB this should be fine)
    content, err := io.ReadAll(src)
    if err != nil {
        return "", fmt.Errorf("failed to read file content: %w", err)
    }
    
    // Generate full S3 key
    fullKey := s.generateKey(key)
    
    // Upload to S3
    input := &s3.PutObjectInput{
        Bucket:      aws.String(s.config.Bucket),
        Key:         aws.String(fullKey),
        Body:        bytes.NewReader(content),
        ContentType: aws.String(file.Header.Get("Content-Type")),
    }
    
    _, err = s.client.PutObject(ctx, input)
    if err != nil {
        return "", fmt.Errorf("failed to upload to S3: %w", err)
    }
    
    return fullKey, nil
}

// DownloadFile downloads a file from S3
func (s *S3Service) DownloadFile(ctx context.Context, key string) (io.ReadCloser, string, int64, error) {
    input := &s3.GetObjectInput{
        Bucket: aws.String(s.config.Bucket),
        Key:    aws.String(key),
    }
    
    result, err := s.client.GetObject(ctx, input)
    if err != nil {
        return nil, "", 0, fmt.Errorf("failed to download from S3: %w", err)
    }
    
    contentType := "application/octet-stream"
    if result.ContentType != nil {
        contentType = *result.ContentType
    }
    
    contentLength := int64(0)
    if result.ContentLength != nil {
        contentLength = *result.ContentLength
    }
    
    return result.Body, contentType, contentLength, nil
}

// DeleteFile deletes a file from S3
func (s *S3Service) DeleteFile(ctx context.Context, key string) error {
    input := &s3.DeleteObjectInput{
        Bucket: aws.String(s.config.Bucket),
        Key:    aws.String(key),
    }
    
    _, err := s.client.DeleteObject(ctx, input)
    if err != nil {
        return fmt.Errorf("failed to delete from S3: %w", err)
    }
    
    return nil
}

// GetSignedURL generates a presigned URL for file access
func (s *S3Service) GetSignedURL(ctx context.Context, key string, expiration time.Duration) (string, error) {
    presignClient := s3.NewPresignClient(s.client)
    
    input := &s3.GetObjectInput{
        Bucket: aws.String(s.config.Bucket),
        Key:    aws.String(key),
    }
    
    result, err := presignClient.PresignGetObject(ctx, input, func(opts *s3.PresignOptions) {
        opts.Expires = expiration
    })
    if err != nil {
        return "", fmt.Errorf("failed to generate presigned URL: %w", err)
    }
    
    return result.URL, nil
}

// GetPublicURL generates a public URL for the file
func (s *S3Service) GetPublicURL(key string) string {
    if s.config.PublicURL != "" {
        return fmt.Sprintf("%s/%s", strings.TrimRight(s.config.PublicURL, "/"), key)
    }
    
    if s.config.Endpoint != "" {
        // Custom endpoint
        return fmt.Sprintf("%s/%s/%s", s.config.Endpoint, s.config.Bucket, key)
    }
    
    // Standard AWS S3 URL
    return fmt.Sprintf("https://s3.%s.amazonaws.com/%s/%s", s.config.Region, s.config.Bucket, key)
}

// ListFiles lists files in the S3 bucket with optional prefix
func (s *S3Service) ListFiles(ctx context.Context, prefix string) ([]string, error) {
    fullPrefix := s.generateKey(prefix)
    
    input := &s3.ListObjectsV2Input{
        Bucket: aws.String(s.config.Bucket),
        Prefix: aws.String(fullPrefix),
    }
    
    var files []string
    paginator := s3.NewListObjectsV2Paginator(s.client, input)
    
    for paginator.HasMorePages() {
        page, err := paginator.NextPage(ctx)
        if err != nil {
            return nil, fmt.Errorf("failed to list objects: %w", err)
        }
        
        for _, obj := range page.Contents {
            if obj.Key != nil {
                files = append(files, *obj.Key)
            }
        }
    }
    
    return files, nil
}

// CheckBucketExists verifies if the bucket exists and is accessible
func (s *S3Service) CheckBucketExists(ctx context.Context) error {
    _, err := s.client.HeadBucket(ctx, &s3.HeadBucketInput{
        Bucket: aws.String(s.config.Bucket),
    })
    if err != nil {
        return fmt.Errorf("bucket %s is not accessible: %w", s.config.Bucket, err)
    }
    
    return nil
}

// CreateBucket creates the S3 bucket if it doesn't exist
func (s *S3Service) CreateBucket(ctx context.Context) error {
    // Check if bucket already exists
    err := s.CheckBucketExists(ctx)
    if err == nil {
        return nil // Bucket already exists
    }
    
    // Create bucket
    input := &s3.CreateBucketInput{
        Bucket: aws.String(s.config.Bucket),
    }
    
    // For regions other than us-east-1, we need to specify the location constraint
    if s.config.Region != "us-east-1" {
        input.CreateBucketConfiguration = &types.CreateBucketConfiguration{
            LocationConstraint: types.BucketLocationConstraint(s.config.Region),
        }
    }
    
    _, err = s.client.CreateBucket(ctx, input)
    if err != nil {
        return fmt.Errorf("failed to create bucket %s: %w", s.config.Bucket, err)
    }
    
    return nil
}

// generateKey creates a full S3 key with prefix
func (s *S3Service) generateKey(key string) string {
    if s.config.Prefix == "" {
        return key
    }
    
    return fmt.Sprintf("%s/%s", strings.Trim(s.config.Prefix, "/"), key)
}

// getEnv gets environment variable with fallback
func getEnv(key, fallback string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return fallback
}

// IsS3Enabled checks if S3 is configured and enabled
func IsS3Enabled() bool {
    return os.Getenv("S3_BUCKET") != ""
}