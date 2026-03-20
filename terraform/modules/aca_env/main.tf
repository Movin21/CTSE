variable "resource_group_name" { type = string }
variable "location" { type = string }
variable "environment_name" { type = string }

resource "azurerm_container_app_environment" "aca_env" {
  name                = var.environment_name
  location            = var.location
  resource_group_name = var.resource_group_name

  # Omitting log_analytics_workspace_id prevents creating/attaching a LA workspace, making it minimal cost

  # For low cost workloads or standard hosting, no special workload profiles are needed unless requested.
}

output "env_id" {
  value = azurerm_container_app_environment.aca_env.id
}

output "default_domain" {
  value = azurerm_container_app_environment.aca_env.default_domain
}
