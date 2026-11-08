import { Injectable } from "@nestjs/common"
import { ProjectError, ProjectErrorCode } from "./errors/project.error"
import type { ProjectCodeReadGrade } from "./project-params.contracts"
import type { ProjectCoach } from "./project-coach.port"

@Injectable()
/** The coach of an instance with no AI pool: it grades nothing and says so. */
export class UnconfiguredProjectCoach implements ProjectCoach {
    /** Fails with PROJECT_COACH_UNCONFIGURED. */
    read(): Promise<ProjectCodeReadGrade> {
        return Promise.reject(new ProjectError({ code: ProjectErrorCode.CoachUnconfigured }))
    }
}
