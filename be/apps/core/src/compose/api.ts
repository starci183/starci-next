import type { DynamicModule, Type } from "@nestjs/common"
import { AgentLabGraphqlModule } from "@features/api/agent-lab"
import { AttemptGraphqlModule } from "@features/api/attempt"
import { CareerGraphqlModule } from "@features/api/career"
import { CommerceGraphqlModule } from "@features/api/commerce"
import { HubGraphqlModule } from "@features/api/hub"
import { IdentityHttpModule } from "@features/api/identity"
import { IncidentGraphqlModule } from "@features/api/incident"
import { InterviewGraphqlModule } from "@features/api/interview"
import { LessonGraphqlModule } from "@features/api/lesson"
import { NotificationGraphqlModule } from "@features/api/notification"
import { PathGraphqlModule } from "@features/api/path"
import { PracticeGraphqlModule } from "@features/api/practice"
import { ProjectGraphqlModule } from "@features/api/project"
import { RelayGraphqlModule, RelayHttpModule } from "@features/api/relay"
import { ReviewGraphqlModule } from "@features/api/review"
import { GraphqlModule } from "@modules/platform/graphql"

/** The API transports of the app; `starci app add api` registers each generated door here. */
export const apiModules = (): Array<Type<unknown> | DynamicModule> => [
    GraphqlModule.register({ isGlobal: true }),
    CommerceGraphqlModule.register({}),
    IdentityHttpModule.register({}),
    LessonGraphqlModule.register({}),
    AttemptGraphqlModule.register({}),
    InterviewGraphqlModule.register({}),
    ReviewGraphqlModule.register({}),
    HubGraphqlModule.register({}),
    PathGraphqlModule.register({}),
    IncidentGraphqlModule.register({}),
    AgentLabGraphqlModule.register({}),
    PracticeGraphqlModule.register({}),
    CareerGraphqlModule.register({}),
    ProjectGraphqlModule.register({}),
    NotificationGraphqlModule.register({}),
    RelayGraphqlModule.register({}),
    RelayHttpModule.register({}),
]
