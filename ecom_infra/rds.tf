resource "aws_db_instance" "mysql_db" {
  identifier            = "mumbai-ecommerce-mysql-db"
  engine                = "mysql"
  engine_version        = "8.4.9"               
  instance_class        = "db.t4g.micro"         
  allocated_storage     = 20                     
  max_allocated_storage = 50                    
  storage_type          = "gp3"
  
  db_name               = "ecommerce_prod"
  username              = "admin_user"
  password              = "SecurePass2026!"      
  
  db_subnet_group_name   = aws_db_subnet_group.rds_group.name
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  
  publicly_accessible  = false                  
  skip_final_snapshot  = true                   

  tags = {
    Name        = "ecommerce-mysql-primary"
    Environment = "production"
  }
}
