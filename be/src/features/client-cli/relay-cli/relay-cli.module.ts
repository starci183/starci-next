import { Module } from "@nestjs/common"
import { DevicesCliModule } from "./devices/devices.module"
import { InitProjectCliModule } from "./init/init.module"
import { LoginCliModule } from "./login/login.module"
import { LogoutCliModule } from "./logout/logout.module"
import { ConfigurableModuleClass } from "./relay-cli.module-definition"
import { RunTaskCliModule } from "./run/run.module"
import { StatusCliModule } from "./status/status.module"

@Module({
    imports: [
        LoginCliModule.register({}),
        LogoutCliModule.register({}),
        StatusCliModule.register({}),
        DevicesCliModule.register({}),
        RunTaskCliModule.register({}),
        InitProjectCliModule.register({}),
    ],
})
/**
 * The command root of the learner CLI: login, logout, status, devices, run and init, compiled only into apps/relay-cli. It holds
 * no ops command group, so the package a learner installs carries no database, entitlement or ops module.
 */
export class RelayCliModule extends ConfigurableModuleClass {}
