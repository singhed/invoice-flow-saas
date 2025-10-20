output "invoice_bucket_name" {
  description = "Invoice S3 bucket name"
  value       = aws_s3_bucket.invoices.id
}

output "invoice_bucket_arn" {
  description = "Invoice S3 bucket ARN"
  value       = aws_s3_bucket.invoices.arn
}

output "invoice_bucket_domain_name" {
  description = "Invoice S3 bucket domain name"
  value       = aws_s3_bucket.invoices.bucket_domain_name
}

output "report_bucket_name" {
  description = "Reports S3 bucket name"
  value       = aws_s3_bucket.reports.id
}

output "report_bucket_arn" {
  description = "Reports S3 bucket ARN"
  value       = aws_s3_bucket.reports.arn
}

output "report_bucket_domain_name" {
  description = "Reports S3 bucket domain name"
  value       = aws_s3_bucket.reports.bucket_domain_name
}
