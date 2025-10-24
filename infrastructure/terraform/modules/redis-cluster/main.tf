variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for Redis"
  type        = list(string)
}

variable "node_type" {
  description = "Redis node type"
  type        = string
  default     = "cache.r6g.large"
}

variable "num_cache_clusters" {
  description = "Number of cache clusters (nodes) per replication group"
  type        = number
  default     = 3
}

variable "automatic_failover_enabled" {
  description = "Enable automatic failover"
  type        = bool
  default     = true
}

variable "multi_az_enabled" {
  description = "Enable Multi-AZ"
  type        = bool
  default     = true
}

# Redis Replication Group with Cluster Mode
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "${var.environment}-invoice-saas-redis"
  replication_group_description = "Redis cluster for Invoice SaaS"
  engine                     = "redis"
  engine_version             = "7.0"
  node_type                  = var.node_type
  num_cache_clusters         = var.num_cache_clusters
  parameter_group_name       = aws_elasticache_parameter_group.redis.name
  port                       = 6379
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = [aws_security_group.redis.id]
  
  automatic_failover_enabled = var.automatic_failover_enabled
  multi_az_enabled          = var.multi_az_enabled
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token_enabled         = true
  auth_token                 = random_password.redis_auth_token.result
  
  snapshot_retention_limit   = 7
  snapshot_window           = "03:00-05:00"
  maintenance_window        = "sun:05:00-sun:07:00"
  
  auto_minor_version_upgrade = true
  
  notification_topic_arn    = aws_sns_topic.redis_notifications.arn
  
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_slow_log.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
  }
  
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_engine_log.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "engine-log"
  }
  
  tags = {
    Name        = "${var.environment}-invoice-saas-redis"
    Environment = var.environment
  }
}

# Redis Cluster Mode Enabled (Sharded)
resource "aws_elasticache_replication_group" "redis_cluster" {
  replication_group_id       = "${var.environment}-invoice-saas-redis-cluster"
  replication_group_description = "Redis cluster mode enabled for Invoice SaaS"
  engine                     = "redis"
  engine_version             = "7.0"
  node_type                  = var.node_type
  parameter_group_name       = aws_elasticache_parameter_group.redis_cluster.name
  port                       = 6379
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = [aws_security_group.redis.id]
  
  automatic_failover_enabled = true
  multi_az_enabled          = true
  
  num_node_groups           = 3
  replicas_per_node_group   = 2
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token_enabled         = true
  auth_token                 = random_password.redis_cluster_auth_token.result
  
  snapshot_retention_limit  = 7
  snapshot_window          = "03:00-05:00"
  maintenance_window       = "sun:05:00-sun:07:00"
  
  auto_minor_version_upgrade = true
  
  notification_topic_arn   = aws_sns_topic.redis_notifications.arn
  
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_cluster_slow_log.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
  }
  
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_cluster_engine_log.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "engine-log"
  }
  
  tags = {
    Name        = "${var.environment}-invoice-saas-redis-cluster"
    Environment = var.environment
    Mode        = "cluster"
  }
}

# Parameter Groups
resource "aws_elasticache_parameter_group" "redis" {
  family = "redis7"
  name   = "${var.environment}-invoice-saas-redis"
  
  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }
  
  parameter {
    name  = "timeout"
    value = "300"
  }
  
  parameter {
    name  = "tcp-keepalive"
    value = "300"
  }
  
  parameter {
    name  = "maxmemory-samples"
    value = "5"
  }
  
  tags = {
    Name        = "${var.environment}-invoice-saas-redis"
    Environment = var.environment
  }
}

resource "aws_elasticache_parameter_group" "redis_cluster" {
  family = "redis7"
  name   = "${var.environment}-invoice-saas-redis-cluster"
  
  parameter {
    name  = "cluster-enabled"
    value = "yes"
  }
  
  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }
  
  parameter {
    name  = "timeout"
    value = "300"
  }
  
  parameter {
    name  = "tcp-keepalive"
    value = "300"
  }
  
  tags = {
    Name        = "${var.environment}-invoice-saas-redis-cluster"
    Environment = var.environment
  }
}

# Subnet Group
resource "aws_elasticache_subnet_group" "redis" {
  name       = "${var.environment}-invoice-saas-redis"
  subnet_ids = var.subnet_ids
  
  tags = {
    Name        = "${var.environment}-invoice-saas-redis"
    Environment = var.environment
  }
}

# Security Group
resource "aws_security_group" "redis" {
  name        = "${var.environment}-invoice-saas-redis"
  description = "Security group for Redis cluster"
  vpc_id      = var.vpc_id
  
  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
    description = "Redis access from VPC"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = {
    Name        = "${var.environment}-invoice-saas-redis"
    Environment = var.environment
  }
}

# Auth Tokens
resource "random_password" "redis_auth_token" {
  length  = 32
  special = true
}

resource "random_password" "redis_cluster_auth_token" {
  length  = 32
  special = true
}

# Store auth tokens in Secrets Manager
resource "aws_secretsmanager_secret" "redis_auth" {
  name = "${var.environment}/invoice-saas/redis/auth-token"
  
  tags = {
    Name        = "${var.environment}-invoice-saas-redis-auth"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "redis_auth" {
  secret_id     = aws_secretsmanager_secret.redis_auth.id
  secret_string = random_password.redis_auth_token.result
}

resource "aws_secretsmanager_secret" "redis_cluster_auth" {
  name = "${var.environment}/invoice-saas/redis-cluster/auth-token"
  
  tags = {
    Name        = "${var.environment}-invoice-saas-redis-cluster-auth"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "redis_cluster_auth" {
  secret_id     = aws_secretsmanager_secret.redis_cluster_auth.id
  secret_string = random_password.redis_cluster_auth_token.result
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "redis_slow_log" {
  name              = "/aws/elasticache/${var.environment}-invoice-saas-redis/slow-log"
  retention_in_days = 7
  
  tags = {
    Name        = "${var.environment}-invoice-saas-redis-slow-log"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_group" "redis_engine_log" {
  name              = "/aws/elasticache/${var.environment}-invoice-saas-redis/engine-log"
  retention_in_days = 7
  
  tags = {
    Name        = "${var.environment}-invoice-saas-redis-engine-log"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_group" "redis_cluster_slow_log" {
  name              = "/aws/elasticache/${var.environment}-invoice-saas-redis-cluster/slow-log"
  retention_in_days = 7
  
  tags = {
    Name        = "${var.environment}-invoice-saas-redis-cluster-slow-log"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_group" "redis_cluster_engine_log" {
  name              = "/aws/elasticache/${var.environment}-invoice-saas-redis-cluster/engine-log"
  retention_in_days = 7
  
  tags = {
    Name        = "${var.environment}-invoice-saas-redis-cluster-engine-log"
    Environment = var.environment
  }
}

# SNS Topic for notifications
resource "aws_sns_topic" "redis_notifications" {
  name = "${var.environment}-invoice-saas-redis-notifications"
  
  tags = {
    Name        = "${var.environment}-invoice-saas-redis-notifications"
    Environment = var.environment
  }
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "redis_cpu" {
  alarm_name          = "${var.environment}-invoice-saas-redis-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "75"
  alarm_description   = "Redis CPU utilization is too high"
  alarm_actions       = [aws_sns_topic.redis_notifications.arn]
  
  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.redis.id
  }
}

resource "aws_cloudwatch_metric_alarm" "redis_memory" {
  alarm_name          = "${var.environment}-invoice-saas-redis-memory"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Redis memory usage is too high"
  alarm_actions       = [aws_sns_topic.redis_notifications.arn]
  
  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.redis.id
  }
}

resource "aws_cloudwatch_metric_alarm" "redis_evictions" {
  alarm_name          = "${var.environment}-invoice-saas-redis-evictions"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Evictions"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1000"
  alarm_description   = "Redis evictions are too high"
  alarm_actions       = [aws_sns_topic.redis_notifications.arn]
  
  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.redis.id
  }
}

# Outputs
output "redis_primary_endpoint" {
  description = "Primary endpoint for Redis"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "redis_reader_endpoint" {
  description = "Reader endpoint for Redis"
  value       = aws_elasticache_replication_group.redis.reader_endpoint_address
}

output "redis_cluster_configuration_endpoint" {
  description = "Configuration endpoint for Redis cluster"
  value       = aws_elasticache_replication_group.redis_cluster.configuration_endpoint_address
}

output "redis_auth_token_secret_arn" {
  description = "ARN of the secret containing Redis auth token"
  value       = aws_secretsmanager_secret.redis_auth.arn
}

output "redis_cluster_auth_token_secret_arn" {
  description = "ARN of the secret containing Redis cluster auth token"
  value       = aws_secretsmanager_secret.redis_cluster_auth.arn
}

output "redis_port" {
  description = "Redis port"
  value       = 6379
}
