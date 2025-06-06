resource "aws_lb" "team_one_alb" {
  name               = "team-one-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_security_group.id]
  subnets            = [aws_subnet.default_subnet.id, aws_subnet.second_subnet.id]

  enable_deletion_protection = false

  tags = {
    Name = "team_one-application-load-balancer"
  }
}

resource "aws_lb_target_group" "team_one_target_group" {
  port     = var.api_port
  protocol = "HTTP"
  vpc_id   = aws_vpc.team_one_vpc.id

  health_check {
    path                = "/api/health"
    port                = var.api_port
    protocol            = "HTTP"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }
}

resource "aws_lb_target_group_attachment" "team_one_tg_attachment" {
  target_group_arn = aws_lb_target_group.team_one_target_group.arn
  target_id        = aws_instance.team_one_instance.id
  port             = var.api_port
}

resource "aws_lb_listener" "http_listener" {
  load_balancer_arn = aws_lb.team_one_alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.team_one_target_group.arn
  }
}

resource "aws_lb_listener" "https_listener" {
  load_balancer_arn = aws_lb.team_one_alb.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = var.acm_certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.team_one_target_group.arn
  }
}
