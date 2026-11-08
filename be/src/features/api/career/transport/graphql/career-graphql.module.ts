import { Module } from "@nestjs/common"
import { CareerApiModule } from "../../career.module"
import { ConfigurableModuleClass } from "./career-graphql.module-definition"
import { GetMyExperienceResolver } from "./get-my-experience.resolver"
import { GetReviewQueueResolver } from "./get-review-queue.resolver"
import { GetReviewItemResolver } from "./get-review-item.resolver"
import { GetExperienceReviewersResolver } from "./get-experience-reviewers.resolver"
import { VerifyExperienceResolver } from "./verify-experience.resolver"
import { SubmitExperienceResolver } from "./submit-experience.resolver"
import { ShowExperienceResolver } from "./show-experience.resolver"
import { DecideExperienceResolver } from "./decide-experience.resolver"
import { RevokeExperienceResolver } from "./revoke-experience.resolver"
import { AssignExperienceResolver } from "./assign-experience.resolver"
import { SetExperienceReviewerResolver } from "./set-experience-reviewer.resolver"

@Module({
    imports: [CareerApiModule.register({})],
    providers: [
        GetMyExperienceResolver,
        GetReviewQueueResolver,
        GetReviewItemResolver,
        GetExperienceReviewersResolver,
        VerifyExperienceResolver,
        SubmitExperienceResolver,
        ShowExperienceResolver,
        DecideExperienceResolver,
        RevokeExperienceResolver,
        AssignExperienceResolver,
        SetExperienceReviewerResolver,
    ],
})
/** The GraphQL transport of the career feature. */
export class CareerGraphqlModule extends ConfigurableModuleClass {}
