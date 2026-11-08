import { Module } from "@nestjs/common"
import { ListProjectsHandler } from "./application/list-projects.handler"
import { GetProjectHandler } from "./application/get-project.handler"
import { GetProjectMilestoneHandler } from "./application/get-project-milestone.handler"
import { GetProjectCatalogHandler } from "./application/get-project-catalog.handler"
import { ListProvedProjectConceptsHandler } from "./application/list-proved-project-concepts.handler"
import { CreateProjectHandler } from "./application/create-project.handler"
import { UpdateProjectHandler } from "./application/update-project.handler"
import { DeleteProjectHandler } from "./application/delete-project.handler"
import { SetProjectConceptHandler } from "./application/set-project-concept.handler"
import { ExplainProjectConceptHandler } from "./application/explain-project-concept.handler"
import { RunProjectProbesHandler } from "./application/run-project-probes.handler"
import { RotateProjectCiSecretHandler } from "./application/rotate-project-ci-secret.handler"
import { SyncProjectPracticeHandler } from "./application/sync-project-practice.handler"
import { GetProjectRepositoryHandler } from "./application/get-project-repository.handler"
import { SetProjectRepositoryHandler } from "./application/set-project-repository.handler"
import { ConfigurableModuleClass } from "./project.module-definition"

@Module({
    providers: [
        ListProjectsHandler,
        GetProjectHandler,
        GetProjectMilestoneHandler,
        GetProjectCatalogHandler,
        ListProvedProjectConceptsHandler,
        CreateProjectHandler,
        UpdateProjectHandler,
        DeleteProjectHandler,
        SetProjectConceptHandler,
        ExplainProjectConceptHandler,
        RunProjectProbesHandler,
        RotateProjectCiSecretHandler,
        GetProjectRepositoryHandler,
        SetProjectRepositoryHandler,
        SyncProjectPracticeHandler,
    ],
})
/** Application handlers of the project feature: the learner's projects, milestones, evidence doors and probes. */
export class ProjectApiModule extends ConfigurableModuleClass {}
