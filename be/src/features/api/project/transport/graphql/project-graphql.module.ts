import { Module } from "@nestjs/common"
import { ProjectApiModule } from "../../project.module"
import { ConfigurableModuleClass } from "./project-graphql.module-definition"
import { ListProjectsResolver } from "./list-projects.resolver"
import { GetProjectResolver } from "./get-project.resolver"
import { GetProjectMilestoneResolver } from "./get-project-milestone.resolver"
import { GetProjectCatalogResolver } from "./get-project-catalog.resolver"
import { ListProvedProjectConceptsResolver } from "./list-proved-project-concepts.resolver"
import { CreateProjectResolver } from "./create-project.resolver"
import { UpdateProjectResolver } from "./update-project.resolver"
import { DeleteProjectResolver } from "./delete-project.resolver"
import { SetProjectConceptResolver } from "./set-project-concept.resolver"
import { ExplainProjectConceptResolver } from "./explain-project-concept.resolver"
import { RunProjectProbesResolver } from "./run-project-probes.resolver"
import { RotateProjectCiSecretResolver } from "./rotate-project-ci-secret.resolver"
import { SyncProjectPracticeResolver } from "./sync-project-practice.resolver"
import { GetProjectRepositoryResolver } from "./get-project-repository.resolver"
import { SetProjectRepositoryResolver } from "./set-project-repository.resolver"

@Module({
    imports: [ProjectApiModule.register({})],
    providers: [
        ListProjectsResolver,
        GetProjectResolver,
        GetProjectMilestoneResolver,
        GetProjectCatalogResolver,
        ListProvedProjectConceptsResolver,
        CreateProjectResolver,
        UpdateProjectResolver,
        DeleteProjectResolver,
        SetProjectConceptResolver,
        ExplainProjectConceptResolver,
        RunProjectProbesResolver,
        RotateProjectCiSecretResolver,
        SyncProjectPracticeResolver,
        GetProjectRepositoryResolver,
        SetProjectRepositoryResolver,
    ],
})
/** The GraphQL transport of the project feature. */
export class ProjectGraphqlModule extends ConfigurableModuleClass {}
