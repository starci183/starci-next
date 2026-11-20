import type { DynamicModule, Type } from "@nestjs/common"
import { AuthHttpModule } from "@features/api/auth"
import { AttemptGraphqlModule } from "@features/api/attempt"
import { CareerGraphqlModule } from "@features/api/career"
import { CommerceGraphqlModule } from "@features/api/commerce"
import { HubGraphqlModule } from "@features/api/hub"
import { IdentityGraphqlModule } from "@features/api/identity"
import { IncidentGraphqlModule } from "@features/api/incident"
import { LessonGraphqlModule, LessonHttpModule } from "@features/api/lesson"
import { McpGraphqlModule, McpHttpModule } from "@features/api/mcp"
import { NotificationGraphqlModule } from "@features/api/notification"
import { HarnessGraphqlModule } from "@features/api/harness"
import { PathGraphqlModule } from "@features/api/path"
import { ProfileGraphqlModule } from "@features/api/profile"
import { ProgressGraphqlModule } from "@features/api/progress"
import { PracticeGraphqlModule } from "@features/api/practice"
import { ProjectGraphqlModule } from "@features/api/project"
import { RelayGraphqlModule, RelayHttpModule } from "@features/api/relay"
import { RelayFeedGraphqlModule, RelayFeedHttpModule } from "@features/api/relay-feed"
import { ReviewGraphqlModule } from "@features/api/review"
import { GraphqlModule } from "@modules/platform/graphql"

/** The API transports of the app; `starci app add api` registers each generated door here. */
export const apiModules = (): Array<Type<unknown> | DynamicModule> => [
    GraphqlModule.register({ isGlobal: true }),
    CommerceGraphqlModule.register({}),
    AuthHttpModule.register({}),
    IdentityGraphqlModule.register({}),
    LessonGraphqlModule.register({}),
    LessonHttpModule.register({}),
    AttemptGraphqlModule.register({}),
    ReviewGraphqlModule.register({}),
    HubGraphqlModule.register({}),
    ProfileGraphqlModule.register({}),
    ProgressGraphqlModule.register({}),
    PathGraphqlModule.register({}),
    HarnessGraphqlModule.register({}),
    IncidentGraphqlModule.register({}),
    PracticeGraphqlModule.register({}),
    CareerGraphqlModule.register({}),
    ProjectGraphqlModule.register({}),
    NotificationGraphqlModule.register({}),
    RelayGraphqlModule.register({}),
    RelayHttpModule.register({}),
    RelayFeedGraphqlModule.register({}),
    RelayFeedHttpModule.register({}),
    McpGraphqlModule.register({}),
    McpHttpModule.register({}),
]
