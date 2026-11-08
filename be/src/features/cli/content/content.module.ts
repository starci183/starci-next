import { Module } from "@nestjs/common"
import { ConfigurableModuleClass } from "./content.module-definition"
import { ContentCli } from "./content.cli"
import { SyncContentCli } from "./subs/sync.cli"

@Module({ providers: [ContentCli, SyncContentCli] })
/** The content group: its command and its sub-commands; the sync itself is the content capability's service. */
export class ContentCliModule extends ConfigurableModuleClass {}
