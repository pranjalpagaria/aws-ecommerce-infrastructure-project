resource "aws_security_group" "db_sg" {
  name        = "ecommerce-db-security-group"
  description = "Controls inbound network access specifically to the MySQL RDS instance"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr_block] 
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "ecommerce-db-sg" }
}
