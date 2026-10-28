import { Module } from "@nestjs/common"
import { ConfigurableModuleClass } from "./cli.module-definition"
import { LessonsModule } from "./lessons/lessons.module"
import { MigrateModule } from "./migrate/migrate.module"
import { SeedModule } from "./seed/seed.module"

@Module({ imports: [LessonsModule.register({}), MigrateModule.register({}), SeedModule.register({})] })
/** The cli feature root: every command group of the back end, compiled only into apps/cli. */
export class CliModule extends ConfigurableModuleClass {}
