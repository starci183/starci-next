import { Query } from "@nestjs/cqrs"
import type { PublicCvView } from "@modules/domain/profile"
import type { PublicExecuteParams } from "@modules/platform/cqrs"
import type { GetPublicCvRequest } from "./get-public-cv.contracts"

/** Reads the verified lines a learner shows on a public CV. */
export class GetPublicCvQuery extends Query<PublicCvView> {
    constructor(readonly params: PublicExecuteParams<GetPublicCvRequest>) {
        super()
    }
}
