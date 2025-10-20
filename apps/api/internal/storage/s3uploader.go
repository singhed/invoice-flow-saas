package storage

import (
	"context"
	"fmt"
	"io"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// UploadToS3 uploads the provided content to S3 using default AWS credentials and region.
// bucket must be the target bucket name and key the full object key path.
// contentType is optional; pass empty string to omit.
func UploadToS3(ctx context.Context, bucket, key string, body io.Reader, contentType string) error {
	key = strings.TrimLeft(key, "/")
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return fmt.Errorf("load aws config: %w", err)
	}

	svc := s3.NewFromConfig(cfg)
	input := &s3.PutObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
		Body:   body,
	}
	if strings.TrimSpace(contentType) != "" {
		input.ContentType = aws.String(contentType)
	}

	_, err = svc.PutObject(ctx, input)
	if err != nil {
		return fmt.Errorf("put object: %w", err)
	}
	return nil
}
