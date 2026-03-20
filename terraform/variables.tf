variable "resource_group_name" {
  type        = string
  description = "The name of the resource group"
  default     = "ctse-microservices-rg"
}

variable "location" {
  type        = string
  description = "The Azure Region"
  default     = "East US"
}

variable "postgres_admin_login" {
  type        = string
  description = "Admin username for PostgreSQL"
  sensitive   = true
}

variable "postgres_admin_password" {
  type        = string
  description = "Admin password for PostgreSQL"
  sensitive   = true
}

variable "aca_env_name" {
  type        = string
  description = "Name for the Azure Container Apps Environment"
  default     = "ctse-env"
}
