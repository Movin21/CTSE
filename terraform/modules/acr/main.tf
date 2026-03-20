variable "resource_group_name" { type = string }
variable "location" { type = string }
variable "registry_name" { type = string }

resource "azurerm_container_registry" "acr" {
  name                = var.registry_name
  resource_group_name = var.resource_group_name
  location            = var.location
  sku                 = "Basic"
  admin_enabled       = true
}

output "login_server" {
  value = azurerm_container_registry.acr.login_server
}

output "admin_username" {
  value = azurerm_container_registry.acr.admin_username
  sensitive = true
}

output "admin_password" {
  value = azurerm_container_registry.acr.admin_password
  sensitive = true
}
