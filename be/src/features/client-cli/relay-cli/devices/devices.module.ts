import { Module } from "@nestjs/common"
import { ConfigurableModuleClass } from "./devices.module-definition"
import { DevicesCli } from "./devices.cli"

@Module({ providers: [DevicesCli] })
/** The devices command of the learner CLI; the relay client comes from the learner root. */
export class DevicesCliModule extends ConfigurableModuleClass {}
