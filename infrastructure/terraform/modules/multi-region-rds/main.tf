variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for DR"
  type        = string
  default     = "us-west-2"
}

variable "db_name" {
  description = "Database name"
  type        = string
}

variable "db_username" {
  description = "Master username"
  type        = string
}

variable "db_password" {
  description = "Master password"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id_primary" {
  description = "VPC ID in primary region"
  type        = string
}

variable "vpc_id_secondary" {
  description = "VPC ID in secondary region"
  type        = string
}

variable "subnet_ids_primary" {
  description = "Subnet IDs in primary region"
  type        = list(string)
}

variable "subnet_ids_secondary" {
  description = "Subnet IDs in secondary region"
  type        = list(string)
}

# Primary Region RDS Cluster
resource "aws_rds_cluster" "primary" {
  provider                    = aws.primary
  cluster_identifier          = "${var.environment}-invoice-saas-primary"
  engine                      = "aurora-postgresql"
  engine_version              = "15.4"
  database_name               = var.db_name
  master_username             = var.db_username
  master_password             = var.db_password
  backup_retention_period     = 35
  preferred_backup_window     = "03:00-04:00"
  preferred_maintenance_window = "mon:04:00-mon:05:00"
  skip_final_snapshot         = false
  final_snapshot_identifier   = "${var.environment}-invoice-saas-final-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  
  db_subnet_group_name        = aws_db_subnet_group.primary.name
  vpc_security_group_ids      = [aws_security_group.rds_primary.id]
  
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  storage_encrypted           = true
  kms_key_id                  = aws_kms_key.rds_primary.arn
  
  deletion_protection         = true
  
  tags = {
    Name        = "${var.environment}-invoice-saas-primary"
    Environment = var.environment
    Region      = var.primary_region
    Type        = "primary"
  }
}

# Primary Region RDS Instances
resource "aws_rds_cluster_instance" "primary_writer" {
  provider             = aws.primary
  identifier           = "${var.environment}-invoice-saas-primary-writer"
  cluster_identifier   = aws_rds_cluster.primary.id
  instance_class       = var.db_instance_class
  engine               = aws_rds_cluster.primary.engine
  engine_version       = aws_rds_cluster.primary.engine_version
  publicly_accessible  = false
  
  performance_insights_enabled = true
  monitoring_interval         = 60
  monitoring_role_arn         = aws_iam_role.rds_monitoring.arn
  
  tags = {
    Name        = "${var.environment}-invoice-saas-primary-writer"
    Environment = var.environment
    Role        = "writer"
  }
}

resource "aws_rds_cluster_instance" "primary_readers" {
  provider             = aws.primary
  count                = 2
  identifier           = "${var.environment}-invoice-saas-primary-reader-${count.index + 1}"
  cluster_identifier   = aws_rds_cluster.primary.id
  instance_class       = var.db_instance_class
  engine               = aws_rds_cluster.primary.engine
  engine_version       = aws_rds_cluster.primary.engine_version
  publicly_accessible  = false
  
  performance_insights_enabled = true
  monitoring_interval         = 60
  monitoring_role_arn         = aws_iam_role.rds_monitoring.arn
  
  tags = {
    Name        = "${var.environment}-invoice-saas-primary-reader-${count.index + 1}"
    Environment = var.environment
    Role        = "reader"
  }
}

# Secondary Region RDS Cluster (Global Database)
resource "aws_rds_global_cluster" "global" {
  global_cluster_identifier = "${var.environment}-invoice-saas-global"
  engine                    = "aurora-postgresql"
  engine_version            = "15.4"
  database_name             = var.db_name
  storage_encrypted         = true
}

resource "aws_rds_cluster" "secondary" {
  provider                    = aws.secondary
  cluster_identifier          = "${var.environment}-invoice-saas-secondary"
  engine                      = aws_rds_global_cluster.global.engine
  engine_version              = aws_rds_global_cluster.global.engine_version
  global_cluster_identifier   = aws_rds_global_cluster.global.id
  
  db_subnet_group_name        = aws_db_subnet_group.secondary.name
  vpc_security_group_ids      = [aws_security_group.rds_secondary.id]
  
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  storage_encrypted           = true
  kms_key_id                  = aws_kms_key.rds_secondary.arn
  
  skip_final_snapshot         = false
  final_snapshot_identifier   = "${var.environment}-invoice-saas-secondary-final-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  
  depends_on = [aws_rds_cluster_instance.primary_writer]
  
  tags = {
    Name        = "${var.environment}-invoice-saas-secondary"
    Environment = var.environment
    Region      = var.secondary_region
    Type        = "secondary"
  }
}

resource "aws_rds_cluster_instance" "secondary_readers" {
  provider             = aws.secondary
  count                = 2
  identifier           = "${var.environment}-invoice-saas-secondary-reader-${count.index + 1}"
  cluster_identifier   = aws_rds_cluster.secondary.id
  instance_class       = var.db_instance_class
  engine               = aws_rds_cluster.secondary.engine
  engine_version       = aws_rds_cluster.secondary.engine_version
  publicly_accessible  = false
  
  performance_insights_enabled = true
  monitoring_interval         = 60
  monitoring_role_arn         = aws_iam_role.rds_monitoring_secondary.arn
  
  tags = {
    Name        = "${var.environment}-invoice-saas-secondary-reader-${count.index + 1}"
    Environment = var.environment
    Role        = "reader"
  }
}

# DB Subnet Groups
resource "aws_db_subnet_group" "primary" {
  provider   = aws.primary
  name       = "${var.environment}-invoice-saas-primary"
  subnet_ids = var.subnet_ids_primary
  
  tags = {
    Name        = "${var.environment}-invoice-saas-primary"
    Environment = var.environment
  }
}

resource "aws_db_subnet_group" "secondary" {
  provider   = aws.secondary
  name       = "${var.environment}-invoice-saas-secondary"
  subnet_ids = var.subnet_ids_secondary
  
  tags = {
    Name        = "${var.environment}-invoice-saas-secondary"
    Environment = var.environment
  }
}

# Security Groups
resource "aws_security_group" "rds_primary" {
  provider    = aws.primary
  name        = "${var.environment}-invoice-saas-rds-primary"
  description = "Security group for RDS primary cluster"
  vpc_id      = var.vpc_id_primary
  
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
    description = "PostgreSQL access from VPC"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = {
    Name        = "${var.environment}-invoice-saas-rds-primary"
    Environment = var.environment
  }
}

resource "aws_security_group" "rds_secondary" {
  provider    = aws.secondary
  name        = "${var.environment}-invoice-saas-rds-secondary"
  description = "Security group for RDS secondary cluster"
  vpc_id      = var.vpc_id_secondary
  
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.1.0.0/16"]
    description = "PostgreSQL access from VPC"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = {
    Name        = "${var.environment}-invoice-saas-rds-secondary"
    Environment = var.environment
  }
}

# KMS Keys for encryption
resource "aws_kms_key" "rds_primary" {
  provider                = aws.primary
  description             = "KMS key for RDS encryption in primary region"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  tags = {
    Name        = "${var.environment}-invoice-saas-rds-primary"
    Environment = var.environment
  }
}

resource "aws_kms_alias" "rds_primary" {
  provider      = aws.primary
  name          = "alias/${var.environment}-invoice-saas-rds-primary"
  target_key_id = aws_kms_key.rds_primary.key_id
}

resource "aws_kms_key" "rds_secondary" {
  provider                = aws.secondary
  description             = "KMS key for RDS encryption in secondary region"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  tags = {
    Name        = "${var.environment}-invoice-saas-rds-secondary"
    Environment = var.environment
  }
}

resource "aws_kms_alias" "rds_secondary" {
  provider      = aws.secondary
  name          = "alias/${var.environment}-invoice-saas-rds-secondary"
  target_key_id = aws_kms_key.rds_secondary.key_id
}

# IAM Role for Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "${var.environment}-invoice-saas-rds-monitoring"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })
  
  tags = {
    Name        = "${var.environment}-invoice-saas-rds-monitoring"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

resource "aws_iam_role" "rds_monitoring_secondary" {
  provider = aws.secondary
  name     = "${var.environment}-invoice-saas-rds-monitoring-secondary"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })
  
  tags = {
    Name        = "${var.environment}-invoice-saas-rds-monitoring-secondary"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring_secondary" {
  provider   = aws.secondary
  role       = aws_iam_role.rds_monitoring_secondary.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "primary_cpu" {
  provider            = aws.primary
  alarm_name          = "${var.environment}-invoice-saas-rds-primary-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "RDS Primary CPU utilization is too high"
  
  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.primary.cluster_identifier
  }
}

resource "aws_cloudwatch_metric_alarm" "primary_connections" {
  provider            = aws.primary
  alarm_name          = "${var.environment}-invoice-saas-rds-primary-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "RDS Primary connection count is too high"
  
  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.primary.cluster_identifier
  }
}

# Outputs
output "primary_cluster_endpoint" {
  description = "Writer endpoint for the primary cluster"
  value       = aws_rds_cluster.primary.endpoint
}

output "primary_reader_endpoint" {
  description = "Reader endpoint for the primary cluster"
  value       = aws_rds_cluster.primary.reader_endpoint
}

output "secondary_reader_endpoint" {
  description = "Reader endpoint for the secondary cluster"
  value       = aws_rds_cluster.secondary.reader_endpoint
}

output "primary_cluster_id" {
  description = "ID of the primary cluster"
  value       = aws_rds_cluster.primary.id
}

output "secondary_cluster_id" {
  description = "ID of the secondary cluster"
  value       = aws_rds_cluster.secondary.id
}

output "global_cluster_id" {
  description = "ID of the global cluster"
  value       = aws_rds_global_cluster.global.id
}
