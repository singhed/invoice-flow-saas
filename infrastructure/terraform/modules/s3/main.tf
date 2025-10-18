resource "aws_s3_bucket" "invoices" {
  bucket = "${var.project_name}-${var.environment}-invoices"

  tags = {
    Name = "${var.project_name}-${var.environment}-invoices"
  }
}

resource "aws_s3_bucket_versioning" "invoices" {
  bucket = aws_s3_bucket.invoices.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "invoices" {
  bucket = aws_s3_bucket.invoices.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "invoices" {
  bucket = aws_s3_bucket.invoices.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "invoices" {
  bucket = aws_s3_bucket.invoices.id

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }
  }

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    transition {
      days          = 180
      storage_class = "GLACIER"
    }
  }

  rule {
    id     = "delete-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "invoices" {
  bucket = aws_s3_bucket.invoices.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# Bucket policy for EKS access
resource "aws_s3_bucket_policy" "invoices" {
  bucket = aws_s3_bucket.invoices.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowEKSAccess"
        Effect = "Allow"
        Principal = {
          AWS = "*"
        }
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.invoices.arn,
          "${aws_s3_bucket.invoices.arn}/*"
        ]
      }
    ]
  })
}
