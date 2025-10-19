# Invoice Processing Queue
resource "aws_sqs_queue" "invoice_processing_dlq" {
  name = "${var.project_name}-${var.environment}-invoice-processing-dlq"
  message_retention_seconds = 1209600 # 14 days

  tags = {
    Name = "${var.project_name}-${var.environment}-invoice-processing-dlq"
  }
}

resource "aws_sqs_queue" "invoice_processing" {
  name = "${var.project_name}-${var.environment}-invoice-processing-queue"
  delay_seconds = 0
  max_message_size = 262144
  message_retention_seconds = 345600 # 4 days
  receive_wait_time_seconds = 10
  visibility_timeout_seconds = 300

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.invoice_processing_dlq.arn
    maxReceiveCount = 3
  })

  tags = {
    Name = "${var.project_name}-${var.environment}-invoice-processing-queue"
  }
}

# Payment Notification Queue
resource "aws_sqs_queue" "payment_notification_dlq" {
  name = "${var.project_name}-${var.environment}-payment-notification-dlq"
  message_retention_seconds = 1209600 # 14 days

  tags = {
    Name = "${var.project_name}-${var.environment}-payment-notification-dlq"
  }
}

resource "aws_sqs_queue" "payment_notification" {
  name = "${var.project_name}-${var.environment}-payment-notification-queue"
  delay_seconds = 0
  max_message_size = 262144
  message_retention_seconds = 345600 # 4 days
  receive_wait_time_seconds = 10
  visibility_timeout_seconds = 300

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.payment_notification_dlq.arn
    maxReceiveCount = 3
  })

  tags = {
    Name = "${var.project_name}-${var.environment}-payment-notification-queue"
  }
}

# Email Queue
resource "aws_sqs_queue" "email_dlq" {
  name = "${var.project_name}-${var.environment}-email-dlq"
  message_retention_seconds = 1209600 # 14 days

  tags = {
    Name = "${var.project_name}-${var.environment}-email-dlq"
  }
}

resource "aws_sqs_queue" "email" {
  name = "${var.project_name}-${var.environment}-email-queue"
  delay_seconds = 0
  max_message_size = 262144
  message_retention_seconds = 345600 # 4 days
  receive_wait_time_seconds = 10
  visibility_timeout_seconds = 300

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.email_dlq.arn
    maxReceiveCount = 3
  })

  tags = {
    Name = "${var.project_name}-${var.environment}-email-queue"
  }
}

# SNS Topics
resource "aws_sns_topic" "payment_events" {
  name = "${var.project_name}-${var.environment}-payment-events"

  tags = {
    Name = "${var.project_name}-${var.environment}-payment-events"
  }
}

resource "aws_sns_topic" "invoice_events" {
  name = "${var.project_name}-${var.environment}-invoice-events"

  tags = {
    Name = "${var.project_name}-${var.environment}-invoice-events"
  }
}

# SNS to SQS subscriptions
resource "aws_sns_topic_subscription" "payment_to_notification_queue" {
  topic_arn = aws_sns_topic.payment_events.arn
  protocol = "sqs"
  endpoint = aws_sqs_queue.payment_notification.arn
}

resource "aws_sns_topic_subscription" "invoice_to_email_queue" {
  topic_arn = aws_sns_topic.invoice_events.arn
  protocol = "sqs"
  endpoint = aws_sqs_queue.email.arn
}

# SQS Queue Policies to allow SNS to send messages
resource "aws_sqs_queue_policy" "payment_notification_policy" {
  queue_url = aws_sqs_queue.payment_notification.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = "*"
        Action = "sqs:SendMessage"
        Resource = aws_sqs_queue.payment_notification.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.payment_events.arn
          }
        }
      }
    ]
  })
}

resource "aws_sqs_queue_policy" "email_policy" {
  queue_url = aws_sqs_queue.email.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = "*"
        Action = "sqs:SendMessage"
        Resource = aws_sqs_queue.email.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.invoice_events.arn
          }
        }
      }
    ]
  })
}
