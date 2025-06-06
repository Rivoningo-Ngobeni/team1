variable "aws_region" {
  type    = string
  default = "af-south-1"
}

variable "vpc_cidr_block" {
  type    = string
  default = "10.0.0.0/16"
}

variable "subnet_cidr_block" {
  type    = string
  default = "10.0.1.0/24"
}

variable "second_subnet_cidr_block" {
  type    = string
  default = "10.0.2.0/24"
}

variable "availability_zone" {
  type    = string
  default = "af-south-1a"
}

variable "availability_zone_b" {
  type    = string
  default = "af-south-1b"
}

variable "ami_id" {
  type    = string
  default = "ami-00d6d5db7a745ff3f"
}

variable "instance_type" {
  type    = string
  default = "t3.micro"
}

variable "api_port" {
  type    = number
  default = 80
}

variable "db_name" {
  type      = string
  sensitive = true
  default = "team_one_db"
}

variable "db_username" {
  type = string
  default = "team_one_admin"
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "db_port" {
  type    = number
  default = 5432
}

variable "instance_key_pair_name" {
  type    = string
  default = "team-one-instance-key-pair"
}

variable "budget_limit" {
  default = 50
}

variable "alert_thresholds" {
  default = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
}

variable "alert_emails" {
  default = [
    "rudolphe@bbdsoftware.com",
    "rivoningo@bbd.co.za",
    "Anika.Bezuidenhout@bbd.co.za",
    "Katlego.Sekoele@bbd.co.za",
    "Kyle.Wilkins@bbd.co.za",
    "sibongile@bbd.co.za"
  ]
}

# variable "acm_certificate_arn" {
#   type        = string
#   description = "The ARN of the ACM certificate"
# }
