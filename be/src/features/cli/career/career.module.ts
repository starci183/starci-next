import { Module } from "@nestjs/common"
import { CareerCli } from "./career.cli"
import { ConfigurableModuleClass } from "./career.module-definition"
import { EscalateExperienceCli } from "./subs/escalate.cli"
import { SeedExperienceCli } from "./subs/seed.cli"

@Module({ providers: [CareerCli, SeedExperienceCli, EscalateExperienceCli] })
/** The career group: its command and its sub-commands; the work itself is the career capability's services. */
export class CareerCliModule extends ConfigurableModuleClass {}
