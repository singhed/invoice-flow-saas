# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/eks/${var.project_name}-${var.environment}/application"
  retention_in_days = 7

  tags = {
    Name = "${var.project_name}-${var.environment}-application-logs"
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-${var.environment}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/EKS", "cluster_failed_node_count", { stat = "Average" }],
            [".", "cluster_node_count", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "EKS Cluster Nodes"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", { stat = "Average" }],
            [".", "DatabaseConnections", { stat = "Average" }],
            [".", "FreeableMemory", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "RDS Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ElastiCache", "CPUUtilization", { stat = "Average" }],
            [".", "DatabaseMemoryUsagePercentage", { stat = "Average" }],
            [".", "NetworkBytesIn", { stat = "Sum" }],
            [".", "NetworkBytesOut", { stat = "Sum" }]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "Redis Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/SQS", "NumberOfMessagesSent", { stat = "Sum" }],
            [".", "NumberOfMessagesReceived", { stat = "Sum" }],
            [".", "ApproximateNumberOfMessagesVisible", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "SQS Metrics"
        }
      }
    ]
  })
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "${var.project_name}-${var.environment}-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"

  dimensions = {
    DBInstanceIdentifier = "${var.project_name}-${var.environment}-postgres"
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-rds-cpu-high"
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_storage_low" {
  alarm_name          = "${var.project_name}-${var.environment}-rds-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "10737418240" # 10 GB
  alarm_description   = "This metric monitors RDS free storage space"

  dimensions = {
    DBInstanceIdentifier = "${var.project_name}-${var.environment}-postgres"
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-rds-storage-low"
  }
}

resource "aws_cloudwatch_metric_alarm" "redis_cpu_high" {
  alarm_name          = "${var.project_name}-${var.environment}-redis-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "75"
  alarm_description   = "This metric monitors Redis CPU utilization"

  tags = {
    Name = "${var.project_name}-${var.environment}-redis-cpu-high"
  }
}

resource "aws_cloudwatch_metric_alarm" "redis_memory_high" {
  alarm_name          = "${var.project_name}-${var.environment}-redis-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "90"
  alarm_description   = "This metric monitors Redis memory usage"

  tags = {
    Name = "${var.project_name}-${var.environment}-redis-memory-high"
  }
}

resource "aws_cloudwatch_metric_alarm" "eks_node_count_low" {
  alarm_name          = "${var.project_name}-${var.environment}-eks-node-count-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "cluster_node_count"
  namespace           = "AWS/EKS"
  period              = "300"
  statistic           = "Average"
  threshold           = "2"
  alarm_description   = "This metric monitors EKS node count"

  dimensions = {
    ClusterName = var.eks_cluster_id
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-eks-node-count-low"
  }
}

# SNS Topic for alarms
resource "aws_sns_topic" "alarms" {
  name = "${var.project_name}-${var.environment}-alarms"

  tags = {
    Name = "${var.project_name}-${var.environment}-alarms"
  }
}
