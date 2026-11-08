import { Module } from "@nestjs/common"
import { CareerCliModule } from "./career/career.module"
import { ConfigurableModuleClass } from "./cli.module-definition"
import { ContentCliModule } from "./content/content.module"
import { MigrateModule } from "./migrate/migrate.module"
import { SeedModule } from "./seed/seed.module"
import { InterviewCliModule } from "./interview/interview.module"
import { LessonCliModule } from "./lesson/lesson.module"
import { PracticeCliModule } from "./practice/practice.module"
import { ReviewCliModule } from "./review/review.module"

@Module({
    imports: [
        MigrateModule.register({}),
        SeedModule.register({}),
        InterviewCliModule.register({}),
        LessonCliModule.register({}),
        PracticeCliModule.register({}),
        ReviewCliModule.register({}),
        CareerCliModule.register({}),
        ContentCliModule.register({}),
    ],
})
/** The cli feature root: every command group of the back end, compiled only into apps/cli. */
export class CliModule extends ConfigurableModuleClass {}
