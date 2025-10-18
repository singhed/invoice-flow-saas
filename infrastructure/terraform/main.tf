terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }

  backend "s3" {
    # Configure backend in environment-specific config files
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = merge(
      {
        Project     = var.project_name
        Environment = var.environment
        ManagedBy   = "Terraform"
      },
      var.tags
    )
  }
}

# Data source for EKS cluster auth
data "aws_eks_cluster" "cluster" {
  name = module.eks.cluster_name
  depends_on = [module.eks]
}

data "aws_eks_cluster_auth" "cluster" {
  name = module.eks.cluster_name
  depends_on = [module.eks]
}

provider "kubernetes" {
  host                   = data.aws_eks_cluster.cluster.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.cluster.token
}

provider "helm" {
  kubernetes {
    host                   = data.aws_eks_cluster.cluster.endpoint
    cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority[0].data)
    token                  = data.aws_eks_cluster_auth.cluster.token
  }
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  project_name       = var.project_name
  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
}

# EKS Module
module "eks" {
  source = "./modules/eks"

  project_name          = var.project_name
  environment           = var.environment
  cluster_version       = var.eks_cluster_version
  vpc_id                = module.vpc.vpc_id
  private_subnet_ids    = module.vpc.private_subnet_ids
  node_instance_type    = var.eks_node_instance_type
  node_min_size         = var.eks_node_min_size
  node_max_size         = var.eks_node_max_size
  node_desired_size     = var.eks_node_desired_size
}

# RDS Module
module "rds" {
  source = "./modules/rds"

  project_name              = var.project_name
  environment               = var.environment
  vpc_id                    = module.vpc.vpc_id
  database_subnet_ids       = module.vpc.database_subnet_ids
  instance_class            = var.rds_instance_class
  allocated_storage         = var.rds_allocated_storage
  max_allocated_storage     = var.rds_max_allocated_storage
  backup_retention_period   = var.rds_backup_retention_period
  allowed_security_group_id = module.eks.node_security_group_id
}

# ElastiCache Redis Module
module "elasticache" {
  source = "./modules/elasticache"

  project_name              = var.project_name
  environment               = var.environment
  vpc_id                    = module.vpc.vpc_id
  subnet_ids                = module.vpc.database_subnet_ids
  node_type                 = var.redis_node_type
  num_cache_clusters        = var.redis_num_cache_clusters
  replicas_per_shard        = var.redis_replicas_per_shard
  allowed_security_group_id = module.eks.node_security_group_id
}

# SQS Module
module "sqs" {
  source = "./modules/sqs"

  project_name = var.project_name
  environment  = var.environment
}

# S3 Module
module "s3" {
  source = "./modules/s3"

  project_name = var.project_name
  environment  = var.environment
}

# CloudWatch Module
module "cloudwatch" {
  source = "./modules/cloudwatch"

  project_name   = var.project_name
  environment    = var.environment
  eks_cluster_id = module.eks.cluster_name
}
