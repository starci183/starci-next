import { Module } from "@nestjs/common"
import { GetMyExperienceHandler } from "./application/get-my-experience.handler"
import { GetReviewQueueHandler } from "./application/get-review-queue.handler"
import { GetReviewItemHandler } from "./application/get-review-item.handler"
import { GetExperienceReviewersHandler } from "./application/get-experience-reviewers.handler"
import { VerifyExperienceHandler } from "./application/verify-experience.handler"
import { SubmitExperienceHandler } from "./application/submit-experience.handler"
import { ShowExperienceHandler } from "./application/show-experience.handler"
import { DecideExperienceHandler } from "./application/decide-experience.handler"
import { RevokeExperienceHandler } from "./application/revoke-experience.handler"
import { AssignExperienceHandler } from "./application/assign-experience.handler"
import { SetExperienceReviewerHandler } from "./application/set-experience-reviewer.handler"
import { ConfigurableModuleClass } from "./career.module-definition"

@Module({
    providers: [
        GetMyExperienceHandler,
        GetReviewQueueHandler,
        GetReviewItemHandler,
        GetExperienceReviewersHandler,
        VerifyExperienceHandler,
        SubmitExperienceHandler,
        ShowExperienceHandler,
        DecideExperienceHandler,
        RevokeExperienceHandler,
        AssignExperienceHandler,
        SetExperienceReviewerHandler,
    ],
})
/** Application handlers of the career feature: the learner's experience items, the review queue, the reviewers and the public verification. */
export class CareerApiModule extends ConfigurableModuleClass {}
