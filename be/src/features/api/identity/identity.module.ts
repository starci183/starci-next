import { Module } from "@nestjs/common"
import { GetViewerRolesHandler } from "./application/get-viewer-roles.handler"
import { ConfigurableModuleClass } from "./identity.module-definition"

@Module({ providers: [GetViewerRolesHandler] })
/** Application handlers of the identity feature: what the signed-in learner may be shown by role. */
export class IdentityApiModule extends ConfigurableModuleClass {}
