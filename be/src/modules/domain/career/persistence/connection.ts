import { CareerExperienceItemEntity } from "./entities/career-experience-item.entity"
import { CareerReviewDecisionEntity } from "./entities/career-review-decision.entity"
import { CareerReviewerEntity } from "./entities/career-reviewer.entity"
import { InitCareer1797300000000 } from "./migrations/1797300000000-init-career"

/** The entities of the career capability, for the connection that holds them. */
export const careerEntities: Array<
    typeof CareerExperienceItemEntity | typeof CareerReviewDecisionEntity | typeof CareerReviewerEntity
> = [CareerExperienceItemEntity, CareerReviewDecisionEntity, CareerReviewerEntity]

/** The migrations of the career capability, in the order they run. */
export const careerMigrations: Array<typeof InitCareer1797300000000> = [InitCareer1797300000000]
