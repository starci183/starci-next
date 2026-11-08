import { Module } from "@nestjs/common"
import { IncidentApiModule } from "../../incident.module"
import { ConfigurableModuleClass } from "./incident-graphql.module-definition"
import { IncidentsResolver } from "./incidents.resolver"

@Module({ imports: [IncidentApiModule.register({})], providers: [IncidentsResolver] })
/** The GraphQL transport of the incident feature: the incident list. */
export class IncidentGraphqlModule extends ConfigurableModuleClass {}
