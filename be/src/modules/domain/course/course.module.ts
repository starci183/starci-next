import { Module, type DynamicModule } from "@nestjs/common"
import { CourseCaseService } from "./course-case.service"
import { CourseLabService } from "./course-lab.service"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./course.module-definition"

@Module({})
/** The course capability of Essentials v2: the lab@2 records, the learner's state in each case and the hints they opened. */
export class CourseModule extends ConfigurableModuleClass {
    /** Registers the lab reads and the case state. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        return {
            ...base,
            providers: [...(base.providers ?? []), CourseLabService, CourseCaseService],
            exports: [CourseLabService, CourseCaseService],
        }
    }
}
