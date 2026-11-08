import { Query } from "@nestjs/cqrs"
import type { VerificationView } from "@modules/domain/career"
import type { PublicExecuteParams } from "@modules/platform/cqrs"
import type { VerifyExperienceRequest } from "./verify-experience.contracts"

/** Reads the public verification of one item. */
export class VerifyExperienceQuery extends Query<VerificationView> {
    constructor(readonly params: PublicExecuteParams<VerifyExperienceRequest>) {
        super()
    }
}
