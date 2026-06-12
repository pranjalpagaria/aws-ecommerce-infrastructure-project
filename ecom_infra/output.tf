output "rds_endpoint" {
  value       = aws_db_instance.mysql_db.endpoint
  description = "The specific connection string endpoint your Node.js application will target"
}
