import { Module } from "@nestjs/common"
import { CareerCliModule } from "./career/career.module"
import { ConfigurableModuleClass } from "./cli.module-definition"
import { EntitlementCliModule } from "./entitlement/entitlement.module"
import { DataCliModule } from "./data/data.module"
import { McpCliModule } from "./mcp/mcp.module"
import { LessonCliModule } from "./lesson/lesson.module"
import { PracticeCliModule } from "./practice/practice.module"
import { ReviewCliModule } from "./review/review.module"

@Module({
    imports: [
        LessonCliModule.register({}),
        PracticeCliModule.register({}),
        ReviewCliModule.register({}),
        CareerCliModule.register({}),
        EntitlementCliModule.register({}),
        DataCliModule.register({}),
        McpCliModule.register({}),
    ],
})
/** The cli feature root: every command group of the back end, compiled only into apps/cli. */
export class CliModule extends ConfigurableModuleClass {}
