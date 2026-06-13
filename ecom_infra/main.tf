module "network" {
    source = "./modules/network"
    # we can give any input variable here
}

module "security" {
    source = "./modules/security"
    vpc_id = module.network.vpc_id
    vpc_cidr_block = module.network.vpc_cidr_block
}
module "database" {
    source = "./modules/database"

    private_subnet_ids = module.network.private_subnet_ids
    db_sg_id           = module.security.db_sg_id

    depends_on = [
    module.network,
    module.security
  ]
}