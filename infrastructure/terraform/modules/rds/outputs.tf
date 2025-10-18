output "endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.main.endpoint
}

output "address" {
  description = "RDS address"
  value       = aws_db_instance.main.address
}

output "port" {
  description = "RDS port"
  value       = aws_db_instance.main.port
}

output "database_name" {
  description = "Database name"
  value       = aws_db_instance.main.db_name
}

output "username" {
  description = "Master username"
  value       = aws_db_instance.main.username
  sensitive   = true
}

output "password" {
  description = "Master password"
  value       = random_password.master.result
  sensitive   = true
}

output "secret_arn" {
  description = "Secrets Manager ARN for RDS credentials"
  value       = aws_secretsmanager_secret.rds_credentials.arn
}
