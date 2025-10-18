terraform {
  backend "s3" {
    bucket         = "invoice-saas-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "invoice-saas-terraform-locks"
  }
}
