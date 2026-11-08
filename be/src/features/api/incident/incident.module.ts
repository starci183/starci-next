import { Module } from "@nestjs/common"
import { ListIncidentsHandler } from "./application/list-incidents.handler"
import { ConfigurableModuleClass } from "./incident.module-definition"

@Module({ providers: [ListIncidentsHandler] })
/** Application handlers of the incident feature: the list of Essentials lessons and their tier-2 incident. */
export class IncidentApiModule extends ConfigurableModuleClass {}
