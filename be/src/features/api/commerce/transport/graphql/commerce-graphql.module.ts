import { Module } from "@nestjs/common"
import { CommerceModule } from "../../commerce.module"
import { ConfigurableModuleClass } from "./commerce-graphql.module-definition"
import { ListPlansResolver } from "./list-plans.resolver"

@Module({ imports: [CommerceModule.register({})], providers: [ListPlansResolver] })
/** The GraphQL transport of the commerce feature: the public Premium plans read. */
export class CommerceGraphqlModule extends ConfigurableModuleClass {}
