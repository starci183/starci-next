import { Query } from "@nestjs/cqrs"
import type { ProfileView } from "@modules/domain/profile"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetMyProfileRequest } from "./get-my-profile.contracts"

/** Asks for the profile of the signed-in learner. */
export class GetMyProfileQuery extends Query<ProfileView> {
    constructor(readonly params: ExecuteParams<GetMyProfileRequest>) {
        super()
    }
}
