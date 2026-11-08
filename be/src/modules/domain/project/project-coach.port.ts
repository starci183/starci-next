import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { ProjectCodeReadGrade, ProjectCodeReadRequest } from "./project-params.contracts"

/**
 * The AI teacher of the Projects shard: it reads the code a learner points to and their explanation and grades them with the rubric of the matching
 * Essentials lesson. An object, not a bare function, so a unit spec doubles it with `mock<ProjectCoach>()`. An implementation honours
 * `timeoutMs`, sends the provider nothing that names a learner, treats the excerpt and the explanation as untrusted quoted data and
 * fails with a `ProjectError`.
 */
export interface ProjectCoach {
    /** Grades the explanation per rubric criterion and asks one Socratic question. */
    read(request: ProjectCodeReadRequest): Promise<ProjectCodeReadGrade>
}

/** Token of the project coach. */
export const PROJECT_COACH: unique symbol = Symbol("domain.project.coach")

/** Injects the project coach. Parameter type: ProjectCoach. */
export const InjectProjectCoach = (): TypedParameterDecorator<ProjectCoach> => injector<ProjectCoach>(PROJECT_COACH)
