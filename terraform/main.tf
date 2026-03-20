resource "azurerm_resource_group" "rg" {
  name     = var.resource_group_name
  location = var.location
}

module "postgres_dbs" {
  source                  = "./modules/postgres"
  resource_group_name     = azurerm_resource_group.rg.name
  location                = azurerm_resource_group.rg.location
  server_name             = "ctse-pg-server-${random_id.suffix.hex}"
  admin_login             = var.postgres_admin_login
  admin_password          = var.postgres_admin_password
  database_names          = ["identity_db", "product_db", "order_db", "notification_db"]
}

module "container_apps_env" {
  source              = "./modules/aca_env"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  environment_name    = var.aca_env_name
}

resource "random_id" "suffix" {
  byte_length = 4
}
