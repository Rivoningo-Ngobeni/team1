resource "aws_instance" "team_one_instance" {
  ami           = var.ami_id
  instance_type = var.instance_type

  subnet_id                   = aws_subnet.default_subnet.id
  vpc_security_group_ids      = [aws_security_group.instance_security_group.id]
  associate_public_ip_address = true

  key_name = aws_key_pair.team_one_key_pair.key_name

  user_data = file("data/instance_init_data.sh")

  tags = {
    Name = "team-one-api-instance"
  }
}
