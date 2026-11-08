import { Module } from "@nestjs/common"
import { ConfigurableModuleClass } from "./practice.module-definition"
import { PracticeCli } from "./practice.cli"
import { ImportPracticeCli } from "./subs/import.cli"

@Module({ providers: [PracticeCli, ImportPracticeCli] })
/** The practice group: its command and its sub-commands; the import itself is the practice capability's service. */
export class PracticeCliModule extends ConfigurableModuleClass {}
