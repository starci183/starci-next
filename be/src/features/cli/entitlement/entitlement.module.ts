import { Module } from "@nestjs/common"
import { EntitlementCli } from "./entitlement.cli"
import { ConfigurableModuleClass } from "./entitlement.module-definition"
import { DevGrantCli } from "./subs/dev-grant.cli"

@Module({ providers: [EntitlementCli, DevGrantCli] })
/** The entitlement group: its command and its sub-command; the work itself is the entitlement capability's service. */
export class EntitlementCliModule extends ConfigurableModuleClass {}
