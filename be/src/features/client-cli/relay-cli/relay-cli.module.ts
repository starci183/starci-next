import { Module } from "@nestjs/common"
import { CheckCliModule } from "./check/check.module"
import { DevicesCliModule } from "./devices/devices.module"
import { InitProjectCliModule } from "./init/init.module"
import { HarnessCliModule } from "./harness/harness.module"
import { ListenCliModule } from "./listen/listen.module"
import { LoginCliModule } from "./login/login.module"
import { LogoutCliModule } from "./logout/logout.module"
import { ConfigurableModuleClass } from "./relay-cli.module-definition"
import { DownCliModule } from "./down/down.module"
import { PromptCliModule } from "./prompt/prompt.module"
import { PullCliModule } from "./pull/pull.module"
import { RunTaskCliModule } from "./run/run.module"
import { StatusCliModule } from "./status/status.module"
import { UpCliModule } from "./up/up.module"

@Module({
    imports: [
        LoginCliModule.register({}),
        LogoutCliModule.register({}),
        StatusCliModule.register({}),
        DevicesCliModule.register({}),
        RunTaskCliModule.register({}),
        InitProjectCliModule.register({}),
        PullCliModule.register({}),
        UpCliModule.register({}),
        DownCliModule.register({}),
        CheckCliModule.register({}),
        PromptCliModule.register({}),
        ListenCliModule.register({}),
        HarnessCliModule.register({}),
    ],
})
/**
 * The command root of the learner CLI: login, logout, status, devices, run, init and the lesson commands pull, up, down, check and prompt, the harness build group (pull, e2e, ci-report), compiled only into apps/relay-cli. It holds
 * no ops command group, so the package a learner installs carries no database, entitlement or ops module.
 */
export class RelayCliModule extends ConfigurableModuleClass {}
