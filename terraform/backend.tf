terraform {
  backend "azurerm" {
    resource_group_name  = "tfstate-rg"
    storage_account_name = "ctsetfstatestg2026"
    container_name       = "tfstate-cont"
    key                  = "ctse.terraform.tfstate"
  }
}
