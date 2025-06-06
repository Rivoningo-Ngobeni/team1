# terraform backend
terraform {
  backend "s3" {
    bucket  = "team-one-terraform-state"
    key     = "terraform.tfstate"
    region  = "af-south-1"
  }
}
