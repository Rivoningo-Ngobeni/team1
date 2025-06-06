output "ec2_endpoint" {
  value = aws_instance.team_one_instance.public_dns
  description = "Public DNS of the EC2 instance (not necessary since we use ALB)"
}

output "db_endpoint" {
  value = aws_db_instance.team_one_db_instance.endpoint
}

output "alb_dns_name" {
  value = aws_lb.team_one_alb.dns_name
  description = "The DNS name of the Application Load Balancer"
}