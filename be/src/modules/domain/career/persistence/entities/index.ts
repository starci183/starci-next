import { CareerExperienceItemEntity } from "./career-experience-item.entity"
import { CareerReviewDecisionEntity } from "./career-review-decision.entity"
import { CareerReviewerEntity } from "./career-reviewer.entity"

export { CareerExperienceItemEntity, CareerReviewDecisionEntity, CareerReviewerEntity }

/** The entities of the career capability, named in PRIMARY_ENTITIES of platform/database/entities.ts. */
export const careerEntities: ReadonlyArray<new () => object> = [
    CareerExperienceItemEntity,
    CareerReviewDecisionEntity,
    CareerReviewerEntity,
]
