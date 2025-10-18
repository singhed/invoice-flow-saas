variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "cluster_version" {
  description = "Kubernetes version"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "node_instance_type" {
  description = "Instance type for nodes"
  type        = string
}

variable "node_min_size" {
  description = "Minimum number of nodes"
  type        = number
}

variable "node_max_size" {
  description = "Maximum number of nodes"
  type        = number
}

variable "node_desired_size" {
  description = "Desired number of nodes"
  type        = number
}
