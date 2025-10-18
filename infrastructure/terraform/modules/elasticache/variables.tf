variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs"
  type        = list(string)
}

variable "node_type" {
  description = "Redis node type"
  type        = string
}

variable "num_cache_clusters" {
  description = "Number of cache clusters (shards)"
  type        = number
}

variable "replicas_per_shard" {
  description = "Number of replicas per shard"
  type        = number
}

variable "allowed_security_group_id" {
  description = "Security group ID allowed to access Redis"
  type        = string
}
