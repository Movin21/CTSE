variable "resource_group_name" { type = string }
variable "location" { type = string }
variable "server_name" { type = string }
variable "admin_login" { type = string }
variable "admin_password" { type = string }
variable "database_names" { type = list(string) }

resource "azurerm_postgresql_flexible_server" "pg_server" {
  name                   = var.server_name
  resource_group_name    = var.resource_group_name
  location               = var.location
  version                = "16"
  administrator_login    = var.admin_login
  administrator_password = var.admin_password

  sku_name   = "B_Standard_B1ms"
  storage_mb = 32768

  zone = "1"
}

resource "azurerm_postgresql_flexible_server_configuration" "require_secure_transport" {
  name      = "require_secure_transport"
  server_id = azurerm_postgresql_flexible_server.pg_server.id
  value     = "OFF"
}

resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_azure_ips" {
  name             = "AllowAllWindowsAzureIps"
  server_id        = azurerm_postgresql_flexible_server.pg_server.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

resource "azurerm_postgresql_flexible_server_database" "dbs" {
  for_each  = toset(var.database_names)
  name      = each.key
  server_id = azurerm_postgresql_flexible_server.pg_server.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

output "server_fqdn" {
  value       = azurerm_postgresql_flexible_server.pg_server.fqdn
  description = "The fully qualified domain name of the Postgres server."
}
