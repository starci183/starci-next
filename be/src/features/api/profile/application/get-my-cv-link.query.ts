import { Query } from "@nestjs/cqrs"
import type { CvLinkView } from "@modules/domain/profile"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetMyCvLinkRequest } from "./get-my-cv-link.contracts"

/** Asks for the CV link of the signed-in learner. */
export class GetMyCvLinkQuery extends Query<CvLinkView> {
    constructor(readonly params: ExecuteParams<GetMyCvLinkRequest>) {
        super()
    }
}
