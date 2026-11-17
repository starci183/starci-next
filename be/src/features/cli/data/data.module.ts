import { Module } from "@nestjs/common"
import { DataCli } from "./data.cli"
import { ConfigurableModuleClass } from "./data.module-definition"
import { DataDatabaseCli } from "./subs/database.cli"

@Module({ providers: [DataCli, DataDatabaseCli] })
/** The data group: its command and its sub-commands; the seed door comes from the data standard integration. */
export class DataCliModule extends ConfigurableModuleClass {}
