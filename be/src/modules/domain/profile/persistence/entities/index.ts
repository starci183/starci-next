import { ProfileLearnerEntity } from "./profile-learner.entity"

export { ProfileLearnerEntity }

/** The entities of the profile capability, named in PRIMARY_ENTITIES of platform/database/entities.ts. */
export const profileEntities: ReadonlyArray<new () => object> = [ProfileLearnerEntity]
