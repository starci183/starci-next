import { Module } from "@nestjs/common"
import { IdentityApiModule } from "../../identity.module"
import { ConfigurableModuleClass } from "./identity-graphql.module-definition"
import { ViewerRolesResolver } from "./viewer-roles.resolver"

@Module({
    imports: [IdentityApiModule.register({})],
    providers: [ViewerRolesResolver],
})
/** The GraphQL transport of the identity feature: the roles of the signed-in learner. */
export class IdentityGraphqlModule extends ConfigurableModuleClass {}
