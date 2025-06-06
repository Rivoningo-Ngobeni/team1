provider "aws" {
  region = var.aws_region
}

resource "aws_budgets_budget" "monthly_budget" {
  name              = "MonthlyBudget"
  budget_type       = "COST"
  limit_amount      = var.budget_limit
  limit_unit        = "USD"
  time_unit         = "MONTHLY"

  dynamic "notification" {
    for_each = var.alert_thresholds
    content {
      comparison_operator        = "GREATER_THAN"
      notification_type          = "ACTUAL"
      threshold                  = notification.value
      threshold_type             = "PERCENTAGE"
      subscriber_email_addresses = var.alert_emails
    }
  }
}

resource "aws_acm_certificate" "cert" {
  domain_name = "garlic-phone.com"
  validation_method = "DNS"
}

resource "tls_private_key" "team_one_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "team_one_key_pair" {
  key_name   = "team-one-instance-key-pair"
  public_key = tls_private_key.team_one_key.public_key_openssh
}

output "private_key_pem" {
  value     = tls_private_key.team_one_key.private_key_pem
  sensitive = true
}


