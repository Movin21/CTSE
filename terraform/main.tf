resource "azurerm_resource_group" "rg" {
  name     = var.resource_group_name
  location = var.location
}

module "postgres_dbs" {
  source              = "./modules/postgres"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  server_name         = "ctse-pg-server-${random_id.suffix.hex}"
  admin_login         = var.postgres_admin_login
  admin_password      = var.postgres_admin_password
  database_names      = ["identity_db", "product_db", "order_db", "notification_db"]
}

module "container_apps_env" {
  source              = "./modules/aca_env"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  environment_name    = var.aca_env_name
}

module "acr" {
  source              = "./modules/acr"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  registry_name       = "ctseacr${random_id.suffix.hex}"
}

output "acr_login_server" {
  value = module.acr.login_server
}

output "acr_admin_username" {
  value     = module.acr.admin_username
  sensitive = true
}

output "acr_admin_password" {
  value     = module.acr.admin_password
  sensitive = true
}

resource "random_id" "suffix" {
  byte_length = 4
}
