import { Module, type DynamicModule } from "@nestjs/common"
import { RELAY_LAB_CONTRACT } from "@modules/domain/relay"
import { CourseCaseService } from "./course-case.service"
import { CourseCatalogService } from "./course-catalog.service"
import { CourseLabContractAdapter } from "./course-lab-contract.adapter"
import { CourseLabService } from "./course-lab.service"
import { CourseRungService } from "./course-rung.service"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./course.module-definition"

@Module({})
/**
 * The course capability of Essentials v2: the lab@2 records, the course catalog, the learner's state in each case, the hints they opened and the ladder rungs.
 * It also answers the relay's lab contract port (`RELAY_LAB_CONTRACT`, from the lab and lab files records) and exports it, so the global module replaces the
 * relay's unconfigured adapter.
 */
export class CourseModule extends ConfigurableModuleClass {
    /** Registers the lab reads, the case state and the relay's lab contract. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        return {
            ...base,
            providers: [
                ...(base.providers ?? []),
                CourseLabService,
                CourseCaseService,
                CourseRungService,
                CourseCatalogService,
                CourseLabContractAdapter,
                { provide: RELAY_LAB_CONTRACT, useExisting: CourseLabContractAdapter },
            ],
            exports: [CourseLabService, CourseCaseService, CourseRungService, CourseCatalogService, RELAY_LAB_CONTRACT],
        }
    }
}
