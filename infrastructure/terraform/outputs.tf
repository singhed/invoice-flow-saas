output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "eks_cluster_id" {
  description = "EKS cluster ID"
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_security_group_id" {
  description = "EKS cluster security group ID"
  value       = module.eks.cluster_security_group_id
}

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = module.rds.endpoint
  sensitive   = true
}

output "rds_database_name" {
  description = "RDS database name"
  value       = module.rds.database_name
}

output "rds_username" {
  description = "RDS master username"
  value       = module.rds.username
  sensitive   = true
}

output "rds_password" {
  description = "RDS master password"
  value       = module.rds.password
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis configuration endpoint"
  value       = module.elasticache.configuration_endpoint
  sensitive   = true
}

output "redis_port" {
  description = "Redis port"
  value       = module.elasticache.port
}

output "sqs_invoice_processing_queue_url" {
  description = "SQS invoice processing queue URL"
  value       = module.sqs.invoice_processing_queue_url
}

output "sqs_payment_notification_queue_url" {
  description = "SQS payment notification queue URL"
  value       = module.sqs.payment_notification_queue_url
}

output "sqs_email_queue_url" {
  description = "SQS email queue URL"
  value       = module.sqs.email_queue_url
}

output "s3_invoice_bucket_name" {
  description = "S3 bucket name for invoices"
  value       = module.s3.invoice_bucket_name
}

output "s3_invoice_bucket_arn" {
  description = "S3 bucket ARN for invoices"
  value       = module.s3.invoice_bucket_arn
}

output "s3_report_bucket_name" {
  description = "S3 bucket name for reports"
  value       = module.s3.report_bucket_name
}

output "s3_report_bucket_arn" {
  description = "S3 bucket ARN for reports"
  value       = module.s3.report_bucket_arn
}

output "cloudwatch_log_group_name" {
  description = "CloudWatch log group name"
  value       = module.cloudwatch.log_group_name
}
