import { ProfileLearnerEntity } from "./entities/profile-learner.entity"
import { InitProfile1798400000000 } from "./migrations/1798400000000-init-profile"
import { ProfileCvLink1798800000002 } from "./migrations/1798800000002-profile-cv-link"

/** The entities of the profile capability. */
export const profileEntities: Array<typeof ProfileLearnerEntity> = [ProfileLearnerEntity]

/** The migrations of the profile capability, in the order they run. */
export const profileMigrations: Array<typeof InitProfile1798400000000 | typeof ProfileCvLink1798800000002> = [
    InitProfile1798400000000,
    ProfileCvLink1798800000002,
]
