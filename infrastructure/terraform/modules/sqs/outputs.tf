output "invoice_processing_queue_url" {
  description = "Invoice processing queue URL"
  value       = aws_sqs_queue.invoice_processing.url
}

output "invoice_processing_queue_arn" {
  description = "Invoice processing queue ARN"
  value       = aws_sqs_queue.invoice_processing.arn
}

output "payment_notification_queue_url" {
  description = "Payment notification queue URL"
  value       = aws_sqs_queue.payment_notification.url
}

output "payment_notification_queue_arn" {
  description = "Payment notification queue ARN"
  value       = aws_sqs_queue.payment_notification.arn
}

output "email_queue_url" {
  description = "Email queue URL"
  value       = aws_sqs_queue.email.url
}

output "email_queue_arn" {
  description = "Email queue ARN"
  value       = aws_sqs_queue.email.arn
}

output "payment_events_topic_arn" {
  description = "Payment events SNS topic ARN"
  value       = aws_sns_topic.payment_events.arn
}

output "invoice_events_topic_arn" {
  description = "Invoice events SNS topic ARN"
  value       = aws_sns_topic.invoice_events.arn
}
