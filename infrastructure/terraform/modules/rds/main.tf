resource "random_password" "master" {
  length = 32
  special = true
}

resource "aws_db_subnet_group" "main" {
  name = "${var.project_name}-${var.environment}-db-subnet-group"
  subnet_ids = var.database_subnet_ids

  tags = {
    Name = "${var.project_name}-${var.environment}-db-subnet-group"
  }
}

resource "aws_security_group" "rds" {
  name = "${var.project_name}-${var.environment}-rds-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id = var.vpc_id

  ingress {
    description = "PostgreSQL from EKS nodes"
    from_port = 5432
    to_port = 5432
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
    Name = "${var.project_name}-${var.environment}-rds-sg"
  }
}

resource "aws_db_parameter_group" "main" {
  name = "${var.project_name}-${var.environment}-pg15"
  family = "postgres15"

  parameter {
    name = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  parameter {
    name = "log_statement"
    value = "all"
  }

  parameter {
    name = "log_min_duration_statement"
    value = "1000"
  }

  parameter {
    name = "max_connections"
    value = "200"
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-pg15-params"
  }
}

resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-${var.environment}-postgres"

  engine = "postgres"
  engine_version = "15.4"
  instance_class = var.instance_class

  allocated_storage = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type = "gp3"
  storage_encrypted = true

  db_name = "invoicedb"
  username = "dbadmin"
  password = random_password.master.result

  multi_az = true
  db_subnet_group_name = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  parameter_group_name = aws_db_parameter_group.main.name

  backup_retention_period = var.backup_retention_period
  backup_window = "03:00-04:00"
  maintenance_window = "mon:04:00-mon:05:00"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  deletion_protection = true
  skip_final_snapshot = false
  final_snapshot_identifier = "${var.project_name}-${var.environment}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  performance_insights_enabled = true
  performance_insights_retention_period = 7

  tags = {
    Name = "${var.project_name}-${var.environment}-postgres"
  }
}

# Store credentials in AWS Secrets Manager
resource "aws_secretsmanager_secret" "rds_credentials" {
  name = "${var.project_name}-${var.environment}-rds-credentials"
  description = "RDS PostgreSQL credentials"

  recovery_window_in_days = 7

  tags = {
    Name = "${var.project_name}-${var.environment}-rds-credentials"
  }
}

resource "aws_secretsmanager_secret_version" "rds_credentials" {
  secret_id = aws_secretsmanager_secret.rds_credentials.id

  secret_string = jsonencode({
    username = aws_db_instance.main.username
    password = random_password.master.result
    engine = "postgres"
    host = aws_db_instance.main.address
    port = aws_db_instance.main.port
    dbname = aws_db_instance.main.db_name
    url = "postgresql://${aws_db_instance.main.username}:${random_password.master.result}@${aws_db_instance.main.address}:${aws_db_instance.main.port}/${aws_db_instance.main.db_name}"
  })
}
