resource "aws_elasticache_subnet_group" "main" {
  name = "${var.project_name}-${var.environment}-redis-subnet-group"
  subnet_ids = var.subnet_ids

  tags = {
    Name = "${var.project_name}-${var.environment}-redis-subnet-group"
  }
}

resource "aws_security_group" "redis" {
  name = "${var.project_name}-${var.environment}-redis-sg"
  description = "Security group for ElastiCache Redis"
  vpc_id = var.vpc_id

  ingress {
    description = "Redis from EKS nodes"
    from_port = 6379
    to_port = 6379
    protocol = "tcp"
    security_groups = [var.allowed_security_group_id]
  }

  egress {
    from_port = 0
    to_port = 0
    protocol = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-redis-sg"
  }
}

resource "aws_elasticache_parameter_group" "main" {
  name = "${var.project_name}-${var.environment}-redis7"
  family = "redis7"

  parameter {
    name = "maxmemory-policy"
    value = "allkeys-lru"
  }

  parameter {
    name = "timeout"
    value = "300"
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-redis7-params"
  }
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id = "${var.project_name}-${var.environment}-redis"
  description          = "Redis cluster for ${var.project_name} ${var.environment}"

  engine         = "redis"
  engine_version = "7.0"
  port           = 6379

  node_type = var.node_type
  
  # Cluster mode (sharded) configuration as top-level arguments per AWS provider schema
  num_node_groups         = var.num_cache_clusters
  replicas_per_node_group = var.replicas_per_shard

  parameter_group_name = aws_elasticache_parameter_group.main.name
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = random_password.auth_token.result

  automatic_failover_enabled = true
  multi_az_enabled           = true

  snapshot_retention_limit = 5
  snapshot_window          = "03:00-05:00"
  maintenance_window       = "mon:05:00-mon:07:00"

  auto_minor_version_upgrade = true

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
    Name = "${var.project_name}-${var.environment}-redis"
  }
}

resource "random_password" "auth_token" {
  length = 32
  special = true
}

resource "aws_cloudwatch_log_group" "redis_slow_log" {
  name = "/aws/elasticache/${var.project_name}-${var.environment}-redis/slow-log"
  retention_in_days = 7

  tags = {
    Name = "${var.project_name}-${var.environment}-redis-slow-log"
  }
}

resource "aws_cloudwatch_log_group" "redis_engine_log" {
  name = "/aws/elasticache/${var.project_name}-${var.environment}-redis/engine-log"
  retention_in_days = 7

  tags = {
    Name = "${var.project_name}-${var.environment}-redis-engine-log"
  }
}

# Store Redis credentials in AWS Secrets Manager
resource "aws_secretsmanager_secret" "redis_credentials" {
  name = "${var.project_name}-${var.environment}-redis-credentials"
  description = "ElastiCache Redis credentials"

  recovery_window_in_days = 7

  tags = {
    Name = "${var.project_name}-${var.environment}-redis-credentials"
  }
}

resource "aws_secretsmanager_secret_version" "redis_credentials" {
  secret_id = aws_secretsmanager_secret.redis_credentials.id

  secret_string = jsonencode({
    host = aws_elasticache_replication_group.main.configuration_endpoint_address
    port = aws_elasticache_replication_group.main.port
    auth_token = random_password.auth_token.result
    url = "redis://:${random_password.auth_token.result}@${aws_elasticache_replication_group.main.configuration_endpoint_address}:${aws_elasticache_replication_group.main.port}"
  })
}
