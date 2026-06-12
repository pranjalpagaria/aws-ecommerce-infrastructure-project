terraform {
  required_version = ">= 1.0.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # This configures Terraform to store state files in S3 remotely
  backend "s3" {
    bucket         = "terraform-state-bucket-pranjal" # Change to a globally unique name
    key            = "ecommerce/production/terraform.tfstate"
    region         = "ap-south-1"                                # Mumbai Region
    encrypt        = true
    dynamodb_table = "terraform-lock-table"                      # Optional: For state locking
  }
}

provider "aws" {
  region = "ap-south-1" # Setting default provider target to Mumbai
}
